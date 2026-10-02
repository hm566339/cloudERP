package com.erp.account.modules.budget.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetHeaderFilterDto {

    private String searchKey;
    
    private UUID fiscalYearId;
    
    private BigDecimal minTotalBudget;
    
    private BigDecimal maxTotalBudget;
    
    private Boolean isDeleted;
}
