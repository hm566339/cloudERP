package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProfitLossSummaryResponse extends BaseResponseDto  {
    private BigDecimal totalRevenue;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit;
    private BigDecimal netProfit;
    
    private BigDecimal totalIncome;
    private BigDecimal totalOtherIncome;
    private BigDecimal totalCOGS;
    private BigDecimal totalOperatingExpenses;
    private BigDecimal totalOtherExpenses;
    private BigDecimal EBITDA;
    private BigDecimal operatingProfit;
    private BigDecimal profitBeforeTax;
    private BigDecimal taxExpense;
    private BigDecimal netProfitAfterTax;
    private BigDecimal profitMarginPercentage;
}
