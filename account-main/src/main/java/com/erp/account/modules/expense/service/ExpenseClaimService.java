package com.erp.account.modules.expense.service;

import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expense.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ExpenseClaimService {

    ExpenseClaimResponse createExpenseClaim(UUID companyId, ExpenseClaimCreateRequest request);

    ExpenseClaimResponse getExpenseClaimById(UUID companyId, UUID id);

    Page<ExpenseClaimResponse> getAllExpenseClaims(UUID companyId, ExpenseClaimFilterDto filter, Pageable pageable);

    ExpenseClaimResponse updateExpenseClaim(UUID companyId, UUID id, ExpenseClaimUpdateRequest request);

    PostResponse deleteExpenseClaim(UUID companyId, UUID id);

    ExpenseClaimResponse submitExpenseClaim(UUID companyId, UUID id);

    ExpenseClaimResponse approveExpenseClaim(UUID companyId, UUID id, ExpenseClaimApproveRequest request);

    ExpenseClaimResponse rejectExpenseClaim(UUID companyId, UUID id, ExpenseClaimRejectRequest request);

    ExpenseClaimResponse cancelExpenseClaim(UUID companyId, UUID id);
}
