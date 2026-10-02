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
public class BudgetLineResponse extends BaseResponseDto  implements Serializable {

    private UUID id;
    private UUID companyId;
    private UUID budgetHeaderId;
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private UUID departmentId;
    private BigDecimal allocatedAmount;
    private BigDecimal utilizedAmount;
    private BigDecimal actualExpense;
    private BigDecimal remainingAmount;
    private BigDecimal utilizationPercentage;
    private BigDecimal varianceAmount;
    private BigDecimal variancePercentage;
    private String varianceType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
