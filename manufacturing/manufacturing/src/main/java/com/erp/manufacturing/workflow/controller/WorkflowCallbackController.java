package com.erp.manufacturing.workflow.controller;

import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.workflow.document.WorkflowDocument;
import com.erp.manufacturing.workflow.document.WorkflowDocumentRegistry;
import com.erp.manufacturing.workflow.dto.WorkflowCallbackEventDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/manufacturing/workflow/callback", "/api/v1/manufacturing/workflow/callback"})
@RequiredArgsConstructor
@Slf4j
public class WorkflowCallbackController {

    private final WorkflowDocumentRegistry documentRegistry;

    @Value("${workflow.callback.secret:erp-workflow-internal-callback-secret}")
    private String expectedSecret;

    @PostMapping
    public ResponseEntity<InventoryApiResponse<Void>> handleWorkflowCallback(
            @RequestHeader(value = "X-Workflow-Secret", required = false) String secretHeader,
            @RequestBody WorkflowCallbackEventDto event) {

        if (!StringUtils.hasText(expectedSecret)) {
            log.error("Manufacturing workflow callback secret is not configured on this server. Rejecting callback.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(InventoryApiResponse.<Void>builder()
                            .success(false)
                            .message("Server configuration error: Workflow callback secret is not configured")
                            .status(500)
                            .build());
        }

        if (!StringUtils.hasText(secretHeader) || !expectedSecret.equals(secretHeader)) {
            log.warn("Unauthorized manufacturing workflow callback attempt. Expected secret does not match header.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(InventoryApiResponse.<Void>builder()
                            .success(false)
                            .message("Unauthorized: Invalid workflow callback secret")
                            .status(401)
                            .build());
        }

        if (event == null || event.getDocumentType() == null || event.getDocumentId() == null || event.getCompanyId() == null) {
            log.warn("Missing required document parameters in manufacturing workflow callback: {}", event);
            return ResponseEntity.badRequest().body(InventoryApiResponse.<Void>builder()
                    .success(false)
                    .message("Missing required document identifiers")
                    .status(400)
                    .build());
        }

        log.info("Received manufacturing workflow callback: type={}, docType={}, docId={}, status={}",
                event.getEventType(), event.getDocumentType(), event.getDocumentId(), event.getStatus());

        WorkflowDocument document = documentRegistry.load(event.getDocumentType(), event.getDocumentId(), event.getCompanyId());
        if (document == null) {
            log.warn("Manufacturing document not found for workflow callback: type={}, id={}", event.getDocumentType(), event.getDocumentId());
            return ResponseEntity.ok(InventoryApiResponse.<Void>builder()
                    .success(true)
                    .message("Document not found, ignored")
                    .status(200)
                    .build());
        }

        switch (event.getEventType()) {
            case "WORKFLOW_APPROVED" -> document.onWorkflowApproved(event.getMetadata());
            case "WORKFLOW_REJECTED" -> document.onWorkflowRejected();
            case "WORKFLOW_CANCELLED" -> document.onWorkflowCancelled();
            case "WORKFLOW_RETURNED" -> document.onWorkflowReturned();
            default -> log.warn("Unhandled workflow callback event type in manufacturing: {}", event.getEventType());
        }

        return ResponseEntity.ok(InventoryApiResponse.<Void>builder()
                .success(true)
                .message("Workflow callback processed successfully")
                .status(200)
                .build());
    }
}
