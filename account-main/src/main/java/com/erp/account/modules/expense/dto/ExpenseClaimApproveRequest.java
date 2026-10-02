package com.erp.account.modules.expense.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimApproveRequest {
    private String notes;
    private java.util.UUID employeePayableAccountId;
    private java.util.UUID bankOrCashAccountId;
}
