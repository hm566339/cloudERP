package com.erp.account.modules.expense.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ReimbursementRejectRequest {
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
