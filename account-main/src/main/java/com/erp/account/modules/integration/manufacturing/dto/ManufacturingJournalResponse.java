package com.erp.account.modules.integration.manufacturing.dto;

import com.erp.account.enums.PostingStatus;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Value
@Builder
public class ManufacturingJournalResponse {
    UUID journalEntryId;
    String status;
    PostingStatus postingStatus;
    String sourceModule;
    UUID sourceId;
    String eventType;
    String idempotencyKey;
    String voucherNumber;
    BigDecimal totalDebit;
    BigDecimal totalCredit;
    LocalDateTime createdAt;
    LocalDateTime postedAt;
}
