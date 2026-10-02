package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceSummaryDto implements Serializable {
    private BigDecimal allocatedAmount;
    private BigDecimal utilizedAmount;
    private BigDecimal committedAmount;
    private BigDecimal actualExpense;
    private BigDecimal remainingAmount;
    private BigDecimal availableBudget;
    private BigDecimal utilizationPercentage;
}
