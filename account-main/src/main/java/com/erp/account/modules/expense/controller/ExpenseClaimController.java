package com.erp.account.modules.expense.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/expenses")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Expenses", description = "Endpoints for managing actual expenses (Expense Claims)")
public class ExpenseClaimController {

    private final ExpenseClaimService expenseClaimService;

    @PostMapping
    @Operation(summary = "Create Expense", description = "Creates a new actual expense claim")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> createExpenseClaim(
            @Valid @RequestBody RequestWrapper<ExpenseClaimCreateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseClaimCreateRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/expenses - Creating new expense claim");

        ExpenseClaimResponse response = expenseClaimService.createExpenseClaim(companyId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Expense", description = "Gets an expense claim by ID")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> getExpenseClaimById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("GET /api/account/v1/expenses/{} - Fetching expense claim", id);
        ExpenseClaimResponse response = expenseClaimService.getExpenseClaimById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense fetched successfully"));
    }

    @GetMapping
    @Operation(summary = "List Expenses", description = "Gets a paginated list of expense claims")
    public ResponseEntity<ApiResponse<List<ExpenseClaimResponse>>> getAllExpenseClaims(
            @ModelAttribute ExpenseClaimFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false) UUID companyId) {

        log.info("GET /api/account/v1/expenses - Listing expense claims");
        
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        Page<ExpenseClaimResponse> responsePage = expenseClaimService.getAllExpenseClaims(companyId, filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(responsePage, "Expenses retrieved successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Expense", description = "Updates an existing expense claim (must be in DRAFT)")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> updateExpenseClaim(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ExpenseClaimUpdateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseClaimUpdateRequest request = requestWrapper.getData();
        log.info("PUT /api/account/v1/expenses/{} - Updating expense claim", id);

        ExpenseClaimResponse response = expenseClaimService.updateExpenseClaim(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Expense", description = "Soft deletes an expense claim")
    public ResponseEntity<ApiResponse<PostResponse>> deleteExpenseClaim(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("DELETE /api/account/v1/expenses/{} - Deleting expense claim", id);
        PostResponse response = expenseClaimService.deleteExpenseClaim(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense deleted successfully"));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit Expense", description = "Submits an expense claim for approval")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> submitExpenseClaim(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("POST /api/account/v1/expenses/{}/submit - Submitting expense claim", id);
        ExpenseClaimResponse response = expenseClaimService.submitExpenseClaim(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense submitted successfully"));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve Expense", description = "Approves an expense claim")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> approveExpenseClaim(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestWrapper<ExpenseClaimApproveRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseClaimApproveRequest request = requestWrapper != null ? requestWrapper.getData() : new ExpenseClaimApproveRequest();
        log.info("POST /api/account/v1/expenses/{}/approve - Approving expense claim", id);
        
        ExpenseClaimResponse response = expenseClaimService.approveExpenseClaim(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject Expense", description = "Rejects an expense claim")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> rejectExpenseClaim(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ExpenseClaimRejectRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseClaimRejectRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/expenses/{}/reject - Rejecting expense claim", id);
        
        ExpenseClaimResponse response = expenseClaimService.rejectExpenseClaim(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense rejected successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel Expense", description = "Cancels an expense claim")
    public ResponseEntity<ApiResponse<ExpenseClaimResponse>> cancelExpenseClaim(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("POST /api/account/v1/expenses/{}/cancel - Cancelling expense claim", id);
        ExpenseClaimResponse response = expenseClaimService.cancelExpenseClaim(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense cancelled successfully"));
    }
}
