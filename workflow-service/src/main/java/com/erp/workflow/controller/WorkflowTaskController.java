package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.ApproveTaskRequest;
import com.erp.workflow.dto.request.DelegateTaskRequest;
import com.erp.workflow.dto.request.RejectTaskRequest;
import com.erp.workflow.dto.request.ReturnTaskRequest;
import com.erp.workflow.dto.response.WorkflowTaskResponse;
import com.erp.workflow.enums.WorkflowTaskStatus;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowExecutionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow/tasks")
@RequiredArgsConstructor
@Tag(name = "Workflow Tasks", description = "Actions on approval tasks (Approve, Reject, Return, Delegate)")
public class WorkflowTaskController {

    private final WorkflowExecutionService executionService;

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a workflow task")
    public ResponseEntity<ApiResponse<WorkflowTaskResponse>> approveTask(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) ApiRequest<ApproveTaskRequest> request) {
        ApproveTaskRequest data = (request != null && request.getData() != null)
                ? request.getData()
                : ApproveTaskRequest.builder().taskId(id).build();

        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();

        WorkflowTaskResponse response = executionService.approveTask(id, data, userId, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Task approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a workflow task with reason")
    public ResponseEntity<ApiResponse<WorkflowTaskResponse>> rejectTask(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<RejectTaskRequest> request) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();

        WorkflowTaskResponse response = executionService.rejectTask(id, request.getData(), userId, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Task rejected"));
    }

    @PostMapping("/{id}/return")
    @Operation(summary = "Return task/document back to initiator for revisions")
    public ResponseEntity<ApiResponse<WorkflowTaskResponse>> returnTask(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<ReturnTaskRequest> request) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();

        WorkflowTaskResponse response = executionService.returnTask(id, request.getData(), userId, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Task returned to initiator"));
    }

    @PostMapping("/{id}/delegate")
    @Operation(summary = "Delegate a task to another user")
    public ResponseEntity<ApiResponse<WorkflowTaskResponse>> delegateTask(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<DelegateTaskRequest> request) {
        UUID userId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        String username = SecurityUtils.getCurrentUsername();

        WorkflowTaskResponse response = executionService.delegateTask(id, request.getData(), userId, username);
        return ResponseEntity.ok(ApiResponse.success(response, "Task delegated successfully"));
    }

    @GetMapping("/my-tasks")
    @Operation(summary = "Get pending or completed tasks for current user and assigned roles")
    public ResponseEntity<ApiResponse<Page<WorkflowTaskResponse>>> getMyTasks(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) WorkflowTaskStatus status,
            Pageable pageable) {
        UUID currentUserId = SecurityUtils.getCurrentUserId()
                .orElseThrow(() -> new UnauthorizedWorkflowActionException("User identity is required"));
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        UUID effectiveUserId = (isSystemAdmin && userId != null) ? userId : currentUserId;
        List<String> roles = SecurityUtils.getCurrentRoles();

        Page<WorkflowTaskResponse> page = executionService.getUserTasks(
                effectiveUserId, roles, status != null ? status : WorkflowTaskStatus.PENDING, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }
}
