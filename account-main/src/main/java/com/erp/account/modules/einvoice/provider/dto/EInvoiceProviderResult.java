package com.erp.account.modules.einvoice.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceProviderResult {

    private boolean success;
    private String irn;
    private String ackNumber;
    private LocalDateTime ackDate;
    private String signedInvoice;
    private String signedQrCode;
    private String errorCode;
    private String errorMessage;
    private boolean isMock;
    private boolean isDuplicate; // e.g., NIC 2150 (IRN already generated)
    private boolean isTimeoutAmbiguous; // Network read timeout where outcome is unknown
    private String rawRequest;
    private String rawResponse;
    private long executionDurationMs;

    public static EInvoiceProviderResult success(
            String irn,
            String ackNumber,
            LocalDateTime ackDate,
            String signedInvoice,
            String signedQrCode,
            boolean isMock,
            String rawRequest,
            String rawResponse,
            long executionDurationMs) {
        return EInvoiceProviderResult.builder()
                .success(true)
                .irn(irn)
                .ackNumber(ackNumber)
                .ackDate(ackDate)
                .signedInvoice(signedInvoice)
                .signedQrCode(signedQrCode)
                .isMock(isMock)
                .rawRequest(rawRequest)
                .rawResponse(rawResponse)
                .executionDurationMs(executionDurationMs)
                .build();
    }

    public static EInvoiceProviderResult failure(
            String errorCode,
            String errorMessage,
            boolean isDuplicate,
            boolean isTimeoutAmbiguous,
            String rawRequest,
            String rawResponse,
            long executionDurationMs) {
        return EInvoiceProviderResult.builder()
                .success(false)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .isDuplicate(isDuplicate)
                .isTimeoutAmbiguous(isTimeoutAmbiguous)
                .rawRequest(rawRequest)
                .rawResponse(rawResponse)
                .executionDurationMs(executionDurationMs)
                .build();
    }
}
