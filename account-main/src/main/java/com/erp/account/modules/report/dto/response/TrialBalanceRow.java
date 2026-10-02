package com.erp.account.modules.report.dto.response;

import com.erp.account.enums.BalanceType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class TrialBalanceRow {
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private String parentAccountName;
    private String accountType;
    private String accountGroup;
    private BigDecimal openingDebit;
    private BigDecimal openingCredit;
    private BigDecimal periodDebit;
    private BigDecimal periodCredit;
    private BigDecimal openingBalance;
    private BigDecimal debitTotal;
    private BigDecimal creditTotal;
    private BigDecimal closingBalance;
    private BigDecimal closingDebit;
    private BigDecimal closingCredit;
    private BalanceType balanceType;
    private Long transactionCount;
    private LocalDate lastTransactionDate;
    private String currencyCode;
}
