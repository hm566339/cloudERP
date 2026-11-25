package com.erp.communication.channel.whatsapp;

import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.entity.CompanyWhatsAppConfig;
import com.erp.communication.model.CommunicationResult;
import com.erp.communication.repository.CompanyWhatsAppConfigRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Production-ready HTTP WhatsApp Provider for Meta WhatsApp Cloud API.
 * Supports:
 * 1. Multi-tenant WABA credentials per company_id with fallback to WhatsAppProperties.
 * 2. Meta Cloud API message types: "template", "document" (PDF/media), and "text".
 * 3. Extraction of Meta provider message IDs (wamid...) and accurate duration tracking.
 */
@Component("httpWhatsAppProvider")
@ConditionalOnProperty(name = "app.whatsapp.provider", havingValue = "real")
@Slf4j
public class HttpWhatsAppProvider implements WhatsAppProvider {

    private final WhatsAppProperties properties;
    private final CompanyWhatsAppConfigRepository configRepository;

    @Autowired
    public HttpWhatsAppProvider(WhatsAppProperties properties,
                                @Autowired(required = false) CompanyWhatsAppConfigRepository configRepository) {
        this.properties = properties;
        this.configRepository = configRepository;
    }

    public HttpWhatsAppProvider(WhatsAppProperties properties) {
        this(properties, null);
    }

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

        if (message.getRecipientPhone() == null || message.getRecipientPhone().isBlank()) {
            return CommunicationResult.failure(getProviderName(), "Recipient phone number is required", false, 1L);
        }

        // 1. Resolve Multi-tenant WABA Credentials (per company_id with global fallback)
        WabaCredentials credentials = resolveCredentials(message.getCompanyId());
        if (!credentials.isValid()) {
            String errorMsg = "WhatsApp provider is configured for real delivery ('real'), but 'app.whatsapp.api-url' or 'app.whatsapp.api-token' is missing";
            log.error("WhatsApp configuration failure | notificationId={} | companyId={} | error={}",
                    message.getNotificationId(), message.getCompanyId(), errorMsg);
            return CommunicationResult.failure(getProviderName(), errorMsg, false, 0L);
        }

        try {
            SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
            requestFactory.setConnectTimeout(properties.getConnectionTimeoutMs());
            requestFactory.setReadTimeout(properties.getReadTimeoutMs());
            RestTemplate restTemplate = new RestTemplate(requestFactory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(credentials.accessToken.trim());

            // 2. Build Meta WhatsApp Cloud API Payload
            Map<String, Object> requestBody = buildMetaPayload(message);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Dispatching Meta WhatsApp Cloud API message | notificationId={} | companyId={} | to={} | type={} | endpoint={}",
                    message.getNotificationId(), message.getCompanyId(), maskedPhone, requestBody.get("type"), credentials.apiUrl);

            ResponseEntity<Map> response = restTemplate.postForEntity(credentials.apiUrl.trim(), entity, Map.class);
            long duration = System.currentTimeMillis() - start;

            if (response.getStatusCode().is2xxSuccessful()) {
                String messageId = extractProviderMessageId(response.getBody(), message.getNotificationId());
                log.info("WhatsApp delivery accepted by Meta Cloud API | notificationId={} | providerMessageId={} | durationMs={}",
                        message.getNotificationId(), messageId, duration);
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

    private WabaCredentials resolveCredentials(UUID companyId) {
        if (companyId != null && configRepository != null) {
            Optional<CompanyWhatsAppConfig> configOpt = configRepository.findByCompanyIdAndIsActiveTrue(companyId);
            if (configOpt.isPresent()) {
                CompanyWhatsAppConfig cfg = configOpt.get();
                String apiUrl = cfg.getApiUrl();
                if (apiUrl == null || apiUrl.isBlank()) {
                    apiUrl = "https://graph.facebook.com/v21.0/" + cfg.getPhoneNumberId() + "/messages";
                }
                return new WabaCredentials(apiUrl, cfg.getAccessToken(), cfg.getPhoneNumberId(), true);
            }
        }

        // Fallback to global properties
        String apiUrl = properties.getApiUrl();
        if ((apiUrl == null || apiUrl.isBlank()) && properties.getPhoneNumberId() != null && !properties.getPhoneNumberId().isBlank()) {
            apiUrl = "https://graph.facebook.com/v21.0/" + properties.getPhoneNumberId() + "/messages";
        }
        return new WabaCredentials(apiUrl, properties.getApiToken(), properties.getPhoneNumberId(), false);
    }

    private Map<String, Object> buildMetaPayload(WhatsAppMessage message) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("messaging_product", "whatsapp");
        payload.put("recipient_type", "individual");

        String formattedPhone = message.getRecipientPhone().trim().replaceAll("[^0-9+]", "");
        if (formattedPhone.startsWith("+")) {
            formattedPhone = formattedPhone.substring(1);
        }
        payload.put("to", formattedPhone);

        Map<String, Object> data = message.getTemplateData() != null ? message.getTemplateData() : Collections.emptyMap();
        String messageType = resolveMessageType(message, data);
        payload.put("type", messageType);

        switch (messageType) {
            case "template":
                payload.put("template", buildTemplateObject(message, data));
                break;
            case "document":
                payload.put("document", buildDocumentObject(message, data));
                break;
            case "text":
            default:
                payload.put("text", buildTextObject(message, data));
                break;
        }

        return payload;
    }

    private String resolveMessageType(WhatsAppMessage message, Map<String, Object> data) {
        if (message.getType() != null && !message.getType().isBlank()) {
            return message.getType().trim().toLowerCase(Locale.ROOT);
        }
        if (data.containsKey("type")) {
            return String.valueOf(data.get("type")).trim().toLowerCase(Locale.ROOT);
        }
        // Document / PDF detection
        if (message.getDocumentUrl() != null || message.getDocumentId() != null
                || data.containsKey("documentUrl") || data.containsKey("pdfUrl") || data.containsKey("link")) {
            return "document";
        }
        // Template detection
        if (message.getTemplateName() != null
                || (message.getTemplateCode() != null && !message.getTemplateCode().isBlank() && !"WHATSAPP_MESSAGE".equalsIgnoreCase(message.getTemplateCode()))
                || data.containsKey("templateName") || data.containsKey("template")) {
            return "template";
        }
        return "text";
    }

    private Map<String, Object> buildTemplateObject(WhatsAppMessage message, Map<String, Object> data) {
        Map<String, Object> templateMap = new HashMap<>();

        String templateName = message.getTemplateName();
        if (templateName == null || templateName.isBlank()) {
            if (data.containsKey("templateName")) {
                templateName = String.valueOf(data.get("templateName"));
            } else if (data.containsKey("template")) {
                templateName = String.valueOf(data.get("template"));
            } else if (message.getTemplateCode() != null && !message.getTemplateCode().isBlank() && !"WHATSAPP_MESSAGE".equalsIgnoreCase(message.getTemplateCode())) {
                templateName = message.getTemplateCode();
            } else {
                templateName = "default_notification";
            }
        }
        templateMap.put("name", templateName);

        String langCode = message.getLanguageCode();
        if (langCode == null || langCode.isBlank()) {
            if (data.containsKey("language")) {
                langCode = String.valueOf(data.get("language"));
            } else if (data.containsKey("languageCode")) {
                langCode = String.valueOf(data.get("languageCode"));
            } else {
                langCode = "en";
            }
        }
        templateMap.put("language", Map.of("code", langCode));

        // Components & Parameters
        List<Map<String, Object>> components = message.getComponents();
        if (components == null && data.containsKey("components") && data.get("components") instanceof List) {
            components = (List<Map<String, Object>>) data.get("components");
        }

        if (components == null && data.containsKey("parameters") && data.get("parameters") instanceof List) {
            List<?> params = (List<?>) data.get("parameters");
            List<Map<String, Object>> paramObjs = new ArrayList<>();
            for (Object p : params) {
                if (p instanceof Map) {
                    paramObjs.add((Map<String, Object>) p);
                } else {
                    paramObjs.add(Map.of("type", "text", "text", String.valueOf(p)));
                }
            }
            components = List.of(Map.of("type", "body", "parameters", paramObjs));
        }

        if (components != null && !components.isEmpty()) {
            templateMap.put("components", components);
        }

        return templateMap;
    }

    private Map<String, Object> buildDocumentObject(WhatsAppMessage message, Map<String, Object> data) {
        Map<String, Object> docMap = new HashMap<>();

        String docUrl = message.getDocumentUrl();
        if (docUrl == null || docUrl.isBlank()) {
            if (data.containsKey("documentUrl")) docUrl = String.valueOf(data.get("documentUrl"));
            else if (data.containsKey("link")) docUrl = String.valueOf(data.get("link"));
            else if (data.containsKey("pdfUrl")) docUrl = String.valueOf(data.get("pdfUrl"));
            else if (data.containsKey("url")) docUrl = String.valueOf(data.get("url"));
        }

        String docId = message.getDocumentId();
        if (docId == null || docId.isBlank()) {
            if (data.containsKey("documentId")) docId = String.valueOf(data.get("documentId"));
            else if (data.containsKey("id")) docId = String.valueOf(data.get("id"));
        }

        if (docId != null && !docId.isBlank()) {
            docMap.put("id", docId.trim());
        } else if (docUrl != null && !docUrl.isBlank()) {
            docMap.put("link", docUrl.trim());
        }

        String filename = message.getDocumentFilename();
        if (filename == null || filename.isBlank()) {
            if (data.containsKey("filename")) filename = String.valueOf(data.get("filename"));
            else if (data.containsKey("documentFilename")) filename = String.valueOf(data.get("documentFilename"));
            else filename = "document.pdf";
        }
        docMap.put("filename", filename);

        String caption = message.getDocumentCaption();
        if (caption == null || caption.isBlank()) {
            if (data.containsKey("caption")) caption = String.valueOf(data.get("caption"));
            else if (message.getMessageText() != null && !message.getMessageText().isBlank()) caption = message.getMessageText();
        }
        if (caption != null && !caption.isBlank()) {
            docMap.put("caption", caption.trim());
        }

        return docMap;
    }

    private Map<String, Object> buildTextObject(WhatsAppMessage message, Map<String, Object> data) {
        String body = message.getMessageText();
        if (body == null || body.isBlank()) {
            if (data.containsKey("messageText")) body = String.valueOf(data.get("messageText"));
            else if (data.containsKey("body")) body = String.valueOf(data.get("body"));
            else body = "Notification from Mark2 ERP";
        }
        return Map.of("body", body);
    }

    private String extractProviderMessageId(Map responseBody, UUID notificationId) {
        if (responseBody != null && responseBody.containsKey("messages")) {
            Object msgs = responseBody.get("messages");
            if (msgs instanceof List && !((List<?>) msgs).isEmpty()) {
                Object first = ((List<?>) msgs).get(0);
                if (first instanceof Map && ((Map<?, ?>) first).containsKey("id")) {
                    return String.valueOf(((Map<?, ?>) first).get("id"));
                }
                return String.valueOf(first);
            }
        }
        return "wamid.outbound." + notificationId;
    }

    private String sanitize(String input) {
        if (input == null) return "";
        return input.replaceAll("(?i)(token|key|secret)=[^\\s,]+", "$1=***");
    }

    private static class WabaCredentials {
        final String apiUrl;
        final String accessToken;
        final String phoneNumberId;
        final boolean isCompanyConfig;

        WabaCredentials(String apiUrl, String accessToken, String phoneNumberId, boolean isCompanyConfig) {
            this.apiUrl = apiUrl;
            this.accessToken = accessToken;
            this.phoneNumberId = phoneNumberId;
            this.isCompanyConfig = isCompanyConfig;
        }

        boolean isValid() {
            return apiUrl != null && !apiUrl.isBlank() && accessToken != null && !accessToken.isBlank();
        }
    }
}
