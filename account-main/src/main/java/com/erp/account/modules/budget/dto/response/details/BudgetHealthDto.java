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
public class BudgetHealthDto implements Serializable {
    private String healthStatus;
    private String riskLevel;
    private String utilizationColor;
    private String recommendation;
    private BigDecimal progressPercentage;
}
