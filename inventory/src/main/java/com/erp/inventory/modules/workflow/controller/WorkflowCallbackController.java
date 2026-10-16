package com.erp.inventory.modules.workflow.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.workflow.document.WorkflowDocument;
import com.erp.inventory.modules.workflow.document.WorkflowDocumentRegistry;
import com.erp.inventory.modules.workflow.dto.WorkflowCallbackEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/inventory/workflow/callback", "/api/v1/inventory/workflow/callback"})
@RequiredArgsConstructor
@Slf4j
public class WorkflowCallbackController {

    private final WorkflowDocumentRegistry documentRegistry;

    @Value("${workflow.callback.secret:erp-workflow-internal-callback-secret}")
    private String expectedSecret;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> handleWorkflowCallback(
            @RequestHeader(value = "X-Workflow-Secret", required = false) String secretHeader,
            @RequestBody WorkflowCallbackEventDto event) {

        if (!StringUtils.hasText(expectedSecret)) {
            log.error("Workflow callback secret is not configured on this server. Rejecting callback.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Server configuration error: Workflow callback secret is not configured", null));
        }

        if (!StringUtils.hasText(secretHeader) || !expectedSecret.equals(secretHeader)) {
            log.warn("Unauthorized inventory workflow callback attempt. Expected secret does not match header.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized: Invalid workflow callback secret", null));
        }

        if (event == null || event.getDocumentType() == null || event.getDocumentId() == null || event.getCompanyId() == null) {
            log.warn("Missing required document parameters in inventory workflow callback: {}", event);
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing required document identifiers", null));
        }

        log.info("Received inventory workflow callback: type={}, docType={}, docId={}, status={}",
                event.getEventType(), event.getDocumentType(), event.getDocumentId(), event.getStatus());

        WorkflowDocument document = documentRegistry.load(event.getDocumentType(), event.getDocumentId(), event.getCompanyId());
        if (document == null) {
            log.warn("Document not found for workflow callback: type={}, id={}", event.getDocumentType(), event.getDocumentId());
            return ResponseEntity.ok(ApiResponse.success(null, "Document not found, ignored"));
        }

        switch (event.getEventType()) {
            case "WORKFLOW_APPROVED" -> document.onWorkflowApproved();
            case "WORKFLOW_REJECTED" -> document.onWorkflowRejected();
            case "WORKFLOW_CANCELLED" -> document.onWorkflowCancelled();
            case "WORKFLOW_RETURNED" -> document.onWorkflowReturned();
            default -> log.warn("Unhandled workflow callback event type: {}", event.getEventType());
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Workflow callback processed successfully"));
    }
}
