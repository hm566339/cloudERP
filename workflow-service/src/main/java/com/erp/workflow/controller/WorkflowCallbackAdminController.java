package com.erp.workflow.controller;

import com.erp.workflow.callback.WorkflowCallbackService;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.response.WorkflowCallbackLogResponse;
import com.erp.workflow.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow/callbacks")
@RequiredArgsConstructor
@Tag(name = "Workflow Callbacks Admin", description = "Administrative operations for inspecting and retrying workflow callbacks")
public class WorkflowCallbackAdminController {

    private final WorkflowCallbackService callbackService;

    @GetMapping("/exhausted")
    @Operation(summary = "List exhausted callback logs that exceeded automatic retry attempts")
    public ResponseEntity<ApiResponse<List<WorkflowCallbackLogResponse>>> getExhaustedCallbacks(
            @RequestParam(required = false) UUID companyId) {
        checkAdminAccess();
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        List<WorkflowCallbackLogResponse> logs = callbackService.getExhaustedCallbacks(effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(logs, "Exhausted callback logs retrieved successfully"));
    }

    @PostMapping("/{id}/retry")
    @Operation(summary = "Manually retry a failed callback")
    public ResponseEntity<ApiResponse<WorkflowCallbackLogResponse>> retryCallback(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        checkAdminAccess();
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        WorkflowCallbackLogResponse response = callbackService.retryCallbackManually(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Callback retried"));
    }

    private void checkAdminAccess() {
        boolean isAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN")
                || SecurityUtils.hasRole("WORKFLOW_ADMIN")
                || SecurityUtils.hasRole("ADMIN")
                || SecurityUtils.hasRole("SUPPORT");
        if (!isAdmin) {
            throw new AccessDeniedException("Administrative privileges required to access callback operations");
        }
    }

    private UUID resolveCompanyId(UUID requestCompanyId) {
        boolean isPrivileged = SecurityUtils.hasRole("SYSTEM_ADMIN");
        if (isPrivileged && requestCompanyId != null) {
            return requestCompanyId;
        }
        return SecurityUtils.getCurrentCompanyId().orElse(requestCompanyId);
    }
}
