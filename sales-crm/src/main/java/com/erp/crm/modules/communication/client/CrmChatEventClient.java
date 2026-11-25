package com.erp.crm.modules.communication.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

/**
 * Client for publishing structured chat events to communication-service.
 * Calls the common internal endpoint POST /api/communication/v1/chat/events
 * with proper service-token authentication and fail-safe non-blocking error handling.
 */
@Component
@Slf4j
public class CrmChatEventClient {

    private final RestClient restClient;

    @Value("${services.communication.url:http://localhost:8084}")
    private String communicationServiceUrl;

    @Value("${app.service-auth.internal-token:mark2-internal-comm-secret-token}")
    private String serviceToken;

    public CrmChatEventClient() {
        this.restClient = RestClient.builder().build();
    }

    @Autowired
    public CrmChatEventClient(@Autowired(required = false) RestClient restClient) {
        this.restClient = restClient != null ? restClient : RestClient.builder().build();
    }

    public void setCommunicationServiceUrl(String communicationServiceUrl) {
        this.communicationServiceUrl = communicationServiceUrl;
    }

    public void setServiceToken(String serviceToken) {
        this.serviceToken = serviceToken;
    }

    /**
     * Publishes a quotation requested event to the internal company chat channel.
     * Guaranteed non-blocking/fail-safe: catches all exceptions so the CRM transaction never fails.
     */
    public void sendQuotationRequestedEvent(UUID companyId, UUID quotationId, String quotationNumber,
                                           UUID senderId, String senderName, Map<String, Object> metadata) {
        if (companyId == null || quotationId == null) {
            log.warn("Skipping CRM chat event: companyId or quotationId is null");
            return;
        }

        try {
            ChatEventPayload payload = ChatEventPayload.builder()
                    .companyId(companyId)
                    .eventType("QUOTATION_REQUESTED")
                    .channelName("Quotations & Sales")
                    .referenceId(quotationId)
                    .senderId(senderId)
                    .senderName(senderName != null ? senderName : "CRM System")
                    .content("Quotation requested: " + (quotationNumber != null ? quotationNumber : quotationId.toString()))
                    .metadata(metadata)
                    .build();

            String targetUrl = communicationServiceUrl + "/api/communication/v1/chat/events";
            log.info("Sending quotation requested event to chat service: {} | quote={}", targetUrl, quotationNumber);

            restClient.post()
                    .uri(targetUrl)
                    .header("X-Company-Id", companyId.toString())
                    .header("X-Service-Token", serviceToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully published quotation chat event for {}", quotationNumber);
        } catch (Exception ex) {
            log.warn("Failed to publish quotation chat event to communication-service (non-blocking fallback): {}", ex.getMessage());
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatEventPayload {
        private UUID companyId;
        private String eventType;
        private String channelName;
        private UUID referenceId;
        private UUID senderId;
        private String senderName;
        private String content;
        private Map<String, Object> metadata;
    }
}
