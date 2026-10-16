package com.erp.manufacturing.workflow.client;

import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.util.CurrentUserContext;
import com.erp.manufacturing.util.TenantUtils;
import com.erp.manufacturing.workflow.dto.WorkflowSubmitRequestDto;
import com.erp.manufacturing.workflow.dto.WorkflowTransactionDto;
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

    @Value("${manufacturing.service.callback-base-url:http://manufacturing-service:8084}")
    private String callbackBaseUrl;

    public WorkflowClientImpl(
            @Value("${workflow.service.url:http://workflow-service:8083}") String workflowServiceUrl,
            @Value("${manufacturing.service.callback-base-url:http://manufacturing-service:8084}") String callbackBaseUrl) {
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

        WorkflowSubmitRequestDto payload = WorkflowSubmitRequestDto.builder()
                .companyId(effectiveCompanyId)
                .moduleName("MANUFACTURING")
                .entityType(documentType)
                .entityId(documentId)
                .documentType(documentType)
                .documentId(documentId)
                .documentNumber(documentNumber)
                .callbackUrl(callbackBaseUrl + "/api/manufacturing/workflow/callback")
                .initiatedBy(userId)
                .initiatedByName("User-" + (userId != null ? userId.toString().substring(0, 8) : "System"))
                .comments(comments)
                .build();

        try {
            InventoryApiResponse<WorkflowTransactionDto> response = restClient.post()
                    .uri("/api/v1/workflow/transactions/submit")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new InventoryApiRequest<>(payload))
                    .retrieve()
                    .body(new ParameterizedTypeReference<InventoryApiResponse<WorkflowTransactionDto>>() {});

            if (response == null || !response.isSuccess() || response.getData() == null) {
                String errorMsg = response != null ? response.getMessage() : "Unknown error";
                log.error("Failed to submit manufacturing workflow to workflow-service: {}", errorMsg);
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
            InventoryApiResponse<WorkflowTransactionDto> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/{id}")
                            .queryParam("companyId", companyId)
                            .build(transactionId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<InventoryApiResponse<WorkflowTransactionDto>>() {});
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
            InventoryApiResponse<WorkflowTransactionDto> response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/document/{documentType}/{documentId}")
                            .queryParam("companyId", effectiveCompanyId)
                            .build(documentType, documentId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<InventoryApiResponse<WorkflowTransactionDto>>() {});
            return response != null ? response.getData() : null;
        } catch (Exception e) {
            log.debug("Workflow document lookup skipped or failed for {} {}: {}", documentType, documentId, e.getMessage());
            return null;
        }
    }

    @Override
    public WorkflowTransactionDto cancelWorkflow(UUID transactionId, String reason) {
        try {
            InventoryApiResponse<WorkflowTransactionDto> response = restClient.post()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/workflow/transactions/{id}/cancel")
                            .queryParam("reason", reason != null ? reason : "Cancelled by user")
                            .build(transactionId))
                    .retrieve()
                    .body(new ParameterizedTypeReference<InventoryApiResponse<WorkflowTransactionDto>>() {});
            return response != null ? response.getData() : null;
        } catch (Exception e) {
            log.error("Failed to cancel workflow transaction {}: {}", transactionId, e.getMessage());
            throw new BusinessValidationException("Failed to cancel workflow: " + e.getMessage());
        }
    }
}
