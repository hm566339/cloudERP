package com.erp.communication.channel.whatsapp;

import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.model.CommunicationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Production-ready HTTP WhatsApp Provider.
 * Connects to external WhatsApp Business / Meta Graph API or compatible HTTP gateway.
 * Fails safely if required credentials are not configured.
 */
@Component("httpWhatsAppProvider")
@ConditionalOnProperty(name = "app.whatsapp.provider", havingValue = "real")
@RequiredArgsConstructor
@Slf4j
public class HttpWhatsAppProvider implements WhatsAppProvider {

    private final WhatsAppProperties properties;

    @Override
    public String getProviderName() {
        return "HTTP_WHATSAPP";
    }

    @Override
    public boolean isEnabled() {
        return properties.isEnabled();
    }

    @Override
    public CommunicationResult sendWhatsApp(WhatsAppMessage message) {
        long start = System.currentTimeMillis();
        String maskedPhone = MockWhatsAppProvider.maskPhoneNumber(message.getRecipientPhone());

        if (!properties.isEnabled()) {
            return CommunicationResult.failure(getProviderName(), "WhatsApp channel is disabled in configuration", false, 1L);
        }

        // Fail safely if credentials are not configured in production
        if (properties.getApiUrl() == null || properties.getApiUrl().isBlank()
                || properties.getApiToken() == null || properties.getApiToken().isBlank()) {
            String errorMsg = "WhatsApp provider is configured for real delivery ('real'), but 'app.whatsapp.api-url' or 'app.whatsapp.api-token' is missing";
            log.error("WhatsApp configuration failure | notificationId={} | error={}", message.getNotificationId(), errorMsg);
            return CommunicationResult.failure(getProviderName(), errorMsg, false, 0L);
        }

        if (message.getRecipientPhone() == null || message.getRecipientPhone().isBlank()) {
            return CommunicationResult.failure(getProviderName(), "Recipient phone number is required", false, 1L);
        }

        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(properties.getConnectionTimeoutMs());
            requestFactory.setReadTimeout(properties.getReadTimeoutMs());
            RestTemplate restTemplate = new RestTemplate(requestFactory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(properties.getApiToken().trim());

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("recipient_type", "individual");
            requestBody.put("to", message.getRecipientPhone().trim().replaceAll("[^0-9+]", ""));
            requestBody.put("type", "text");
            requestBody.put("text", Map.of("body", message.getMessageText() != null ? message.getMessageText() : ""));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Dispatching WhatsApp message to provider API | notificationId={} | to={}",
                    message.getNotificationId(), maskedPhone);

            ResponseEntity<Map> response = restTemplate.postForEntity(properties.getApiUrl().trim(), entity, Map.class);
            long duration = System.currentTimeMillis() - start;

            if (response.getStatusCode().is2xxSuccessful()) {
                String messageId = "wa-" + message.getNotificationId();
                if (response.getBody() != null && response.getBody().containsKey("messages")) {
                    Object msgs = response.getBody().get("messages");
                    messageId = String.valueOf(msgs);
                }
                log.info("WhatsApp delivery accepted by provider | notificationId={} | durationMs={}",
                        message.getNotificationId(), duration);
                return CommunicationResult.success(getProviderName(), messageId, duration);
            } else {
                return CommunicationResult.failure(getProviderName(),
                        "Provider returned status: " + response.getStatusCode(),
                        response.getStatusCode().is5xxServerError(),
                        duration);
            }

        } catch (HttpStatusCodeException ex) {
            long duration = System.currentTimeMillis() - start;
            boolean retryable = ex.getStatusCode().is5xxServerError() || ex.getStatusCode().value() == 429;
            String errorMsg = "HTTP " + ex.getStatusCode().value() + ": " + sanitize(ex.getResponseBodyAsString());
            log.error("WhatsApp provider HTTP error | notificationId={} | retryable={} | error={}",
                    message.getNotificationId(), retryable, errorMsg);
            return CommunicationResult.failure(getProviderName(), errorMsg, retryable, duration);

        } catch (ResourceAccessException ex) {
            long duration = System.currentTimeMillis() - start;
            log.error("WhatsApp provider timeout / network error | notificationId={} | error={}",
                    message.getNotificationId(), ex.getMessage());
            return CommunicationResult.failure(getProviderName(), "Connection error: " + ex.getMessage(), true, duration);

        } catch (Exception ex) {
            long duration = System.currentTimeMillis() - start;
            log.error("Unexpected WhatsApp dispatch error | notificationId={} | error={}",
                    message.getNotificationId(), ex.getMessage());
            return CommunicationResult.failure(getProviderName(), "Unexpected error: " + ex.getMessage(), false, duration);
        }
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("(?i)(token|key|secret)=[^\\s,]+", "$1=***");
    }
}
