package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetHeaderInfoDto implements Serializable {
    private UUID budgetHeaderId;
    private String budgetCode;
    private String budgetName;
    private String budgetType;
    private UUID fiscalYearId;
    private String fiscalYearName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalBudget;
    private BigDecimal totalAllocated;
    private BigDecimal totalUtilized;
    private BigDecimal remainingBudget;
    private String status;
}
