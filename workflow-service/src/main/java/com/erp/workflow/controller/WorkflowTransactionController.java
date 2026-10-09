package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.AddCommentRequest;
import com.erp.workflow.dto.request.CancelWorkflowRequest;
import com.erp.workflow.dto.request.SubmitWorkflowRequest;
import com.erp.workflow.dto.response.WorkflowActionResponse;
import com.erp.workflow.dto.response.WorkflowCommentResponse;
import com.erp.workflow.dto.response.WorkflowTransactionResponse;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow/transactions")
@RequiredArgsConstructor
@Tag(name = "Workflow Transactions", description = "Submit and track workflow execution for ERP documents")
public class WorkflowTransactionController {

    private final WorkflowExecutionService executionService;

    @PostMapping("/submit")
    @Operation(summary = "Submit a document to workflow (called by Account, Inventory, CRM, etc.)")
    public ResponseEntity<ApiResponse<WorkflowTransactionResponse>> submitWorkflow(
            @Valid @RequestBody ApiRequest<SubmitWorkflowRequest> request) {
        SubmitWorkflowRequest data = request.getData();
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        if (!isSystemAdmin || data.getCompanyId() == null) {
            data.setCompanyId(SecurityUtils.getCurrentCompanyId().orElse(data.getCompanyId()));
        }
        if (data.getInitiatedBy() == null) {
            data.setInitiatedBy(SecurityUtils.getCurrentUserId().orElse(null));
        }
        if (data.getInitiatedByName() == null) {
            data.setInitiatedByName(SecurityUtils.getCurrentUsername());
        }

        WorkflowTransactionResponse response = executionService.submitWorkflow(data);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Workflow initiated"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get workflow transaction details and progress")
    public ResponseEntity<ApiResponse<WorkflowTransactionResponse>> getTransaction(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        UUID effectiveCompanyId = (isSystemAdmin && companyId != null)
                ? companyId
                : SecurityUtils.getCurrentCompanyId().orElse(companyId);
        WorkflowTransactionResponse response = executionService.getTransaction(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/document")
    @Operation(summary = "Get workflow transaction by business document ID")
    public ResponseEntity<ApiResponse<WorkflowTransactionResponse>> getByDocument(
            @RequestParam(required = false) UUID companyId,
            @RequestParam String documentType,
            @RequestParam UUID documentId) {
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        UUID effectiveCompanyId = (isSystemAdmin && companyId != null)
                ? companyId
                : SecurityUtils.getCurrentCompanyId().orElse(companyId);
        WorkflowTransactionResponse response = executionService.getTransactionByDocument(effectiveCompanyId, documentType, documentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "Search and list workflow transactions")
    public ResponseEntity<ApiResponse<Page<WorkflowTransactionResponse>>> searchTransactions(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String status,
            Pageable pageable) {
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        UUID effectiveCompanyId = (isSystemAdmin && companyId != null)
                ? companyId
                : SecurityUtils.getCurrentCompanyId().orElse(companyId);
        Page<WorkflowTransactionResponse> page = executionService.searchTransactions(
                effectiveCompanyId, moduleName, documentType, status, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a running workflow transaction")
    public ResponseEntity<ApiResponse<WorkflowTransactionResponse>> cancelWorkflow(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<CancelWorkflowRequest> request) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();
        WorkflowTransactionResponse response = executionService.cancelWorkflow(id, request.getData(), userId, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Workflow cancelled"));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to a workflow transaction")
    public ResponseEntity<ApiResponse<WorkflowCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<AddCommentRequest> request) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();
        WorkflowCommentResponse response = executionService.addComment(id, request.getData(), userId, username);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Comment added"));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Get all comments for a workflow transaction")
    public ResponseEntity<ApiResponse<List<WorkflowCommentResponse>>> getComments(@PathVariable UUID id) {
        List<WorkflowCommentResponse> comments = executionService.getComments(id);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @GetMapping("/{id}/audit-trail")
    @Operation(summary = "Get immutable audit trail of all actions on a workflow transaction")
    public ResponseEntity<ApiResponse<List<WorkflowActionResponse>>> getAuditTrail(@PathVariable UUID id) {
        List<WorkflowActionResponse> history = executionService.getAuditHistory(id);
        return ResponseEntity.ok(ApiResponse.success(history));
    }
}
