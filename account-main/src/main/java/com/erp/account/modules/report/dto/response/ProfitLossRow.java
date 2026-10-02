package com.erp.account.modules.report.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProfitLossRow {
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private String accountType;
    private String accountGroup;
    private String parentAccount;
    private String branchName;
    private String departmentName;
    private String projectName;
    private String costCenterName;
    private Integer transactionCount;
    private BigDecimal openingDebit;
    private BigDecimal openingCredit;
    private BigDecimal periodDebit;
    private BigDecimal periodCredit;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal currentPeriodAmount;
    private BigDecimal previousPeriodAmount;
    private BigDecimal varianceAmount;
    private BigDecimal variancePercentage;
    private BigDecimal budgetAmount;
    private BigDecimal budgetVariance;
    private String notes;
}
