package com.erp.account.modules.expensecategory.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryFilterDto;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryRequest;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponse;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponseList;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ExpenseCategoryService {

    PostResponse createExpenseCategory(RequestWrapper<ExpenseCategoryRequest> requestWrapper, UUID companyId);

    PostResponse updateExpenseCategory(UUID id, RequestWrapper<ExpenseCategoryRequest> requestWrapper);

    PostResponse deleteExpenseCategory(UUID id);

    ExpenseCategoryResponse getExpenseCategoryById(UUID id);

    ExpenseCategoryResponseList getAllExpenseCategories(ExpenseCategoryFilterDto filter, Pageable pageable);
}
