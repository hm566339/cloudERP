package com.erp.account.modules.budget.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

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
public class BudgetVarianceResponse extends BaseResponseDto  implements Serializable {

    private UUID budgetLineId;
    private UUID budgetHeaderId;
    private String budgetHeaderName;
    private UUID accountId;
    private String accountCode;
    private String accountName;
    private UUID departmentId;
    private BigDecimal allocatedAmount;
    private BigDecimal actualExpense;
    private BigDecimal remainingAmount;
    private BigDecimal varianceAmount;
    private BigDecimal variancePercentage;
    private String varianceType;
}
