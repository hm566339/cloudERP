package com.erp.account.modules.gljournal.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlJournalLineFilterDto {
    private UUID journalEntryId;
    private UUID accountId;
    
    private BigDecimal minDebitAmount;
    private BigDecimal maxDebitAmount;
    private BigDecimal minCreditAmount;
    private BigDecimal maxCreditAmount;
    
    private String currencyCode;
    private UUID departmentId;
    private String costCenter;
    
    private String description;
    private String referenceNumber;
    private Boolean isDeleted;
}
