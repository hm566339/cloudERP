package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApFinancialSummaryDto {
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    private BigDecimal totalAssets;
    private BigDecimal totalLiabilities;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
}
