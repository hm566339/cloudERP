package com.erp.account.modules.expense.dto;

import com.erp.account.enums.ApprovalStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExpenseClaimResponse {

    private UUID id;
    private UUID companyId;
    private String claimNo;
    private UUID employeeId;
    private String employeeName;
    private String employeeRole;
    private LocalDate claimDate;
    private BigDecimal claimAmount;
    private ApprovalStatus status;

    // Linked Expense Request summary
    private UUID expenseRequestId;
    private String expenseRequestNumber;
    private BigDecimal requestedAmount;
    private BigDecimal approvedAmount;

    // Items
    private List<ExpenseClaimItemResponse> items;

    // Audit
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
}
