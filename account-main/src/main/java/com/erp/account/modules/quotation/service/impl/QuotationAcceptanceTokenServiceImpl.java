package com.erp.account.modules.quotation.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ResourceNotFoundException;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicItemDto;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationAcceptanceTokenRepository;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import com.erp.account.util.TermsFormatter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationAcceptanceTokenServiceImpl implements QuotationAcceptanceTokenService {

    private record CachedToken(String rawToken, String tokenHash, LocalDateTime expiresAt) {}

    private final QuotationAcceptanceTokenRepository tokenRepository;
    private final QuotationRepository quotationRepository;
    @org.springframework.context.annotation.Lazy
    private final com.erp.account.modules.salesorder.service.SalesOrderService salesOrderService;
    private final com.erp.account.modules.salesorder.repository.SalesOrderRepository salesOrderRepository;
    @org.springframework.context.annotation.Lazy
    private final com.erp.account.integration.workflow.client.WorkflowServiceClient workflowServiceClient;

    @Value("${quotation.acceptance.token.expiry-days:7}")
    private int expiryDays;

    private final SecureRandom secureRandom = new SecureRandom();
    private final Map<UUID, CachedToken> tokenCache = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public String generateToken(Quotation quotation) {
        if (quotation == null || quotation.getId() == null) {
            throw new BadRequestException("Valid quotation is required for token generation");
        }

        if (quotation.getValidUntil() != null && quotation.getValidUntil().isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot generate acceptance token for an expired quotation");
        }

        if (quotation.getStatus() == QuotationStatus.CANCELLED || quotation.getStatus() == QuotationStatus.EXPIRED) {
            throw new BadRequestException("Cannot generate acceptance token for a " + quotation.getStatus() + " quotation");
        }

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        String tokenHash = hashToken(rawToken);

        LocalDateTime expiresAt;
        if (quotation.getValidUntil() != null) {
            expiresAt = quotation.getValidUntil().atTime(23, 59, 59);
        } else {
            expiresAt = LocalDateTime.now().plusDays(expiryDays);
        }

        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .quotationId(quotation.getId())
                .quotation(quotation)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();

        tokenRepository.save(token);

        tokenCache.put(quotation.getId(), new CachedToken(rawToken, tokenHash, expiresAt));
        log.info("Generated new quotation acceptance token for quotation {}", quotation.getQuotationNumber());

        return rawToken;
    }

    @Override
    @Transactional
    public String getOrCreateToken(Quotation quotation) {
        if (quotation == null || quotation.getId() == null) {
            throw new BadRequestException("Valid quotation is required");
        }

        CachedToken cached = tokenCache.get(quotation.getId());
        if (cached != null && cached.expiresAt().isAfter(LocalDateTime.now())) {
            Optional<QuotationAcceptanceToken> optToken = tokenRepository.findByTokenHash(cached.tokenHash());
            if (optToken.isPresent() && optToken.get().isValid()) {
                return cached.rawToken();
            } else {
                tokenCache.remove(quotation.getId());
            }
        }

        return generateToken(quotation);
    }

    @Override
    @Transactional
    public QuotationAcceptResponse acceptQuotation(String rawToken) {
        String tokenHash = hashToken(rawToken);

        QuotationAcceptanceToken token = tokenRepository.findByTokenHashWithLock(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired quotation acceptance token"));

        if (token.isRevoked()) {
            throw new BadRequestException("This acceptance link has been revoked");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This acceptance link has expired");
        }

        if (token.isUsed()) {
            return QuotationAcceptResponse.builder()
                    .success(false)
                    .message("Quotation has already been accepted")
                    .quotationId(token.getQuotationId())
                    .acceptedAt(token.getUsedAt())
                    .build();
        }

        Quotation quotation = token.getQuotation();
        if (quotation == null) {
            quotation = quotationRepository.findById(token.getQuotationId())
                    .orElseThrow(() -> new BadRequestException("Associated quotation not found"));
        }

        if (quotation.getStatus() == QuotationStatus.ACCEPTED || quotation.getStatus() == QuotationStatus.CUSTOMER_ACCEPTED) {
            return QuotationAcceptResponse.builder()
                    .success(false)
                    .message("Quotation has already been accepted")
                    .quotationId(quotation.getId())
                    .acceptedAt(quotation.getApprovedAt())
                    .build();
        }

        if (quotation.getStatus() == QuotationStatus.REJECTED ||
                quotation.getStatus() == QuotationStatus.CANCELLED ||
                quotation.getStatus() == QuotationStatus.EXPIRED) {
            throw new BadRequestException("Cannot accept a quotation in " + quotation.getStatus() + " status");
        }

        LocalDateTime now = LocalDateTime.now();
        quotation.setStatus(QuotationStatus.ACCEPTED);
        quotation.setApprovedAt(now);
        quotationRepository.save(quotation);

        token.setUsedAt(now);
        tokenRepository.save(token);

        tokenCache.remove(quotation.getId());
        log.info("Quotation {} accepted via token {}", quotation.getId(), token.getId());

        triggerAutoCreateOrderIfEligible(quotation);

        return QuotationAcceptResponse.builder()
                .success(true)
                .message("Quotation accepted successfully")
                .quotationId(quotation.getId())
                .acceptedAt(now)
                .build();
    }

    @Override
    @Transactional
    public QuotationRejectResponse rejectQuotation(String rawToken, String reason) {
        String tokenHash = hashToken(rawToken);

        QuotationAcceptanceToken token = tokenRepository.findByTokenHashWithLock(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid or expired quotation link"));

        if (token.isRevoked()) {
            throw new BadRequestException("This link has been revoked");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This link has expired");
        }

        if (token.isUsed()) {
            return QuotationRejectResponse.builder()
                    .success(false)
                    .message("Quotation has already been processed")
                    .quotationId(token.getQuotationId())
                    .build();
        }

        Quotation quotation = token.getQuotation();
        if (quotation == null) {
            quotation = quotationRepository.findById(token.getQuotationId())
                    .orElseThrow(() -> new BadRequestException("Associated quotation not found"));
        }

        if (quotation.getStatus() == QuotationStatus.ACCEPTED || quotation.getStatus() == QuotationStatus.CUSTOMER_ACCEPTED) {
            throw new BadRequestException("Cannot reject an already accepted quotation");
        }

        if (quotation.getStatus() == QuotationStatus.REJECTED) {
            return QuotationRejectResponse.builder()
                    .success(false)
                    .message("Quotation has already been rejected")
                    .quotationId(quotation.getId())
                    .build();
        }

        if (quotation.getStatus() == QuotationStatus.CANCELLED || quotation.getStatus() == QuotationStatus.EXPIRED) {
            throw new BadRequestException("Cannot reject a quotation in " + quotation.getStatus() + " status");
        }

        LocalDateTime now = LocalDateTime.now();
        quotation.setStatus(QuotationStatus.REJECTED);

        if (reason != null && !reason.trim().isEmpty()) {
            String existingNotes = quotation.getNotes() != null ? quotation.getNotes().trim() : "";
            String rejectionEntry = "[Customer Rejection Reason]: " + reason.trim();
            quotation.setNotes(existingNotes.isEmpty() ? rejectionEntry : existingNotes + "\n" + rejectionEntry);
        }

        quotationRepository.save(quotation);

        token.setUsedAt(now);
        tokenRepository.save(token);

        tokenCache.remove(quotation.getId());
        log.info("Quotation {} rejected via token {}", quotation.getId(), token.getId());

        return QuotationRejectResponse.builder()
                .success(true)
                .message("Quotation declined successfully")
                .quotationId(quotation.getId())
                .rejectedAt(now)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public QuotationPublicViewResponse getPublicQuotation(String rawToken) {
        String tokenHash = hashToken(rawToken);

        QuotationAcceptanceToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new ResourceNotFoundException("Invalid quotation link"));

        if (token.isRevoked()) {
            throw new BadRequestException("This quotation link has been revoked");
        }

        if (token.isExpired()) {
            throw new BadRequestException("This quotation link has expired");
        }

        Quotation quotation = token.getQuotation();
        if (quotation == null) {
            quotation = quotationRepository.findById(token.getQuotationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Associated quotation not found"));
        }

        Company company = quotation.getCompany();
        String companyName = company != null
                ? (company.getLegalName() != null ? company.getLegalName() : company.getCompanyName())
                : "Company";
        String companyLogo = company != null ? company.getLogoUrl() : null;
        String companyEmail = company != null ? company.getEmail() : null;
        String companyPhone = company != null ? company.getPhone() : null;
        String companyGstin = company != null ? company.getGstin() : null;
        String companyAddress = company != null
                ? formatAddress(company.getAddressLine1(), company.getAddressLine2(), company.getCity(), company.getState(), company.getPostalCode(), company.getCountry())
                : null;

        Customer customer = quotation.getCustomer();
        String customerName = customer != null ? customer.getCustomerName() : "Customer";
        String customerEmail = customer != null ? customer.getEmail() : null;
        String customerPhone = customer != null ? customer.getPhone() : null;
        String customerGstin = customer != null ? customer.getGstin() : null;
        String billingAddress = formatAddress(quotation.getBillingAddressLine1(), quotation.getBillingAddressLine2(), quotation.getBillingCity(), quotation.getBillingState(), quotation.getBillingPostalCode(), quotation.getBillingCountry());
        String shippingAddress = formatAddress(quotation.getDeliveryAddressLine1(), quotation.getDeliveryAddressLine2(), quotation.getDeliveryCity(), quotation.getDeliveryState(), quotation.getDeliveryPostalCode(), quotation.getDeliveryCountry());

        List<QuotationPublicItemDto> items = new ArrayList<>();
        BigDecimal cgstTotal = BigDecimal.ZERO;
        BigDecimal sgstTotal = BigDecimal.ZERO;
        BigDecimal igstTotal = BigDecimal.ZERO;

        if (quotation.getQuotationItems() != null) {
            int line = 1;
            for (QuotationItem item : quotation.getQuotationItems()) {
                BigDecimal taxRate = BigDecimal.ZERO;
                if (item.getCgstRate() != null && item.getSgstRate() != null) {
                    taxRate = item.getCgstRate().add(item.getSgstRate());
                } else if (item.getIgstRate() != null) {
                    taxRate = item.getIgstRate();
                }

                if (item.getCgstAmount() != null) cgstTotal = cgstTotal.add(item.getCgstAmount());
                if (item.getSgstAmount() != null) sgstTotal = sgstTotal.add(item.getSgstAmount());
                if (item.getIgstAmount() != null) igstTotal = igstTotal.add(item.getIgstAmount());

                items.add(QuotationPublicItemDto.builder()
                        .lineNumber(line++)
                        .itemName(item.getItemName())
                        .description(item.getDescription())
                        .hsnCode(item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null)
                        .quantity(item.getQuantity())
                        .unitName(item.getUnit())
                        .unitPrice(item.getUnitPrice())
                        .discountPercentage(item.getDiscountPercent())
                        .discountAmount(item.getDiscountAmount())
                        .taxPercentage(taxRate)
                        .taxAmount(item.getTaxAmount())
                        .totalAmount(item.getTotalAmount())
                        .build());
            }
        }

        List<String> formattedTerms = TermsFormatter.formatTermsAndConditions(quotation.getTermsAndConditions());

        boolean isAccepted = quotation.getStatus() == QuotationStatus.ACCEPTED || quotation.getStatus() == QuotationStatus.CUSTOMER_ACCEPTED;
        boolean isRejected = quotation.getStatus() == QuotationStatus.REJECTED;
        boolean isExpired = quotation.getValidUntil() != null && quotation.getValidUntil().isBefore(LocalDate.now());

        return QuotationPublicViewResponse.builder()
                .quotationNumber(quotation.getQuotationNumber())
                .quotationDate(quotation.getQuotationDate())
                .validUntil(quotation.getValidUntil())
                .status(quotation.getStatus() != null ? quotation.getStatus().name() : "DRAFT")
                .currency(quotation.getQuotationCurrency() != null ? quotation.getQuotationCurrency() : "INR")
                .companyName(companyName)
                .companyLogoUrl(companyLogo)
                .companyEmail(companyEmail)
                .companyPhone(companyPhone)
                .companyAddress(companyAddress)
                .companyGstin(companyGstin)
                .customerName(customerName)
                .customerEmail(customerEmail)
                .customerPhone(customerPhone)
                .billingAddress(billingAddress)
                .shippingAddress(shippingAddress)
                .customerGstin(customerGstin)
                .items(items)
                .subtotal(quotation.getSubtotal())
                .discountAmount(quotation.getDiscountAmount())
                .taxAmount(quotation.getTaxAmount())
                .cgstAmount(cgstTotal)
                .sgstAmount(sgstTotal)
                .igstAmount(igstTotal)
                .totalAmount(quotation.getTotalAmount())
                .termsAndConditions(quotation.getTermsAndConditions())
                .formattedTerms(formattedTerms)
                .notes(quotation.getNotes())
                .isExpired(isExpired)
                .isAccepted(isAccepted)
                .isRejected(isRejected)
                .acceptedAt(quotation.getApprovedAt())
                .build();
    }

    @Override
    @Transactional
    public void revokeToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        tokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(LocalDateTime.now());
            tokenRepository.save(token);
            tokenCache.remove(token.getQuotationId());
        });
    }

    @Override
    @Transactional
    public void revokeTokensForQuotation(UUID quotationId) {
        if (quotationId != null) {
            tokenRepository.revokeActiveTokensByQuotationId(quotationId, LocalDateTime.now());
            tokenCache.remove(quotationId);
            log.info("Revoked active acceptance tokens for quotation ID {}", quotationId);
        }
    }

    private void triggerAutoCreateOrderIfEligible(Quotation quotation) {
        if (quotation.getCompanyId() == null || quotation.getId() == null) {
            return;
        }

        boolean duplicateExists = salesOrderRepository != null && salesOrderRepository
                .existsBySourceQuotationIdAndCompanyIdAndIsDeletedFalse(quotation.getId(), quotation.getCompanyId());
        if (duplicateExists) {
            log.info("Sales Order already exists for quotation {}; skipping auto-creation.", quotation.getQuotationNumber());
            return;
        }

        boolean autoCreateConfigured = false;
        try {
            if (workflowServiceClient != null) {
                var response = workflowServiceClient.getActiveDefinition(
                        quotation.getCompanyId(), "SALES", "SALES");
                if (response != null && response.getData() != null) {
                    autoCreateConfigured = Boolean.TRUE.equals(response.getData().getAutoCreateOrder());
                } else {
                    var fallbackResponse = workflowServiceClient.getActiveDefinition(
                            quotation.getCompanyId(), "SALES", "SALES_QUOTATION");
                    if (fallbackResponse != null && fallbackResponse.getData() != null) {
                        autoCreateConfigured = Boolean.TRUE.equals(fallbackResponse.getData().getAutoCreateOrder());
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Could not retrieve active workflow definition for quotation {}: {}", quotation.getQuotationNumber(), ex.getMessage());
        }

        if (autoCreateConfigured && salesOrderService != null) {
            try {
                log.info("Auto-creating Sales Order for customer-accepted quotation {}", quotation.getQuotationNumber());
                salesOrderService.createDirectFromQuotation(quotation.getCompanyId(), quotation.getId());
                log.info("Successfully auto-created Sales Order for quotation {}", quotation.getQuotationNumber());
            } catch (Exception ex) {
                log.warn("Auto-create Sales Order could not complete for quotation {}: {}", quotation.getQuotationNumber(), ex.getMessage());
            }
        }
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    private String formatAddress(String line1, String line2, String city, String state, String postalCode, String country) {
        List<String> parts = new ArrayList<>();
        if (line1 != null && !line1.trim().isEmpty()) parts.add(line1.trim());
        if (line2 != null && !line2.trim().isEmpty()) parts.add(line2.trim());
        if (city != null && !city.trim().isEmpty()) parts.add(city.trim());
        if (state != null && !state.trim().isEmpty()) parts.add(state.trim());
        if (postalCode != null && !postalCode.trim().isEmpty()) parts.add(postalCode.trim());
        if (country != null && !country.trim().isEmpty()) parts.add(country.trim());
        return String.join(", ", parts);
    }
}
