package com.erp.auth_service.mail;

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
}
