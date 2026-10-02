package com.erp.account.modules.expense.dto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReimbursementStatus;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class ReimbursementFilterRequest {
    private String reimbursementNo;
    private UUID employeeId;
    private UUID expenseClaimId;
    private ReimbursementStatus status;
    private PaymentMode paymentMethod;
    private LocalDate fromDate;
    private LocalDate toDate;
}
