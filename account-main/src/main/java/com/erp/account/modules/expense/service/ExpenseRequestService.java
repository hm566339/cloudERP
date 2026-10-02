package com.erp.account.modules.expense.service;

import com.erp.account.modules.expense.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ExpenseRequestService {

    ExpenseRequestResponse createExpenseRequest(UUID requestCompanyId, ExpenseRequestCreateRequest request);

    ExpenseRequestResponse getExpenseRequestById(UUID requestCompanyId, UUID id);

    Page<ExpenseRequestResponse> getAllExpenseRequests(UUID requestCompanyId, ExpenseRequestFilterDto filter, Pageable pageable);

    java.util.List<EmployeeExpenseBalanceResponse> getConsolidatedEmployeeExpenseBalances(UUID requestCompanyId, UUID employeeDriverId);

    ExpenseRequestResponse updateExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestUpdateRequest request);

    ExpenseRequestResponse submitExpenseRequest(UUID requestCompanyId, UUID id);

    ExpenseRequestResponse approveExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestApproveRequest request);

    ExpenseRequestResponse rejectExpenseRequest(UUID requestCompanyId, UUID id, ExpenseRequestRejectRequest request);

    ExpenseRequestResponse cancelExpenseRequest(UUID requestCompanyId, UUID id);
}
