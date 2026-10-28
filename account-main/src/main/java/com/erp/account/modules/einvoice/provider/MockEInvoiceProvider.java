package com.erp.account.modules.einvoice.provider;

import com.erp.account.modules.einvoice.entity.CompanyEInvoiceConfig;
import com.erp.account.modules.einvoice.enums.EInvoiceProviderType;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCancelResult;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceCanonicalPayload;
import com.erp.account.modules.einvoice.provider.dto.EInvoiceProviderResult;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;

/**
 * Mock implementation of EInvoiceProvider for local development, offline CI/CD,
 * and automated testing without requiring live NIC or GSP connectivity.
 *
 * CRITICAL COMPLIANCE NOTICE:
 * All generated attributes are clearly prefixed with "MOCK-".
 * This data is purely synthetic and must NEVER be treated as a government-issued IRN
 * or legal tax document under Rule 48(4) of the CGST Rules.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MockEInvoiceProvider implements EInvoiceProvider {

    private final ObjectMapper objectMapper;

    @Override
    public EInvoiceProviderType getProviderType() {
        return EInvoiceProviderType.MOCK;
    }

    @Override
    public EInvoiceProviderResult generateIrn(CompanyEInvoiceConfig config, EInvoiceCanonicalPayload payload) {
        long startTime = System.currentTimeMillis();
        log.info("[MOCK e-Invoice Provider] Processing generate IRN request for doc={}", payload.getDocNumber());

        try {
            String rawRequest = objectMapper.writeValueAsString(payload);

            // Simulation hook for test cases
            if ("SIMULATE_TIMEOUT".equals(payload.getDocNumber())) {
                long duration = System.currentTimeMillis() - startTime;
                return EInvoiceProviderResult.failure("TIMEOUT", "Simulated gateway read timeout", false, true, rawRequest, "Read Timeout", duration);
            }

            if ("SIMULATE_DUPLICATE".equals(payload.getDocNumber())) {
                long duration = System.currentTimeMillis() - startTime;
                return EInvoiceProviderResult.failure("2150", "IRN is already generated for this invoice", true, false, rawRequest, "Duplicate Error", duration);
            }

            if ("SIMULATE_FAILURE".equals(payload.getDocNumber())) {
                long duration = System.currentTimeMillis() - startTime;
                return EInvoiceProviderResult.failure("4001", "Simulated validation failure: Invalid PIN code", false, false, rawRequest, "Error", duration);
            }

            // Deterministic synthetic IRN generation: 64-char hex hash prefixed with MOCK
            String rawHashInput = (payload.getSeller() != null ? payload.getSeller().getGstin() : "SELLER")
                    + ":" + payload.getDocType()
                    + ":" + payload.getDocNumber()
                    + ":" + (payload.getDocDate() != null ? payload.getDocDate().getYear() : "2026");
            String sha256Hex = computeSha256(rawHashInput);
            String mockIrn = "MOCK-IRN-" + sha256Hex.substring(0, 55);

            String mockAckNumber = "MOCK-ACK-" + System.currentTimeMillis();
            LocalDateTime mockAckDate = LocalDateTime.now();

            // Synthetic Signed QR payload
            String mockSignedQr = String.format(
                    "MOCK-SIGNED-QR-JWT:Issuer=NIC-MOCK:Seller=%s:Buyer=%s:DocNo=%s:DocDate=%s:TotVal=%s:IRN=%s",
                    payload.getSeller() != null ? payload.getSeller().getGstin() : "NA",
                    payload.getBuyer() != null ? payload.getBuyer().getGstin() : "NA",
                    payload.getDocNumber(),
                    payload.getDocDate(),
                    payload.getValues() != null ? payload.getValues().getTotalInvoiceValue() : "0.00",
                    mockIrn
            );

            String mockSignedInvoice = "MOCK-SIGNED-INVOICE-BASE64-JWT-PAYLOAD";
            String rawResponse = "{\"status\":\"SUCCESS\",\"irn\":\"" + mockIrn + "\",\"isMock\":true}";
            long duration = System.currentTimeMillis() - startTime;

            return EInvoiceProviderResult.success(
                    mockIrn,
                    mockAckNumber,
                    mockAckDate,
                    mockSignedInvoice,
                    mockSignedQr,
                    true,
                    rawRequest,
                    rawResponse,
                    duration
            );
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("[MOCK e-Invoice Provider] Generation failed", e);
            return EInvoiceProviderResult.failure("MOCK_EXCEPTION", e.getMessage(), false, false, "{}", e.getMessage(), duration);
        }
    }

    @Override
    public EInvoiceCancelResult cancelIrn(CompanyEInvoiceConfig config, String irn, String cancelReason, String remarks) {
        long startTime = System.currentTimeMillis();
        log.info("[MOCK e-Invoice Provider] Cancelling mock IRN={}", irn);
        long duration = System.currentTimeMillis() - startTime;

        if ("FAIL_CANCEL".equals(irn)) {
            return EInvoiceCancelResult.failure(irn, "2152", "IRN already cancelled or exceeds 24-hour limit", "{}", "Cancel Failed", duration);
        }

        return EInvoiceCancelResult.success(
                irn,
                LocalDateTime.now(),
                "{\"irn\":\"" + irn + "\",\"reason\":\"" + cancelReason + "\"}",
                "{\"status\":\"CANCELLED\",\"irn\":\"" + irn + "\",\"isMock\":true}",
                duration
        );
    }

    @Override
    public EInvoiceProviderResult getIrnDetails(CompanyEInvoiceConfig config, String irn) {
        long startTime = System.currentTimeMillis();
        long duration = System.currentTimeMillis() - startTime;
        return EInvoiceProviderResult.success(
                irn,
                "MOCK-ACK-RECONCILED",
                LocalDateTime.now(),
                "MOCK-SIGNED-INVOICE",
                "MOCK-SIGNED-QR",
                true,
                "{\"irn\":\"" + irn + "\"}",
                "{\"status\":\"SUCCESS\",\"irn\":\"" + irn + "\"}",
                duration
        );
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(encodedhash);
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString(input.hashCode()) + "00000000000000000000000000000000";
        }
    }
}
