package com.erp.inventory.modules.workflow.client;

import com.erp.inventory.common.dto.request.ApiRequest;
import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.workflow.dto.WorkflowSubmitRequestDto;
import com.erp.inventory.modules.workflow.dto.WorkflowTransactionDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.UUID;

@Service
@Slf4j
public class WorkflowClientImpl implements WorkflowClient {

    private final RestClient restClient;

    @Value("${workflow.service.url:http://workflow-service:8083}")
    private String workflowServiceUrl;

    @Value("${inventory.service.callback-base-url:http://inventory-service:8082}")
    private String callbackBaseUrl;

    public WorkflowClientImpl(
            @Value("${workflow.service.url:http://workflow-service:8083}") String workflowServiceUrl,
            @Value("${inventory.service.callback-base-url:http://inventory-service:8082}") String callbackBaseUrl) {
        this.workflowServiceUrl = workflowServiceUrl;
        this.callbackBaseUrl = callbackBaseUrl;
        this.restClient = RestClient.builder()
                .baseUrl(workflowServiceUrl)
                .build();
    }

    @Override
    public WorkflowTransactionDto submitWorkflow(UUID companyId, String documentType, UUID documentId, String documentNumber, String comments) {
        UUID effectiveCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
        UUID userId = CurrentUserContext.getUserId();
        String username = CurrentUserContext.getUsername();

        WorkflowSubmitRequestDto payload = WorkflowSubmitRequestDto.builder()
                .companyId(effectiveCompanyId)
                .moduleName("INVENTORY")
                .entityType(documentType)
                .entityId(documentId)
                .documentType(documentType)
                .documentId(documentId)
                .documentNumber(documentNumber)
                .callbackUrl(callbackBaseUrl + "/api/inventory/workflow/callback")
                .initiatedBy(userId)
                .initiatedByName(username)
                .comments(comments)
                .build();

        try {
            ApiResponse<WorkflowTransactionDto> response = restClient.post()
                    .uri("/api/v1/workflow/transactions/submit")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new ApiRequest<>(payload))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<WorkflowTransactionDto>>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                String errorMsg = response != null ? response.getMessage() : "Unknown error";
                log.error("Failed to submit workflow to workflow-service: {}", errorMsg);
                throw new BusinessValidationException("Failed to initiate workflow: " + errorMsg);
            }
            return response.getData();
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error communicating with workflow-service on submitWorkflow: {}", e.getMessage());
            throw new BusinessValidationException("Failed to submit workflow transaction: " + e.getMessage());
        }
    }

    @Override
    public WorkflowTransactionDto getWorkflow(UUID transactionId) {
        UUID companyId = TenantUtils.getCurrentCompanyId();
        try {
            ApiResponse<WorkflowTransactionDto> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/{id}")
                            .queryParam("companyId", companyId)
                            .build(transactionId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<WorkflowTransactionDto>>() {});
            return response != null ? response.getData() : null;
        } catch (Exception e) {
            log.debug("Workflow transaction {} lookup failed: {}", transactionId, e.getMessage());
            return null;
        }
    }

    @Override
    public WorkflowTransactionDto getWorkflowByDocument(UUID companyId, String documentType, UUID documentId) {
        UUID effectiveCompanyId = companyId != null ? companyId : TenantUtils.getCurrentCompanyId();
        try {
            ApiResponse<WorkflowTransactionDto> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/document/{documentType}/{documentId}")
                            .queryParam("companyId", effectiveCompanyId)
                            .build(documentType, documentId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<WorkflowTransactionDto>>() {});
            return response != null ? response.getData() : null;
        } catch (Exception e) {
            log.debug("Workflow document lookup skipped or failed for {} {}: {}", documentType, documentId, e.getMessage());
            return null;
        }
    }

    @Override
    public WorkflowTransactionDto cancelWorkflow(UUID transactionId, String reason) {
        try {
            ApiResponse<WorkflowTransactionDto> response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/{id}/cancel")
                            .queryParam("reason", reason != null ? reason : "Cancelled by user")
                            .build(transactionId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<ApiResponse<WorkflowTransactionDto>>() {});
            return response != null ? response.getData() : null;
        } catch (Exception e) {
            log.error("Failed to cancel workflow transaction {}: {}", transactionId, e.getMessage());
            throw new BusinessValidationException("Failed to cancel workflow: " + e.getMessage());
        }
    }
}
