package com.erp.account.modules.reporting.repository;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Summary aggregates computed over the entire filtered result set
 * (not just the current page).
 */
@Data
@Builder
public class TrialBalanceAggregateSummary {

    private long totalGroups;
    private BigDecimal totalOpening;
    private BigDecimal totalOpeningDebit;
    private BigDecimal totalOpeningCredit;
    private BigDecimal totalPeriodDebit;
    private BigDecimal totalPeriodCredit;
    private BigDecimal totalClosingDebit;
    private BigDecimal totalClosingCredit;
    private long accountsWithTransactions;
}
