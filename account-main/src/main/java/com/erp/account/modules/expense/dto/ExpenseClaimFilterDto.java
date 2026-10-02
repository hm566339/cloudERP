package com.erp.account.modules.expense.dto;

import com.erp.account.enums.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseClaimFilterDto {

    private UUID companyId;
    private String search;
    private ApprovalStatus status;
    private UUID employeeId;
    private UUID expenseRequestId;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private UUID categoryId;
}
