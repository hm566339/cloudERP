package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApJournalEntryDto {
    private UUID journalId;
    private String voucherNumber;
    private String voucherType;
    private LocalDate transactionDate;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private String status;
}
