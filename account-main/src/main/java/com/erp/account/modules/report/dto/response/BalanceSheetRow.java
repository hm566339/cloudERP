package com.erp.account.modules.report.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class BalanceSheetRow {
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private String accountType;
    private String accountGroup;
    private UUID parentAccountId;
    private String parentAccountName;
    private String branchName;
    private String departmentName;
    private String projectName;
    private String costCenterName;
    private String currencyCode;
    private String accountNature;
    private Integer accountLevel;
    private Integer transactionCount;
    private BigDecimal openingDebit;
    private BigDecimal openingCredit;
    private BigDecimal periodDebit;
    private BigDecimal periodCredit;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal currentClosingBalance;
    private BigDecimal previousClosingBalance;
    private BigDecimal balanceDifference;
    private BigDecimal balancePercentage;
    private String notes;
}
