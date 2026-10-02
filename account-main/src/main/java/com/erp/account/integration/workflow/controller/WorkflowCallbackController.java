package com.erp.account.integration.workflow.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.integration.workflow.dto.WorkflowCallbackEventDto;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account/workflow")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Workflow Callback", description = "Receives asynchronous workflow completion events from Workflow Service")
public class WorkflowCallbackController {

    private final WorkflowDocumentRegistry documentRegistry;

    @PostMapping("/callback")
    @Operation(summary = "Handle webhook callback from workflow-service")
    public ResponseEntity<ApiResponse<Void>> handleWorkflowCallback(@RequestBody WorkflowCallbackEventDto event) {
        log.info("Received workflow callback: eventType={}, docType={}, docId={}, status={}",
                event.getEventType(), event.getDocumentType(), event.getDocumentId(), event.getStatus());

        if (event.getDocumentType() == null || event.getDocumentId() == null || event.getCompanyId() == null) {
            log.warn("Missing required document parameters in workflow callback: {}", event);
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing required document identifiers", (Void) null));
        }

        try {
            WorkflowDocument document = documentRegistry.load(
                    event.getDocumentType(),
                    event.getDocumentId(),
                    event.getCompanyId()
            );

            if (document != null) {
                switch (event.getEventType()) {
                    case "WORKFLOW_APPROVED" -> {
                        log.info("Applying approval on document {} ({})", event.getDocumentType(), event.getDocumentId());
                        document.onWorkflowApproved();
                    }
                    case "WORKFLOW_REJECTED" -> {
                        log.info("Applying rejection on document {} ({})", event.getDocumentType(), event.getDocumentId());
                        document.onWorkflowRejected();
                    }
                    case "WORKFLOW_CANCELLED" -> {
                        log.info("Applying cancellation on document {} ({})", event.getDocumentType(), event.getDocumentId());
                        document.onWorkflowCancelled();
                    }
                    case "WORKFLOW_RETURNED" -> {
                        log.info("Applying return on document {} ({})", event.getDocumentType(), event.getDocumentId());
                        document.onWorkflowSubmitted();
                    }
                    default -> log.debug("Unhandled workflow event type: {}", event.getEventType());
                }
            }
        } catch (Exception ex) {
            log.error("Error processing workflow callback for document {}: {}", event.getDocumentId(), ex.getMessage(), ex);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to process callback: " + ex.getMessage(), (Void) null));
        }

        return ResponseEntity.ok(ApiResponse.success(null, "Workflow event handled successfully"));
    }
}
