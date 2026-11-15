package com.erp.crm.modules.workflow.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmWorkflowClientImpl implements CrmWorkflowClient {

    private final RestClient restClient;

    @Value("${services.workflow.url:http://workflow-service:8083}")
    private String workflowServiceUrl;

    @Value("${sso.base-url:http://localhost:8086/api/crm}")
    private String crmBaseUrl;

    @Override
    public UUID initiateQuotationApproval(UUID companyId, UUID quotationId, String quotationNumber,
                                          UUID initiatedBy, String initiatedByName,
                                          Map<String, Object> variables) {
        String callbackUrl = crmBaseUrl + "/workflows/callback";
        InitiateTransactionRequest request = InitiateTransactionRequest.builder()
                .companyId(companyId)
                .moduleName("CRM")
                .documentType("QUOTATION")
                .documentId(quotationId)
                .documentNumber(quotationNumber)
                .entityType("QUOTATION")
                .entityId(quotationId)
                .initiatedBy(initiatedBy)
                .initiatedByName(initiatedByName)
                .callbackUrl(callbackUrl)
                .variables(variables)
                .build();

        log.info("Submitting quotation approval to workflow-service: {} [quote: {}]", workflowServiceUrl, quotationNumber);
        try {
            var response = restClient.post()
                    .uri(workflowServiceUrl + "/api/v1/workflow/transactions")
                    .header("X-Company-Id", companyId.toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});

            if (response != null && response.containsKey("data")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) response.get("data");
                if (data != null && data.containsKey("transactionId")) {
                    return UUID.fromString(data.get("transactionId").toString());
                }
            }
        } catch (Exception e) {
            log.warn("Could not initiate workflow transaction with workflow-service (service may be offline in dev/test): {}", e.getMessage());
        }
        return UUID.randomUUID();
    }
}

