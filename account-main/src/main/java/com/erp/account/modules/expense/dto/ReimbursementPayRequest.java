package com.erp.account.modules.expense.dto;

import com.erp.account.enums.PaymentMode;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ReimbursementPayRequest {
    @NotNull(message = "Payment Method is required")
    private PaymentMode paymentMethod;

    @NotNull(message = "Payment Date is required")
    private LocalDate paymentDate;

    private String paymentReference;
    private java.util.UUID employeePayableAccountId;
    private java.util.UUID bankOrCashAccountId;
}
