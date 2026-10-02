package com.erp.account.modules.budget.controller;

import java.util.List;
import java.util.UUID;

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

import com.erp.account.modules.budget.dto.response.BudgetHeaderResponse;
import com.erp.account.modules.budget.dto.response.BudgetHeaderResponseList;
import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.budget.dto.request.BudgetHeaderFilterDto;
import com.erp.account.modules.budget.dto.request.BudgetHeaderRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.modules.budget.service.BudgetHeaderService;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.ModelAttribute;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/api/account/budget-headers")
@AllArgsConstructor
@Slf4j
public class BudgetHeaderController {

    private final BudgetHeaderService budgetHeaderService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createBudgetHeader(
            @Valid @RequestBody RequestWrapper<BudgetHeaderRequest> requestWrapper) {
        UUID companyId = com.erp.account.util.TenantUtils.getCurrentCompanyId();
        BudgetHeaderRequest request = requestWrapper.unwrap();

        log.info("Received request to create budget header for companyId={} fiscalYearId={} budgetName={} totalBudget={}",
                companyId, request.getFiscalYearId(), request.getBudgetName(), request.getTotalBudget());
        PostResponse response = budgetHeaderService.createBudgetHeader(requestWrapper, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget header created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> updateBudgetHeader(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<BudgetHeaderRequest> requestWrapper) {
        BudgetHeaderRequest request = requestWrapper.unwrap();

        log.info("Received request to update budget header id={}", id);
        PostResponse response = budgetHeaderService.updateBudgetHeader(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget header updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteBudgetHeader(@PathVariable UUID id) {
        log.info("Received request to delete budget header id={}", id);
        PostResponse response = budgetHeaderService.deleteBudgetHeader(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget header deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetHeaderResponse>> getBudgetHeaderById(@PathVariable UUID id) {
        log.info("Received request to fetch budget header id={}", id);
        BudgetHeaderResponse response = budgetHeaderService.getBudgetHeaderById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget header retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BudgetHeaderResponseList>> getBudgetHeaders(
            @ModelAttribute BudgetHeaderFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        log.info("Received request to list budget headers with pagination");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, resolvedSortBy));

        BudgetHeaderResponseList response = budgetHeaderService.getBudgetHeaders(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget headers retrieved successfully"));
    }

    @PostMapping("/{budgetHeaderId}/lines")
    public ResponseEntity<ApiResponse<PostResponse>> createBudgetLine(
            @PathVariable UUID budgetHeaderId,
            @Valid @RequestBody RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();

        log.info("Received request to create budget line for headerId={}", budgetHeaderId);
        PostResponse response = budgetHeaderService.createBudgetLine(budgetHeaderId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget line created successfully"));
    }

    @PutMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<PostResponse>> updateBudgetLine(
            @PathVariable UUID lineId,
            @Valid @RequestBody RequestWrapper<BudgetLineRequest> requestWrapper) {
        BudgetLineRequest request = requestWrapper.unwrap();

        log.info("Received request to update budget line id={}", lineId);
        PostResponse response = budgetHeaderService.updateBudgetLine(lineId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget line updated successfully"));
    }

    @DeleteMapping("/lines/{lineId}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteBudgetLine(@PathVariable UUID lineId) {
        log.info("Received request to delete budget line id={}", lineId);
        PostResponse response = budgetHeaderService.deleteBudgetLine(lineId);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget line deleted successfully"));
    }

    @GetMapping("/{budgetHeaderId}/lines")
    public ResponseEntity<ApiResponse<List<BudgetLineResponse>>> getBudgetLinesByHeader(
            @PathVariable UUID budgetHeaderId) {

        log.info("Received request to fetch budget lines for headerId={}", budgetHeaderId);
        List<BudgetLineResponse> response = budgetHeaderService.getBudgetLinesByHeader(budgetHeaderId);
        return ResponseEntity.ok(ApiResponse.success(response, "Budget lines retrieved successfully"));
    }
}
