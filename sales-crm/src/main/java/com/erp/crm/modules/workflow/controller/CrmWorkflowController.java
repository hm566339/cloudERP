package com.erp.crm.modules.workflow.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.quotation.service.CrmQuotationService;
import com.erp.crm.modules.workflow.dto.WorkflowCallbackRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/crm/workflows", "/api/v1/crm/workflows"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Workflow Integration", description = "Callback Receiver for Asynchronous Approval Events from workflow-service")
public class CrmWorkflowController {

    private final CrmQuotationService quotationService;

    @Value("${services.workflow.callback-secret:crm-workflow-callback-secret}")
    private String expectedSecret;

    @PostMapping("/callback")
    @Operation(summary = "Workflow Service Callback Webhook")
    public ResponseEntity<ApiResponse<Void>> handleCallback(
            @RequestHeader(value = "X-Workflow-Secret", required = false) String secret,
            @RequestHeader(value = "X-Internal-Service", required = false) String internalService,
            @RequestBody WorkflowCallbackRequest callback) {

        // Validate HMAC shared secret or internal service identity
        boolean isSecretValid = secret != null && expectedSecret.equals(secret.trim());
        boolean isInternalServiceValid = "workflow-service".equalsIgnoreCase(internalService);

        if (!isSecretValid && !isInternalServiceValid) {
            log.warn("Unauthorized workflow callback attempt rejected. Secret or internal header invalid.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized", "Invalid workflow callback secret or service header", HttpStatus.UNAUTHORIZED));
        }

        log.info("Incoming workflow callback: docType={}, docId={}, action={}, status={}",
                callback.getDocumentType(), callback.getDocumentId(), callback.getAction(), callback.getStatus());

        if ("QUOTATION".equalsIgnoreCase(callback.getDocumentType())
                || "DISCOUNT_APPROVAL".equalsIgnoreCase(callback.getDocumentType())) {
            quotationService.handleWorkflowCallback(callback);
        }

        return ResponseEntity.ok(ApiResponse.success("Workflow callback processed successfully"));
    }
}

