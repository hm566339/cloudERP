package com.erp.account.modules.reporting.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class GeneralLedgerLine {

    private UUID journalEntryId;
    private String voucherNo;
    private LocalDate voucherDate;
    private String narration;
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private BigDecimal debitAmount;
    private BigDecimal creditAmount;
    private BigDecimal runningBalance;
}
