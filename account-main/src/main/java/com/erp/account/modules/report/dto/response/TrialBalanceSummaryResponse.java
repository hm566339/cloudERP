package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class TrialBalanceSummaryResponse extends BaseResponseDto  {
    private BigDecimal totalOpening;
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal totalClosing;
    private BigDecimal totalOpeningDebit;
    private BigDecimal totalOpeningCredit;
    private BigDecimal totalPeriodDebit;
    private BigDecimal totalPeriodCredit;
    private BigDecimal totalClosingDebit;
    private BigDecimal totalClosingCredit;
    private BigDecimal difference;
    private Boolean isBalanced;
    private Long totalAccounts;
    private Long accountsWithTransactions;
}
