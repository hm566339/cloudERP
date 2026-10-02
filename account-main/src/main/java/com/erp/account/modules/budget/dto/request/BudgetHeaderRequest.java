package com.erp.account.modules.budget.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetHeaderRequest implements Serializable {

    private UUID fiscalYearId;
    private String budgetName;
    private BigDecimal totalBudget;
}
