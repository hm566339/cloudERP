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
public class FyFinancialSummaryDto {
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
    private BigDecimal totalEquity;
}
