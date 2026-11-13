package com.erp.account.modules.quotation.service.impl;

import com.erp.account.modules.bankaccount.dto.response.InvoiceBankDetailsDto;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.entity.GstStateCode;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.gst.repository.GstStateCodeRepository;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationItem;
import com.erp.account.modules.quotation.exception.QuotationNotFoundException;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationPdfService;
import com.erp.account.util.AmountToWordsConverter;
import com.erp.account.util.TenantUtils;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationPdfServiceImpl implements QuotationPdfService {

    private final QuotationRepository quotationRepository;
    private final TemplateEngine templateEngine;
    private final GstStateCodeRepository gstStateCodeRepository;
    private final GstRegistrationRepository gstRegistrationRepository;
    private final BankAccountService bankAccountService;
    private final com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService tokenService;

    @org.springframework.beans.factory.annotation.Value("${frontend.base:${frontend.url:http://localhost:5173}}")
    private String frontendUrl;

    @Override
    @Transactional
    public byte[] generateQuotationPdf(UUID quotationId, UUID companyId) {
        return generateQuotationPdf(quotationId, companyId, null);
    }

    @Override
    @Transactional
    public byte[] generateQuotationPdf(UUID quotationId, UUID companyId, String rawToken) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new QuotationNotFoundException(quotationId));

        if (!TenantUtils.isSystemAdmin()) {
            UUID resolvedCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
            if (resolvedCompanyId == null || !quotation.getCompanyId().equals(resolvedCompanyId)) {
                throw new QuotationNotFoundException(quotationId);
            }
        }

        if (!org.springframework.util.StringUtils.hasText(rawToken)) {
            try {
                rawToken = tokenService.getOrCreateToken(quotation);
            } catch (Exception ex) {
                log.warn("Could not generate acceptance token for quotation PDF {}: {}", quotation.getQuotationNumber(), ex.getMessage());
            }
        }

        return generatePdf(quotation, rawToken);
    }

    @Override
    @Transactional
    public byte[] generatePublicQuotationPdf(UUID quotationId) {
        Quotation quotation = quotationRepository.findById(quotationId)
                .orElseThrow(() -> new QuotationNotFoundException(quotationId));
        String rawToken = null;
        try {
            rawToken = tokenService.getOrCreateToken(quotation);
        } catch (Exception ex) {
            log.warn("Could not generate acceptance token for public quotation PDF {}: {}", quotation.getQuotationNumber(), ex.getMessage());
        }
        return generatePdf(quotation, rawToken);
    }

    private byte[] generatePdf(Quotation quotation, String rawToken) {
        Company company = quotation.getCompany();
        Customer customer = quotation.getCustomer();

        // Resolve Company GST and State Code from GST Registration
        String companyStateCode = "";
        String companyGstin = company != null && company.getGstin() != null ? company.getGstin() : "";

        if (company != null) {
            try {
                Optional<GstRegistration> regOpt = gstRegistrationRepository
                        .findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(company.getId());

                if (regOpt.isPresent()) {
                    GstRegistration reg = regOpt.get();
                    if (reg.getGstin() != null && !reg.getGstin().isEmpty()) {
                        companyGstin = reg.getGstin();
                    }
                    if (reg.getStateCode() != null && reg.getStateCode().getStateCode() != null) {
                        companyStateCode = reg.getStateCode().getStateCode().trim();
                    } else if (reg.getGstin() != null && reg.getGstin().length() >= 2) {
                        companyStateCode = reg.getGstin().substring(0, 2);
                    }
                } else {
                    if (companyGstin.length() >= 2) {
                        companyStateCode = companyGstin.substring(0, 2);
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch GST registration for company {}: {}", company.getId(), e.getMessage());
                if (companyGstin.length() >= 2) {
                    companyStateCode = companyGstin.substring(0, 2);
                }
            }
        }

        // Calculate isIntraState based on Company State Code and Place of Supply State
        // Code
        boolean isIntraState = false;
        if (companyStateCode != null && !companyStateCode.isEmpty() && quotation.getPlaceOfSupplyStateCode() != null) {
            isIntraState = companyStateCode.equalsIgnoreCase(quotation.getPlaceOfSupplyStateCode().trim());
        }

        List<QuotationItem> items = quotation.getQuotationItems() != null
                ? quotation.getQuotationItems().stream()
                        .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                        .toList()
                : Collections.emptyList();

        Context context = new Context();
        context.setVariable("quotation", quotation);
        context.setVariable("company", company);
        context.setVariable("customer", customer);
        context.setVariable("items", items);

        BigDecimal totalQty = items.stream()
                .map(item -> item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        context.setVariable("totalQuantity", totalQty);

        String amountWords = quotation.getTotalAmount() != null
                ? AmountToWordsConverter.convertAmountToWords(quotation.getTotalAmount())
                : "";
        context.setVariable("amountInWords", amountWords);

        context.setVariable("companyStateCode", companyStateCode);
        context.setVariable("companyGstin", companyGstin);
        context.setVariable("isIntraState", isIntraState);

        // Resolve Customer State Code
        String customerStateCode = quotation.getBillingStateCode();
        if (customerStateCode == null || customerStateCode.trim().isEmpty()) {
            if (customer != null && customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
                CustomerAddress defaultAddr = customer.getAddresses().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                        .findFirst()
                        .orElse(customer.getAddresses().get(0));
                customerStateCode = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateCode() : "";
            } else {
                customerStateCode = "";
            }
        }
        context.setVariable("customerStateCode", customerStateCode);

        // Resolve Place of Supply Name
        String placeOfSupplyName = "";
        if (quotation.getPlaceOfSupplyStateId() != null) {
            try {
                GstStateCode posState = gstStateCodeRepository
                        .findById(quotation.getPlaceOfSupplyStateId()).orElse(null);
                if (posState != null) {
                    placeOfSupplyName = posState.getStateName();
                }
            } catch (Exception e) {
                log.warn("Could not fetch state name for pos state id {}: {}", quotation.getPlaceOfSupplyStateId(),
                        e.getMessage());
            }
        }
        context.setVariable("placeOfSupplyName", placeOfSupplyName);

        // Pre-compute per-tax-type totals from items
        BigDecimal totalCgst = items.stream()
                .map(item -> item.getCgstAmount() != null ? item.getCgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSgst = items.stream()
                .map(item -> item.getSgstAmount() != null ? item.getSgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgst = items.stream()
                .map(item -> item.getIgstAmount() != null ? item.getIgstAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (quotation.getTaxAmount() != null && quotation.getTaxAmount().compareTo(BigDecimal.ZERO) > 0) {
            if (isIntraState && totalCgst.compareTo(BigDecimal.ZERO) == 0
                    && totalSgst.compareTo(BigDecimal.ZERO) == 0) {
                totalCgst = quotation.getTaxAmount().divide(BigDecimal.valueOf(2), 2, java.math.RoundingMode.HALF_UP);
                totalSgst = quotation.getTaxAmount().subtract(totalCgst);
            } else if (!isIntraState && totalIgst.compareTo(BigDecimal.ZERO) == 0) {
                totalIgst = quotation.getTaxAmount();
            }
        }

        context.setVariable("totalCgst", totalCgst);
        context.setVariable("totalSgst", totalSgst);
        context.setVariable("totalIgst", totalIgst);

        // Bill To Resolution
        String billAddress = quotation.getBillingAddressLine1() != null
                && !quotation.getBillingAddressLine1().trim().isEmpty() ? quotation.getBillingAddressLine1()
                        : (com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer) != null ? com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer) : "");
        String billCity = quotation.getBillingCity() != null && !quotation.getBillingCity().trim().isEmpty()
                ? quotation.getBillingCity()
                : (com.erp.account.util.CustomerAddressUtils.getCity(customer) != null ? com.erp.account.util.CustomerAddressUtils.getCity(customer) : "");
        String billState = quotation.getBillingState() != null && !quotation.getBillingState().trim().isEmpty()
                ? quotation.getBillingState()
                : (com.erp.account.util.CustomerAddressUtils.getState(customer) != null ? com.erp.account.util.CustomerAddressUtils.getState(customer) : "");
        String billCountry = quotation.getBillingCountry() != null && !quotation.getBillingCountry().trim().isEmpty()
                ? quotation.getBillingCountry()
                : (com.erp.account.util.CustomerAddressUtils.getCountry(customer) != null ? com.erp.account.util.CustomerAddressUtils.getCountry(customer) : "");

        // Ship To Resolution
        String shipAddress = quotation.getDeliveryAddressLine1() != null
                && !quotation.getDeliveryAddressLine1().trim().isEmpty() ? quotation.getDeliveryAddressLine1()
                        : (com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer) != null ? com.erp.account.util.CustomerAddressUtils.getAddressLine1(customer) : "");
        String shipCity = quotation.getDeliveryCity() != null && !quotation.getDeliveryCity().trim().isEmpty()
                ? quotation.getDeliveryCity()
                : (com.erp.account.util.CustomerAddressUtils.getCity(customer) != null ? com.erp.account.util.CustomerAddressUtils.getCity(customer) : "");
        String shipState = quotation.getDeliveryState() != null && !quotation.getDeliveryState().trim().isEmpty()
                ? quotation.getDeliveryState()
                : (com.erp.account.util.CustomerAddressUtils.getState(customer) != null ? com.erp.account.util.CustomerAddressUtils.getState(customer) : "");
        String shipCountry = quotation.getDeliveryCountry() != null && !quotation.getDeliveryCountry().trim().isEmpty()
                ? quotation.getDeliveryCountry()
                : (com.erp.account.util.CustomerAddressUtils.getCountry(customer) != null ? com.erp.account.util.CustomerAddressUtils.getCountry(customer) : "");

        String shipPostalCode = quotation.getDeliveryPostalCode();
        if (customer != null && customer.getAddresses() != null && !customer.getAddresses().isEmpty()) {
            CustomerAddress defaultAddr = customer.getAddresses().stream()
                    .filter(a -> Boolean.TRUE.equals(a.getIsDefault()))
                    .findFirst()
                    .orElse(customer.getAddresses().get(0));
            if (shipPostalCode == null || shipPostalCode.trim().isEmpty()) {
                shipPostalCode = defaultAddr.getPostalCode();
            }
            if (billState == null || billState.trim().isEmpty()) {
                billState = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateName() : null;
            }
            if (shipState == null || shipState.trim().isEmpty()) {
                shipState = defaultAddr.getGstState() != null ? defaultAddr.getGstState().getStateName() : null;
            }
        }

        context.setVariable("billAddress", billAddress);
        context.setVariable("billCity", billCity);
        context.setVariable("billState", billState);
        context.setVariable("billCountry", billCountry);

        context.setVariable("shipAddress", shipAddress);
        context.setVariable("shipCity", shipCity);
        context.setVariable("shipState", shipState);
        context.setVariable("shipCountry", shipCountry);
        context.setVariable("shipPostalCode", shipPostalCode);
        
        List<String> formattedTerms = com.erp.account.util.TermsFormatter.formatTermsAndConditions(quotation.getTermsAndConditions());
        context.setVariable("formattedTerms", formattedTerms);

        // Generate QR Code safely
        String qrData;
        if (org.springframework.util.StringUtils.hasText(rawToken)) {
            String baseUrl = (frontendUrl != null && !frontendUrl.trim().isEmpty())
                    ? frontendUrl.trim().replaceAll("/$", "")
                    : "http://localhost:5173";
            qrData = baseUrl + "/quotation/accept/" + rawToken;
        } else {
            qrData = "Quotation: " + quotation.getQuotationNumber() + ", Date: " + quotation.getQuotationDate();
        }
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(qrData, BarcodeFormat.QR_CODE, 150, 150);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            String base64Qr = Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());
            context.setVariable("qrCodeImage", "data:image/png;base64," + base64Qr);
        } catch (Exception e) {
            log.warn("Failed to generate QR Code for quotation {}: {}", quotation.getQuotationNumber(), e.getMessage());
            context.setVariable("qrCodeImage", null);
        }

        // Fetch Bank Details safely
        if (company != null && company.getId() != null) {
            try {
                InvoiceBankDetailsDto bankDetails = bankAccountService
                        .getInvoiceBankDetails(company.getId());
                context.setVariable("bankAccount", bankDetails);
            } catch (Exception e) {
                log.warn("Failed to fetch bank details for company {}: {}", company.getId(), e.getMessage());
                context.setVariable("bankAccount", null);
            }
        } else {
            context.setVariable("bankAccount", null);
        }

        // Render Thymeleaf template
        String html;
        try {
            html = templateEngine.process("quotation-template", context);
        } catch (Exception e) {
            log.error("Error rendering quotation Thymeleaf template for quotationId: {}", quotation.getId(), e);
            throw new RuntimeException("Failed to render Thymeleaf template for Quotation: " + e.getMessage(), e);
        }

        // Diagnostic validation of Thymeleaf HTML
        log.info(
                "[PDF Diagnostics] quotationId={}, qNumber={}, htmlLength={}, containsHtmlTag={}, containsBodyTag={}, containsQuotationTitle={}, itemCount={}",
                quotation.getId(),
                quotation.getQuotationNumber(),
                html != null ? html.length() : 0,
                html != null && html.contains("<html"),
                html != null && html.contains("<body"),
                html != null && html.contains("Sales Quotation"),
                items.size());

        if (html == null || html.trim().isEmpty()) {
            log.error("Thymeleaf generated empty HTML for quotation: {}", quotation.getId());
            throw new RuntimeException("Generated quotation HTML is empty");
        }

        // Render PDF with ITextRenderer
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            byte[] pdfBytes = outputStream.toByteArray();

            if (pdfBytes == null || pdfBytes.length == 0) {
                log.error("Generated PDF bytes are empty for quotationId: {}", quotation.getId());
                throw new RuntimeException("Generated Quotation PDF is empty");
            }

            if (pdfBytes.length < 4 || pdfBytes[0] != '%' || pdfBytes[1] != 'P' || pdfBytes[2] != 'D'
                    || pdfBytes[3] != 'F') {
                log.error("Generated PDF does not start with %PDF header for quotationId: {}", quotation.getId());
                throw new RuntimeException("Generated Quotation PDF has invalid header");
            }

            log.info("Successfully generated Quotation PDF for quotation: {}, size: {} bytes",
                    quotation.getQuotationNumber(), pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            log.error("Error generating Quotation PDF with ITextRenderer for quotationId: {}", quotation.getId(), e);
            throw new RuntimeException("Error generating Quotation PDF: " + e.getMessage(), e);
        }
    }
}
