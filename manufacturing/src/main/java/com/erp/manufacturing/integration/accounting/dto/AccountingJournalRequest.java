package com.erp.manufacturing.integration.accounting.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class AccountingJournalRequest {
    private UUID companyId;
    private String sourceModule;
    private UUID sourceId;
    private String eventType;
    private String referenceNo;
    private LocalDate voucherDate;
    private String narration;
    private String currencyCode;
    private String idempotencyKey;
    private BigDecimal amount;
}
