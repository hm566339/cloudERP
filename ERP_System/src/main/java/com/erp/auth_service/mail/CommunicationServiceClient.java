package com.erp.auth_service.mail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST Client for dispatching notifications to the centralized Communication Service.
 * Implements graceful fallback and staged rollout flags.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CommunicationServiceClient {

    private final RestTemplate restTemplate;

    @Value("${communication.service.url:http://communication-service:8084}")
    private String communicationServiceUrl;

    @Value("${communication.service.enabled:true}")
    private boolean serviceEnabled;

    @Value("${communication.service.token:${COMM_SERVICE_TOKEN:mark2-internal-comm-secret-token}}")
    private String serviceToken;

    public boolean isEnabled() {
        return serviceEnabled;
    }

    /**
     * Dispatches employee provisioning email through the centralized Communication Service.
     *
     * @return true if accepted by Communication Service, false if service is disabled or failed.
     */
    public boolean sendEmployeeProvisioningEmail(
            UUID companyId,
            String to,
            String fullName,
            String companyName,
            String username,
            String passwordSetupLink,
            String companyLoginUrl,
            int validityHours,
            String idempotencyKey) {

        if (!serviceEnabled) {
            log.debug("CommunicationServiceClient is disabled via configuration, skipping remote dispatch");
            return false;
        }

        String targetUrl = communicationServiceUrl.replaceAll("/$", "") + "/api/communication/v1/messages/email";

        try {
            Map<String, Object> templateData = new HashMap<>();
            templateData.put("fullName", fullName);
            templateData.put("companyName", companyName);
            templateData.put("username", username);
            templateData.put("setupUrl", passwordSetupLink);
            templateData.put("companyLoginUrl", companyLoginUrl);
            templateData.put("validityHours", validityHours);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("companyId", companyId);
            requestBody.put("templateCode", "EMPLOYEE_PROVISIONING");
            requestBody.put("recipient", to);
            requestBody.put("idempotencyKey", idempotencyKey);
            requestBody.put("templateData", templateData);
            requestBody.put("async", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Token", serviceToken);
            headers.set("X-Company-Id", companyId != null ? companyId.toString() : "");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Employee provisioning email dispatched via Communication Service | to={} | companyId={}",
                        EmailService.maskEmail(to), companyId);
                return true;
            }
            log.warn("Communication Service returned non-2xx status: {}", response.getStatusCode());
            return false;

        } catch (Exception ex) {
            log.error("Failed to reach Communication Service at {} | error: {}. Will allow local fallback.",
                    targetUrl, ex.getMessage());
            return false;
        }
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DeliveryResult {
        private boolean success;
        private String status;
        private String message;
        private String providerMessageId;
        private String error;
    }

    /**
     * Dispatches organization user invitation email through the centralized Communication Service.
     *
     * @return true if accepted by Communication Service and submitted to SMTP provider, false otherwise.
     */
    public boolean sendOrganizationUserInvitationEmail(
            UUID organizationId,
            UUID companyId,
            String to,
            String fullName,
            String organizationName,
            String username,
            String activationLink,
            int validityHours,
            String idempotencyKey) {
        DeliveryResult result = sendOrganizationUserInvitationEmailDetailed(
                organizationId, companyId, to, fullName, organizationName, username, activationLink, validityHours, idempotencyKey);
        return result.isSuccess();
    }

    /**
     * Dispatches organization user invitation email through the centralized Communication Service
     * and returns the full DeliveryResult with provider message ID and actual SMTP status.
     */
    public DeliveryResult sendOrganizationUserInvitationEmailDetailed(
            UUID organizationId,
            UUID companyId,
            String to,
            String fullName,
            String organizationName,
            String username,
            String activationLink,
            int validityHours,
            String idempotencyKey) {

        if (!serviceEnabled) {
            log.debug("CommunicationServiceClient is disabled via configuration, skipping remote dispatch");
            return DeliveryResult.builder()
                    .success(false)
                    .status("DISABLED")
                    .error("Communication Service client is disabled via configuration")
                    .build();
        }

        String targetUrl = communicationServiceUrl.replaceAll("/$", "") + "/api/communication/v1/messages/email";

        try {
            Map<String, Object> templateData = new HashMap<>();
            templateData.put("fullName", fullName);
            templateData.put("organizationName", organizationName);
            templateData.put("companyName", organizationName);
            templateData.put("username", username);
            templateData.put("email", to);
            templateData.put("recipient", to);
            templateData.put("activationLink", activationLink);
            templateData.put("setupUrl", activationLink);
            templateData.put("validityHours", validityHours);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("companyId", companyId);
            requestBody.put("templateCode", "USER_INVITATION");
            requestBody.put("recipient", to);
            requestBody.put("idempotencyKey", idempotencyKey);
            requestBody.put("templateData", templateData);
            requestBody.put("async", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Service-Token", serviceToken);
            if (organizationId != null) {
                headers.set("X-Organization-Id", organizationId.toString());
            }
            if (companyId != null) {
                headers.set("X-Company-Id", companyId.toString());
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                Object statusObj = body.get("status");
                String statusStr = statusObj != null ? statusObj.toString() : "";
                String respMsg = body.get("message") != null ? body.get("message").toString() : "";
                String providerMsgId = body.get("providerMessageId") != null ? body.get("providerMessageId").toString() : null;

                if ("ACCEPTED_BY_PROVIDER".equalsIgnoreCase(statusStr)) {
                    log.info("Organization user invitation email accepted by mail provider | to={} | providerMessageId={}",
                            EmailService.maskEmail(to), providerMsgId);
                    return DeliveryResult.builder()
                            .success(true)
                            .status(statusStr)
                            .message(respMsg)
                            .providerMessageId(providerMsgId)
                            .build();
                } else {
                    log.warn("Communication Service returned non-accepted status '{}': {}", statusStr, respMsg);
                    return DeliveryResult.builder()
                            .success(false)
                            .status(statusStr)
                            .message(respMsg)
                            .error(respMsg != null && !respMsg.isBlank() ? respMsg : "Mail delivery status: " + statusStr)
                            .build();
                }
            }

            log.warn("Communication Service returned non-2xx status: {}", response.getStatusCode());
            return DeliveryResult.builder()
                    .success(false)
                    .status("HTTP_" + response.getStatusCode().value())
                    .error("Communication Service returned HTTP " + response.getStatusCode().value())
                    .build();

        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String respBody = ex.getResponseBodyAsString();
            log.error("Communication Service HTTP error {} at {} | response: {}",
                    ex.getStatusCode(), targetUrl, respBody);
            return DeliveryResult.builder()
                    .success(false)
                    .status("HTTP_" + ex.getStatusCode().value())
                    .error("Communication Service HTTP " + ex.getStatusCode().value() + ": " + respBody)
                    .build();
        } catch (Exception ex) {
            log.error("Failed to reach Communication Service at {} | error: {}",
                    targetUrl, ex.getMessage());
            return DeliveryResult.builder()
                    .success(false)
                    .status("NETWORK_ERROR")
                    .error("Network error reaching Communication Service: " + ex.getMessage())
                    .build();
        }
    }
}
