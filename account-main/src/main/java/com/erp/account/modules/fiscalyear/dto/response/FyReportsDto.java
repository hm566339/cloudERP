package com.erp.account.modules.fiscalyear.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FyReportsDto {
    // Trial Balance
    private BigDecimal trialBalanceTotalDebit;
    private BigDecimal trialBalanceTotalCredit;
    private BigDecimal trialBalanceDifference;
    // P&L
    private BigDecimal plTotalRevenue;
    private BigDecimal plTotalExpenses;
    private BigDecimal plNetProfit;
    // Balance Sheet
    private BigDecimal bsTotalAssets;
    private BigDecimal bsTotalLiabilities;
    private BigDecimal bsEquity;
    // Cash Flow
    private BigDecimal cfTotalReceipts;
    private BigDecimal cfTotalPayments;
    private BigDecimal cfNetCashFlow;
}
