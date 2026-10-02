package com.erp.account.modules.budget.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class BudgetLineRequest implements Serializable {

    private UUID budgetHeaderId;

    @NotNull(message = "Account reference is required")
    private UUID accountId;

    private UUID departmentId;

    @NotNull(message = "Allocated amount is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Allocated amount must be a non-negative value")
    private BigDecimal allocatedAmount;

    private BigDecimal utilizedAmount;
}
