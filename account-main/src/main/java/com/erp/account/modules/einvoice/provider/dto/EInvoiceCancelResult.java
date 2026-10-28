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
public class EInvoiceCancelResult {
    private boolean success;
    private String irn;
    private LocalDateTime cancelDate;
    private String errorCode;
    private String errorMessage;
    private String rawRequest;
    private String rawResponse;
    private long executionDurationMs;

    public static EInvoiceCancelResult success(String irn, LocalDateTime cancelDate, String rawRequest, String rawResponse, long durationMs) {
        return EInvoiceCancelResult.builder()
                .success(true)
                .irn(irn)
                .cancelDate(cancelDate)
                .rawRequest(rawRequest)
                .rawResponse(rawResponse)
                .executionDurationMs(durationMs)
                .build();
    }

    public static EInvoiceCancelResult failure(String irn, String errorCode, String errorMessage, String rawRequest, String rawResponse, long durationMs) {
        return EInvoiceCancelResult.builder()
                .success(false)
                .irn(irn)
                .errorCode(errorCode)
                .errorMessage(errorMessage)
                .rawRequest(rawRequest)
                .rawResponse(rawResponse)
                .executionDurationMs(durationMs)
                .build();
    }
}
