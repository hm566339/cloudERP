package com.erp.account.modules.budget.service;

import com.erp.account.modules.budget.dto.request.BudgetLineFilterDto;
import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.modules.budget.dto.response.BudgetLineResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineSummaryResponse;
import com.erp.account.modules.budget.dto.response.BudgetVarianceReportResponse;
import org.springframework.data.domain.Pageable;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.modules.budget.entity.BudgetLine;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.erp.account.modules.budget.dto.response.details.BudgetLineDetailsResponse;

public interface BudgetLineService {

    BudgetLineResponse getBudgetLineById(UUID budgetLineId);

    BudgetLineDetailsResponse getBudgetLineDetailsById(UUID budgetLineId);

    BudgetLineResponseList searchBudgetLines(BudgetLineFilterDto filter, Pageable pageable);

    BudgetLineResponseList getBudgetLinesByHeader(UUID budgetHeaderId, int page, int pageSize);

    BudgetLineResponseList getBudgetLinesByAccount(UUID accountId, int page, int pageSize);

    BudgetLineSummaryResponse getBudgetSummary();

    BudgetVarianceReportResponse getBudgetVarianceReport(
            int page,
            int pageSize,
            UUID budgetHeaderId,
            UUID accountId,
            UUID departmentId);

    void validateBudgetLine(RequestWrapper<BudgetLineRequest> request);

    BudgetLineResponse createBudgetLine(RequestWrapper<BudgetLineRequest> request);

    BudgetLineResponse updateBudgetLine(UUID budgetLineId, RequestWrapper<BudgetLineRequest> request);

    void deleteBudgetLine(UUID budgetLineId);

    BigDecimal calculateUtilization(BudgetLine budgetLine);

    BigDecimal calculateVariance(BudgetLine budgetLine, BigDecimal actualExpense);

    void updateBudgetUtilization(UUID budgetLineId);

    void validateBudgetAvailability(UUID budgetHeaderId, BigDecimal expenseAmount);
}
