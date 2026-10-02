package com.erp.account.modules.expense.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.service.ReimbursementService;
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
@RequestMapping("/api/account/v1/reimbursements")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reimbursement API", description = "Endpoints for managing reimbursements")
public class ReimbursementController {

    private final ReimbursementService reimbursementService;

    @PostMapping
    @Operation(summary = "Create Reimbursement", description = "Create a new reimbursement")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> createReimbursement(
            @Valid @RequestBody RequestWrapper<ReimbursementCreateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        
        ReimbursementCreateRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/reimbursements - Creating new reimbursement");

        ReimbursementResponse response = reimbursementService.createReimbursement(companyId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Reimbursement", description = "Get reimbursement by ID")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> getReimbursementById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/reimbursements/{} - Fetching reimbursement", id);
        ReimbursementResponse response = reimbursementService.getReimbursementById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement fetched successfully"));
    }

    @GetMapping
    @Operation(summary = "List Reimbursements", description = "Get all reimbursements with pagination and filter")
    public ResponseEntity<ApiResponse<List<ReimbursementResponse>>> getAllReimbursements(
            @ModelAttribute ReimbursementFilterRequest filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("GET /api/account/v1/reimbursements - Listing reimbursements");
        
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        Page<ReimbursementResponse> responsePage = reimbursementService.getAllReimbursements(companyId, filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(responsePage, "Reimbursements fetched successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Reimbursement", description = "Update an existing draft reimbursement")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> updateReimbursement(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ReimbursementUpdateRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        
        ReimbursementUpdateRequest request = requestWrapper.getData();
        log.info("PUT /api/account/v1/reimbursements/{} - Updating reimbursement", id);

        ReimbursementResponse response = reimbursementService.updateReimbursement(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Reimbursement", description = "Delete (soft) a reimbursement")
    public ResponseEntity<ApiResponse<PostResponse>> deleteReimbursement(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("DELETE /api/account/v1/reimbursements/{} - Deleting reimbursement", id);
        PostResponse response = reimbursementService.deleteReimbursement(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement deleted successfully"));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit Reimbursement", description = "Submit a reimbursement for approval")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> submitReimbursement(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("POST /api/account/v1/reimbursements/{}/submit - Submitting reimbursement", id);
        ReimbursementResponse response = reimbursementService.submitReimbursement(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement submitted successfully"));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve Reimbursement", description = "Approve a submitted reimbursement")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> approveReimbursement(
            @PathVariable UUID id,
            @RequestBody(required = false) RequestWrapper<ReimbursementApproveRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        
        ReimbursementApproveRequest request = requestWrapper != null ? requestWrapper.getData() : new ReimbursementApproveRequest();
        log.info("POST /api/account/v1/reimbursements/{}/approve - Approving reimbursement", id);
        
        ReimbursementResponse response = reimbursementService.approveReimbursement(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject Reimbursement", description = "Reject a submitted reimbursement")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> rejectReimbursement(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ReimbursementRejectRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        
        ReimbursementRejectRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/reimbursements/{}/reject - Rejecting reimbursement", id);
        
        ReimbursementResponse response = reimbursementService.rejectReimbursement(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement rejected successfully"));
    }

    @PostMapping("/{id}/pay")
    @Operation(summary = "Pay Reimbursement", description = "Mark an approved reimbursement as paid")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> payReimbursement(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ReimbursementPayRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        
        ReimbursementPayRequest request = requestWrapper.getData();
        log.info("POST /api/account/v1/reimbursements/{}/pay - Paying reimbursement", id);
        
        ReimbursementResponse response = reimbursementService.payReimbursement(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement marked as paid successfully"));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel Reimbursement", description = "Cancel a reimbursement")
    public ResponseEntity<ApiResponse<ReimbursementResponse>> cancelReimbursement(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        
        log.info("POST /api/account/v1/reimbursements/{}/cancel - Cancelling reimbursement", id);
        ReimbursementResponse response = reimbursementService.cancelReimbursement(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Reimbursement cancelled successfully"));
    }
}
