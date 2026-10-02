package com.erp.account.modules.budget.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetHeaderResponse extends BaseResponseDto  implements Serializable {

    private UUID id;
    private UUID companyId;
    private UUID fiscalYearId;
    private String fiscalYearName;
    private String budgetName;
    private BigDecimal totalBudget;
    private BigDecimal totalAllocated;
    private BigDecimal totalUtilized;
    private BigDecimal remainingBudget;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BudgetLineResponse> budgetLines;
}
