package com.erp.account.modules.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseRequestApproveRequest {

    @DecimalMin(value = "0.01", message = "Approved amount must be greater than zero")
    private BigDecimal approvedAmount;

    private String remarks;
}
