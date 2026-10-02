package com.erp.account.modules.expense.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimRejectRequest {
    
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
