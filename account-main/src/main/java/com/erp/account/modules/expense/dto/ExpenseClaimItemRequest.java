package com.erp.account.modules.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.erp.account.enums.PaymentType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimItemRequest {

    @NotNull(message = "Expense category ID is required")
    private UUID expenseCategoryId;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private String description;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;

    private String billAttachmentUrl;

    @NotNull(message = "Payment Type is required")
    private PaymentType paymentType;
}
