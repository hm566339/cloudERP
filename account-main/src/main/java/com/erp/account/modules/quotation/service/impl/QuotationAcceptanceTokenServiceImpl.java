package com.erp.account.modules.quotation.service.impl;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.entity.QuotationAcceptanceToken;
import com.erp.account.modules.quotation.entity.QuotationStatus;
import com.erp.account.modules.quotation.repository.QuotationAcceptanceTokenRepository;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuotationAcceptanceTokenServiceImpl implements QuotationAcceptanceTokenService {

    private final QuotationAcceptanceTokenRepository tokenRepository;
    private final QuotationRepository quotationRepository;
    
    @Value("${quotation.acceptance.token.expiry-days:7}")
    private int expiryDays;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional
    public String generateToken(Quotation quotation) {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        
        String tokenHash = hashToken(rawToken);
        
        QuotationAcceptanceToken token = QuotationAcceptanceToken.builder()
                .quotationId(quotation.getId())
                .quotation(quotation)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusDays(expiryDays))
                .build();
                
        tokenRepository.save(token);
        
        return rawToken;
    }

    @Override
    @Transactional
    public QuotationAcceptResponse acceptQuotation(String rawToken) {
        String tokenHash = hashToken(rawToken);
        
        QuotationAcceptanceToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new com.erp.account.common.exception.ResourceNotFoundException("Invalid or expired quotation acceptance token"));
                
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

        if (quotation.getStatus() == QuotationStatus.ACCEPTED) {
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

        log.info("Quotation {} accepted via token {}", quotation.getId(), token.getId());

        return QuotationAcceptResponse.builder()
                .success(true)
                .message("Quotation accepted successfully")
                .quotationId(quotation.getId())
                .acceptedAt(now)
                .build();
    }

    @Override
    @Transactional
    public void revokeToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        tokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            token.setRevokedAt(LocalDateTime.now());
            tokenRepository.save(token);
        });
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
}
