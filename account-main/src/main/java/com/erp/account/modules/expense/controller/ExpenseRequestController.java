package com.erp.account.modules.expense.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.service.ExpenseRequestService;
import com.erp.account.common.dto.request.RequestWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/expense-requests")
@RequiredArgsConstructor
@Tag(name = "Expense Requests", description = "Endpoints for managing expense requests and advance requests")
public class ExpenseRequestController {

    private final ExpenseRequestService expenseRequestService;
    private final ObjectMapper objectMapper;

    @PostMapping
    @Operation(summary = "Create Expense Request", description = "Creates a new expense or advance request in DRAFT status")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> createExpenseRequest(
            @Valid @RequestBody RequestWrapper<ExpenseRequestCreateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseRequestCreateRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/expense-requests - Creating expense request for company: {}", companyId);

        ExpenseRequestResponse response = expenseRequestService.createExpenseRequest(companyId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Expense request created successfully", HttpStatus.CREATED));
    }

    @GetMapping("/employee-balances")
    @Operation(summary = "Get Consolidated Employee Expense Balances", description = "Retrieves consolidated approved expense balances grouped by employee with remaining amount > 0")
    public ResponseEntity<ApiResponse<List<EmployeeExpenseBalanceResponse>>> getConsolidatedEmployeeExpenseBalances(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID employeeDriverId) {

        log.info("GET /api/account/v1/expense-requests/employee-balances - Listing consolidated balances for employee: {}", employeeDriverId);
        List<EmployeeExpenseBalanceResponse> balances = expenseRequestService.getConsolidatedEmployeeExpenseBalances(companyId, employeeDriverId);
        return ResponseEntity.ok(ApiResponse.success(balances, "Consolidated employee expense balances retrieved successfully"));
    }

    @GetMapping("/balances")
    @Operation(summary = "Get Consolidated Employee Expense Balances (Alias)", description = "Alias for /employee-balances")
    public ResponseEntity<ApiResponse<List<EmployeeExpenseBalanceResponse>>> getConsolidatedEmployeeExpenseBalancesAlias(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID employeeDriverId) {

        return getConsolidatedEmployeeExpenseBalances(companyId, employeeDriverId);
    }

    @GetMapping
    @Operation(summary = "Get All Expense Requests", description = "Retrieves paginated expense requests with optional filtering, or consolidated balances if consolidated=true")
    public ResponseEntity<?> getAllExpenseRequests(
            @RequestParam(required = false) UUID companyId,
            ExpenseRequestFilterDto filter,
            Pageable pageable) {

        if (filter != null && Boolean.TRUE.equals(filter.getConsolidated())) {
            log.info("GET /api/account/v1/expense-requests - Consolidated employee balance requested");
            List<EmployeeExpenseBalanceResponse> balances = expenseRequestService.getConsolidatedEmployeeExpenseBalances(companyId, filter.getEmployeeDriverId());
            return ResponseEntity.ok(ApiResponse.success(balances, "Consolidated employee expense balances retrieved successfully"));
        }

        log.info("GET /api/account/v1/expense-requests - Listing expense requests");
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Expense requests retrieved successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Expense Request by ID", description = "Retrieves details of an expense request by ID")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> getExpenseRequestById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("GET /api/account/v1/expense-requests/{} - Fetching expense request", id);
        ExpenseRequestResponse response = expenseRequestService.getExpenseRequestById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request retrieved successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Expense Request", description = "Updates a DRAFT expense request")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> updateExpenseRequest(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ExpenseRequestUpdateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseRequestUpdateRequest request = requestWrapper.getData();
        log.info("PUT /api/account/v1/expense-requests/{} - Updating expense request", id);

        ExpenseRequestResponse response = expenseRequestService.updateExpenseRequest(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request updated successfully"));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit Expense Request", description = "Submits a DRAFT expense request for approval")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> submitExpenseRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("POST /api/account/v1/expense-requests/{}/submit - Submitting request", id);
        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request submitted successfully"));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve Expense Request", description = "Approves a PENDING_APPROVAL expense request")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> approveExpenseRequest(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) RequestWrapper<ExpenseRequestApproveRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseRequestApproveRequest request = requestWrapper != null ? requestWrapper.getData() : null;
        log.info("POST /api/account/v1/expense-requests/{}/approve - Approving request", id);

        ExpenseRequestResponse response = expenseRequestService.approveExpenseRequest(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject Expense Request", description = "Rejects a PENDING_APPROVAL expense request")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> rejectExpenseRequest(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ExpenseRequestRejectRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        ExpenseRequestRejectRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/expense-requests/{}/reject - Rejecting request", id);

        ExpenseRequestResponse response = expenseRequestService.rejectExpenseRequest(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request rejected successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel Expense Request", description = "Cancels an expense request")
    public ResponseEntity<ApiResponse<ExpenseRequestResponse>> cancelExpenseRequest(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {

        log.info("POST /api/account/v1/expense-requests/{}/cancel - Cancelling request", id);
        ExpenseRequestResponse response = expenseRequestService.cancelExpenseRequest(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Expense request cancelled successfully"));
    }

    // parsePayload method removed.

}
