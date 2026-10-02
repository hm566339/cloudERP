package com.erp.account.modules.reporting.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ProfitLossReport {

    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netProfitOrLoss;
}
