package com.erp.manufacturing.integration.accounting.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AccountingJournalResponse {
    private UUID journalEntryId;
    private String status;
    private String postingStatus;
    private String sourceModule;
    private UUID sourceId;
    private String eventType;
    private String idempotencyKey;
    private String voucherNumber;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private LocalDateTime createdAt;
    private LocalDateTime postedAt;
}
