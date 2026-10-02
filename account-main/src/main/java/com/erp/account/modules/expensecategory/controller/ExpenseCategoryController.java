package com.erp.account.modules.expensecategory.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryFilterDto;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryRequest;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponse;
import com.erp.account.modules.expensecategory.dto.response.ExpenseCategoryResponseList;
import com.erp.account.modules.expensecategory.service.ExpenseCategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/expense-categories")
@RequiredArgsConstructor
@Slf4j
public class ExpenseCategoryController {

    private final ExpenseCategoryService expenseCategoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createExpenseCategory(
            @Valid @RequestBody RequestWrapper<ExpenseCategoryRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        log.info("Received request to create expense category");
        PostResponse response = expenseCategoryService.createExpenseCategory(requestWrapper, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense category created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updateExpenseCategory(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ExpenseCategoryRequest> requestWrapper) {
        log.info("Received request to update expense category with id: {}", id);
        PostResponse response = expenseCategoryService.updateExpenseCategory(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense category updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteExpenseCategory(@PathVariable UUID id) {
        log.info("Received request to soft delete expense category with id: {}", id);
        PostResponse response = expenseCategoryService.deleteExpenseCategory(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense category deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> getExpenseCategoryById(@PathVariable UUID id) {
        log.info("Received request to fetch expense category with id: {}", id);
        ExpenseCategoryResponse response = expenseCategoryService.getExpenseCategoryById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense category fetched successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<ExpenseCategoryResponseList>> getAllExpenseCategories(
            @ModelAttribute ExpenseCategoryFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        log.info("Received request to get all expense categories");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        ExpenseCategoryResponseList response = expenseCategoryService.getAllExpenseCategories(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense categories retrieved successfully"));
    }
}
