package com.erp.account.modules.budget.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.modules.budget.dto.response.details.BudgetLineDetailsResponse;
import com.erp.account.modules.budget.dto.response.BudgetLineResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineSummaryResponse;
import com.erp.account.modules.budget.dto.response.BudgetVarianceReportResponse;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineFilterDto;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import org.springframework.web.bind.annotation.ModelAttribute;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.budget.service.BudgetLineService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/account/budget-lines")
@AllArgsConstructor
public class BudgetLineController {

    private final BudgetLineService budgetLineService;

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetLineResponse>> createBudgetLine(
            @Valid @RequestBody RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("POST /api/budget-lines - create budget line");
        BudgetLineResponse response = budgetLineService.createBudgetLine(requestWrapper);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Budget line created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetLineResponse>> updateBudgetLine(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();
        log.info("PUT /api/budget-lines/{} - update budget line", id);
        BudgetLineResponse response = budgetLineService.updateBudgetLine(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget line updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteBudgetLine(@PathVariable UUID id) {
        log.info("DELETE /api/budget-lines/{} - delete budget line", id);
        budgetLineService.deleteBudgetLine(id);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.builder().message("Budget line deleted successfully").build(), "Budget line deleted successfully"));
    }

    @PutMapping("/{id}/utilization")
    public ResponseEntity<ApiResponse<PostResponse>> refreshBudgetLineUtilization(
            @PathVariable UUID id) {
        log.info("PUT /api/budget-lines/{}/utilization - refresh budget line utilization", id);
        budgetLineService.updateBudgetUtilization(id);
        return ResponseEntity.ok(ApiResponse.success(PostResponse.builder().message("Budget utilization refreshed").build(), "Budget utilization refreshed"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetLineDetailsResponse>> getBudgetLineById(@PathVariable UUID id) {
        log.info("GET /api/budget-lines/{} - get budget line details projection", id);
        BudgetLineDetailsResponse response = budgetLineService.getBudgetLineDetailsById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget line retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BudgetLineResponseList>> searchBudgetLines(
            @ModelAttribute BudgetLineFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        log.info("GET /api/account/budget-lines - search budget lines");

        org.springframework.data.domain.Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? org.springframework.data.domain.Sort.Direction.ASC : org.springframework.data.domain.Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, Math.min(size, 100), org.springframework.data.domain.Sort.by(direction, resolvedSortBy));

        BudgetLineResponseList response = budgetLineService.searchBudgetLines(filter, pageable);

        return ResponseEntity.ok(ApiResponse.success(response, "Budget lines retrieved successfully"));
    }

    @GetMapping("/header/{budgetHeaderId}")
    public ResponseEntity<ApiResponse<BudgetLineResponseList>> getBudgetLinesByHeader(
            @PathVariable UUID budgetHeaderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("GET /api/budget-lines/header/{} - get budget lines by header", budgetHeaderId);
        BudgetLineResponseList response = budgetLineService.getBudgetLinesByHeader(budgetHeaderId, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget lines retrieved successfully"));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<ApiResponse<BudgetLineResponseList>> getBudgetLinesByAccount(
            @PathVariable UUID accountId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        log.info("GET /api/budget-lines/account/{} - get budget lines by account", accountId);
        BudgetLineResponseList response = budgetLineService.getBudgetLinesByAccount(accountId, page, pageSize);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget lines retrieved successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<BudgetLineSummaryResponse>> getBudgetSummary() {
        log.info("GET /api/budget-lines/summary - get budget summary");
        BudgetLineSummaryResponse response = budgetLineService.getBudgetSummary();
        return ResponseEntity.ok(ApiResponse.success(response, "Budget summary retrieved successfully"));
    }

    @GetMapping("/variance-report")
    public ResponseEntity<ApiResponse<BudgetVarianceReportResponse>> getBudgetVarianceReport(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) UUID budgetHeaderId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) UUID departmentId) {
        log.info("GET /api/budget-lines/variance-report - get budget variance report");
        BudgetVarianceReportResponse response = budgetLineService.getBudgetVarianceReport(page, pageSize, budgetHeaderId, accountId, departmentId);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget variance report retrieved successfully"));
    }

}
