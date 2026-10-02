package com.erp.account.modules.reporting.repository;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * One aggregated Trial Balance row (per group key).
 *
 * groupId/code/name are the group identity and depend on the requested grouping
 * (account, account group, account type, parent account, branch, cost center, project).
 * accountType / accountGroup / parentAccountName are only populated for account-level grouping.
 */
@Data
@Builder
public class TrialBalanceAggregateRow {

    private UUID groupId;
    private String groupCode;
    private String groupName;
    private String accountType;
    private String accountGroup;
    private String parentAccountName;

    private BigDecimal openingDebit;
    private BigDecimal openingCredit;
    private BigDecimal periodDebit;
    private BigDecimal periodCredit;
    private BigDecimal openingBalanceStatic;

    private long transactionCount;
    private LocalDate lastTransactionDate;
}
