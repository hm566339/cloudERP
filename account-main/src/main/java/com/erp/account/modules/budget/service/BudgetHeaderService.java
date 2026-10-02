package com.erp.account.modules.budget.service;

import java.util.List;
import java.util.UUID;

import com.erp.account.modules.budget.dto.response.BudgetHeaderResponse;
import com.erp.account.modules.budget.dto.response.BudgetHeaderResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.budget.dto.request.BudgetHeaderFilterDto;
import com.erp.account.modules.budget.dto.request.BudgetHeaderRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;

import org.springframework.data.domain.Pageable;

public interface BudgetHeaderService {

    PostResponse createBudgetHeader(RequestWrapper<BudgetHeaderRequest> request, UUID companyId);

    PostResponse updateBudgetHeader(UUID budgetHeaderId, RequestWrapper<BudgetHeaderRequest> request);

    PostResponse deleteBudgetHeader(UUID budgetHeaderId);

    BudgetHeaderResponse getBudgetHeaderById(UUID budgetHeaderId);

    BudgetHeaderResponseList getBudgetHeaders(BudgetHeaderFilterDto filter, Pageable pageable);

    PostResponse createBudgetLine(UUID budgetHeaderId, RequestWrapper<BudgetLineRequest> request);

    PostResponse updateBudgetLine(UUID lineId, RequestWrapper<BudgetLineRequest> request);

    PostResponse deleteBudgetLine(UUID lineId);

    List<BudgetLineResponse> getBudgetLinesByHeader(UUID budgetHeaderId);
}
