package com.erp.account.integration.communication;

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
public class AccountChatEventClient {

    private final RestClient restClient;

    @Value("${services.communication.url:${COMMUNICATION_SERVICE_URL:http://localhost:8084}}")
    private String communicationServiceUrl;

    @Value("${app.service-auth.internal-token:${COMM_SERVICE_TOKEN:mark2-internal-comm-secret-token}}")
    private String serviceToken;

    public AccountChatEventClient() {
        this.restClient = RestClient.builder().build();
    }

    @Autowired
    public AccountChatEventClient(@Autowired(required = false) RestClient restClient) {
        this.restClient = restClient != null ? restClient : RestClient.builder().build();
    }

    public void setCommunicationServiceUrl(String communicationServiceUrl) {
        this.communicationServiceUrl = communicationServiceUrl;
    }

    public void setServiceToken(String serviceToken) {
        this.serviceToken = serviceToken;
    }

    /**
     * Publishes a quotation ready / approved event to the internal company chat channel.
     * Guaranteed non-blocking/fail-safe: catches all exceptions so the account transaction never fails.
     */
    public void sendQuotationReadyEvent(UUID companyId, UUID quotationId, String quotationNumber,
                                        String senderName, Map<String, Object> metadata) {
        if (companyId == null || quotationId == null) {
            log.warn("Skipping Accounts chat event: companyId or quotationId is null");
            return;
        }

        try {
            ChatEventPayload payload = ChatEventPayload.builder()
                    .companyId(companyId)
                    .eventType("QUOTATION_READY")
                    .channelName("Quotations & Sales")
                    .referenceId(quotationId)
                    .senderName(senderName != null ? senderName : "Accounts Team")
                    .content("Quotation " + (quotationNumber != null ? quotationNumber : quotationId.toString()) + " is approved and ready.")
                    .metadata(metadata)
                    .build();

            String targetUrl = communicationServiceUrl + "/api/communication/v1/chat/events";
            log.info("Sending quotation ready event to chat service: {} | quote={}", targetUrl, quotationNumber);

            restClient.post()
                    .uri(targetUrl)
                    .header("X-Company-Id", companyId.toString())
                    .header("X-Service-Token", serviceToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("Successfully published quotation ready chat event for {}", quotationNumber);
        } catch (Exception ex) {
            log.warn("Failed to publish quotation ready chat event to communication-service (non-blocking fallback): {}", ex.getMessage());
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
