package com.erp.account.modules.budget.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

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
public class BudgetLineSummaryResponse extends BaseResponseDto  implements Serializable {

    private UUID companyId;
    private BigDecimal totalAllocated;
    private BigDecimal totalUtilized;
    private BigDecimal totalRemaining;
    private BigDecimal averageUtilizationPercentage;
    private int totalBudgetLines;
    private int overAllocatedLines;
    private int underUtilizedLines;
    private LocalDateTime generatedAt;
}
