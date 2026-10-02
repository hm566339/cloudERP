package com.erp.account.modules.expense.dto;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReimbursementStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ReimbursementResponse {
    private UUID id;
    private UUID companyId;
    private String reimbursementNo;
    private UUID employeeId;
    private String employeeName;
    private String employeeRole;
    private UUID expenseClaimId;
    private String expenseClaimNo;
    private BigDecimal expenseClaimAmount;
    private LocalDate reimbursementDate;
    private BigDecimal reimbursementAmount;
    private BigDecimal reimbursedAmount;
    private BigDecimal balanceDue;
    private ReimbursementStatus status;
    private PaymentMode paymentMethod;
    private String paymentReference;
    private LocalDate paymentDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
