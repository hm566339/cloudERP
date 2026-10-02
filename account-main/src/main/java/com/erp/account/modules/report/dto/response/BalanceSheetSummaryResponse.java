package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BalanceSheetSummaryResponse extends BaseResponseDto  {
    private BigDecimal totalAssets;
    private BigDecimal totalCurrentAssets;
    private BigDecimal totalNonCurrentAssets;
    
    private BigDecimal totalLiabilities;
    private BigDecimal totalCurrentLiabilities;
    private BigDecimal totalNonCurrentLiabilities;
    
    private BigDecimal totalEquity;
    private BigDecimal totalCapital;
    private BigDecimal retainedEarnings;
    private BigDecimal currentYearProfit;
    
    private BigDecimal totalLiabilitiesAndEquity;
    private boolean balanced;
    private BigDecimal balanceDifference;
}
