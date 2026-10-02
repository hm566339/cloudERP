package com.erp.account.modules.expense.dto;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class ReimbursementCreateRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Expense Claim ID is required")
    private UUID expenseClaimId;

    @NotNull(message = "Reimbursement Date is required")
    private LocalDate reimbursementDate;

    @NotNull(message = "Reimbursement Amount is required")
    @Positive(message = "Reimbursement Amount must be positive")
    private BigDecimal reimbursementAmount;

    private PaymentMode paymentMethod;
    private String paymentReference;
    private String notes;
}
