package com.erp.communication.service;

import com.erp.communication.channel.whatsapp.MockWhatsAppProvider;
import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.entity.CompanyWhatsAppConfig;
import com.erp.communication.entity.NotificationDelivery;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.DeliveryStatus;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.CompanyWhatsAppConfigRepository;
import com.erp.communication.repository.NotificationDeliveryRepository;
import com.erp.communication.repository.NotificationRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WhatsAppWebhookService {

    private final WhatsAppProperties properties;
    private final CompanyWhatsAppConfigRepository configRepository;
    private final NotificationDeliveryRepository deliveryRepository;
    private final NotificationRequestRepository requestRepository;

    /**
     * Verifies the Meta Webhook handshake (GET challenge).
     * Compares the incoming token with either company-specific WABA verify token or global default.
     */
    public Optional<String> verifyWebhook(String mode, String token, String challenge, UUID companyId) {
        if (!"subscribe".equalsIgnoreCase(mode) || token == null || challenge == null) {
            log.warn("Invalid webhook verification request | mode={} | tokenPresent={}", mode, token != null);
            return Optional.empty();
        }

        // 1. Company-specific verification
        if (companyId != null) {
            Optional<CompanyWhatsAppConfig> cfg = configRepository.findByCompanyIdAndIsActiveTrue(companyId);
            if (cfg.isPresent() && token.equals(cfg.get().getWebhookVerifyToken())) {
                log.info("Meta Webhook verified for companyId={}", companyId);
                return Optional.of(challenge);
            }
        }

        // 2. Global fallback verify token
        if (token.equals(properties.getWebhookVerifyToken())) {
            log.info("Meta Webhook verified via global webhook verify token");
            return Optional.of(challenge);
        }

        // 3. Search any active company config matching this verify token
        Optional<CompanyWhatsAppConfig> matched = configRepository.findByWebhookVerifyTokenAndIsActiveTrue(token);
        if (matched.isPresent()) {
            log.info("Meta Webhook verified for matched companyId={}", matched.get().getCompanyId());
            return Optional.of(challenge);
        }

        log.warn("Meta Webhook verification rejected: verify token mismatch");
        return Optional.empty();
    }

    /**
     * Processes incoming webhook payloads from Meta (status updates and inbound customer messages).
     */
    @Transactional
    public void processWebhookPayload(Map<String, Object> payload) {
        if (payload == null || !payload.containsKey("entry")) {
            log.debug("Ignoring empty or non-entry webhook payload");
            return;
        }

        try {
            List<?> entries = (List<?>) payload.get("entry");
            if (entries == null) return;

            for (Object entryObj : entries) {
                if (!(entryObj instanceof Map<?, ?> entryMap)) continue;
                List<?> changes = (List<?>) entryMap.get("changes");
                if (changes == null) continue;

                for (Object changeObj : changes) {
                    if (!(changeObj instanceof Map<?, ?> changeMap)) continue;
                    Object valueObj = changeMap.get("value");
                    if (!(valueObj instanceof Map<?, ?> valueMap)) continue;

                    // 1. Process Message Status Updates (sent, delivered, read, failed)
                    if (valueMap.containsKey("statuses")) {
                        processStatuses((List<?>) valueMap.get("statuses"));
                    }

                    // 2. Process Inbound Customer Messages
                    if (valueMap.containsKey("messages")) {
                        processInboundMessages((List<?>) valueMap.get("messages"));
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error processing Meta WhatsApp webhook payload: {}", ex.getMessage(), ex);
        }
    }

    private void processStatuses(List<?> statuses) {
        if (statuses == null) return;

        for (Object statusObj : statuses) {
            if (!(statusObj instanceof Map<?, ?> statusMap)) continue;

            String providerMessageId = (String) statusMap.get("id");
            String status = (String) statusMap.get("status");
            String recipientId = (String) statusMap.get("recipient_id");

            if (providerMessageId == null || status == null) continue;

            String maskedPhone = MockWhatsAppProvider.maskPhoneNumber(recipientId);
            log.info("Meta Webhook status callback: providerMessageId={} | status={} | to={}",
                    providerMessageId, status, maskedPhone);

            Optional<NotificationDelivery> deliveryOpt =
                    deliveryRepository.findFirstByProviderMessageIdOrderByAttemptAtDesc(providerMessageId);

            if (deliveryOpt.isPresent()) {
                NotificationDelivery delivery = deliveryOpt.get();
                NotificationRequest request = delivery.getNotificationRequest();

                updateDeliveryAndRequestStatus(delivery, request, status.trim().toLowerCase(Locale.ROOT), statusMap);
            } else {
                log.debug("No existing NotificationDelivery record found for providerMessageId={}", providerMessageId);
            }
        }
    }

    private void updateDeliveryAndRequestStatus(NotificationDelivery delivery, NotificationRequest request,
                                               String metaStatus, Map<?, ?> statusMap) {
        switch (metaStatus) {
            case "sent":
                delivery.setStatus(DeliveryStatus.SENT);
                break;
            case "delivered":
                delivery.setStatus(DeliveryStatus.DELIVERED);
                if (request != null) {
                    request.setStatus(NotificationStatus.DELIVERED);
                }
                break;
            case "read":
                delivery.setStatus(DeliveryStatus.READ);
                if (request != null) {
                    request.setStatus(NotificationStatus.READ);
                }
                break;
            case "failed":
                delivery.setStatus(DeliveryStatus.FAILED);
                String errorSummary = extractErrorDetails(statusMap);
                delivery.setErrorDetails(errorSummary);
                if (request != null) {
                    request.setStatus(NotificationStatus.FAILED);
                    request.setErrorSummary("Meta delivery failed: " + errorSummary);
                }
                break;
            default:
                log.debug("Unhandled Meta webhook status: {}", metaStatus);
                break;
        }

        deliveryRepository.save(delivery);
        if (request != null) {
            requestRepository.save(request);
        }
    }

    private void processInboundMessages(List<?> messages) {
        if (messages == null) return;

        for (Object msgObj : messages) {
            if (!(msgObj instanceof Map<?, ?> msgMap)) continue;

            String from = (String) msgMap.get("from");
            String msgId = (String) msgMap.get("id");
            String type = (String) msgMap.get("type");
            String maskedPhone = MockWhatsAppProvider.maskPhoneNumber(from);

            log.info("Meta Webhook: Inbound customer message received | from={} | id={} | type={}",
                    maskedPhone, msgId, type);
        }
    }

    private String extractErrorDetails(Map<?, ?> statusMap) {
        if (statusMap.containsKey("errors") && statusMap.get("errors") instanceof List<?> errors) {
            if (!errors.isEmpty() && errors.get(0) instanceof Map<?, ?> err) {
                return String.format("code=%s, title=%s, details=%s",
                        err.get("code"), err.get("title"), err.get("error_data"));
            }
        }
        return "Unknown error reported by Meta Graph API";
    }
}
