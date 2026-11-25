package com.erp.communication.service;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.template.RenderedEmail;
import com.erp.communication.template.TemplateCode;
import com.erp.communication.template.TemplateEngineService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@Slf4j
public class OutboxRetryWorker {

    private final NotificationRequestRepository requestRepository;
    private final CommunicationDispatchService dispatchService;
    private final TemplateEngineService templateEngineService;
    private final ObjectMapper objectMapper;

    @Value("${app.outbox.enabled:true}")
    private boolean outboxEnabled = true;

    @Value("${app.outbox.batch-size:20}")
    private int batchSize = 20;

    @Autowired
    public OutboxRetryWorker(NotificationRequestRepository requestRepository,
                             CommunicationDispatchService dispatchService,
                             TemplateEngineService templateEngineService,
                             @Autowired(required = false) ObjectMapper objectMapper) {
        this.requestRepository = requestRepository;
        this.dispatchService = dispatchService;
        this.templateEngineService = templateEngineService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    public void setOutboxEnabled(boolean outboxEnabled) {
        this.outboxEnabled = outboxEnabled;
    }

    public void setBatchSize(int batchSize) {
        this.batchSize = batchSize;
    }

    @Scheduled(fixedDelayString = "${app.outbox.poll-interval-ms:10000}")
    public void processPendingNotifications() {
        if (!outboxEnabled) {
            return;
        }

        try {
            List<NotificationRequest> pending = requestRepository.findPendingRetries(
                    NotificationStatus.PENDING,
                    LocalDateTime.now(),
                    PageRequest.of(0, Math.min(batchSize, 50))
            );

            if (pending.isEmpty()) {
                return;
            }

            log.info("Outbox worker picked up {} pending notification(s) for delivery retry", pending.size());

            for (NotificationRequest request : pending) {
                processSingleNotification(request);
            }
        } catch (Exception ex) {
            log.error("Error in OutboxRetryWorker poll loop: {}", ex.getMessage(), ex);
        }
    }

    void processSingleNotification(NotificationRequest request) {
        if (request == null) {
            return;
        }

        log.info("Processing outbox delivery for notificationId={} | channel={} | attempt={}",
                request.getId(), request.getChannel(), request.getRetryCount() + 1);

        try {
            CommunicationChannel channel = request.getChannel();
            if (channel == CommunicationChannel.EMAIL) {
                processEmailRetry(request);
            } else if (channel == CommunicationChannel.WHATSAPP) {
                processWhatsAppRetry(request);
            } else {
                handleUnsupportedChannel(request);
            }
        } catch (Exception ex) {
            log.error("Failed to process retry for notificationId={} on channel {}: {}",
                    request.getId(), request.getChannel(), ex.getMessage(), ex);
        }
    }

    private void processEmailRetry(NotificationRequest request) {
        RenderedEmail rendered;
        try {
            Map<String, Object> templateData = extractTemplateData(request.getPayloadJson());
            if (!templateData.containsKey("email") && request.getRecipient() != null) {
                templateData.put("email", request.getRecipient().trim());
            }
            if (!templateData.containsKey("recipient") && request.getRecipient() != null) {
                templateData.put("recipient", request.getRecipient().trim());
            }

            TemplateCode templateCode = TemplateCode.valueOf(request.getEventCode().toUpperCase(Locale.ROOT));
            rendered = templateEngineService.render(templateCode, request.getSubject(), templateData);
        } catch (Exception e) {
            rendered = RenderedEmail.builder()
                    .subject(request.getSubject() != null ? request.getSubject() : "Mark2 Notification")
                    .htmlContent("<p>Notification: " + (request.getSubject() != null ? request.getSubject() : "") + "</p>")
                    .plainTextContent(request.getSubject() != null ? request.getSubject() : "Notification")
                    .build();
        }

        dispatchService.executeEmailDelivery(request.getId(), rendered, Collections.emptyList());
    }

    private void processWhatsAppRetry(NotificationRequest request) {
        Map<String, Object> templateData = extractTemplateData(request.getPayloadJson());
        String messageText = null;

        if (templateData.containsKey("messageText")) {
            messageText = String.valueOf(templateData.get("messageText"));
        } else if (templateData.containsKey("message")) {
            messageText = String.valueOf(templateData.get("message"));
        } else if (templateData.containsKey("body")) {
            messageText = String.valueOf(templateData.get("body"));
        }

        if (messageText == null || messageText.isBlank()) {
            if (request.getSubject() != null && !request.getSubject().isBlank()) {
                messageText = request.getSubject().trim();
            } else {
                messageText = "Notification from Mark2 ERP";
            }
        }

        dispatchService.executeWhatsAppDelivery(request.getId(), messageText, templateData);
    }

    private void handleUnsupportedChannel(NotificationRequest request) {
        String channelName = request.getChannel() != null ? request.getChannel().name() : "null";
        log.warn("Notification request id={} has unsupported channel: {}. Marking permanently as FAILED.",
                request.getId(), channelName);

        request.setStatus(NotificationStatus.FAILED);
        request.setErrorSummary("Unsupported communication channel: " + channelName);
        request.setNextRetryAt(null);
        requestRepository.save(request);
    }

    private Map<String, Object> extractTemplateData(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank()) {
            return new HashMap<>();
        }
        try {
            Map<String, Object> data = objectMapper.readValue(payloadJson, new TypeReference<Map<String, Object>>() {});
            return data != null ? new HashMap<>(data) : new HashMap<>();
        } catch (Exception e) {
            log.debug("Could not parse payloadJson with Jackson: {}", e.getMessage());
        }

        // Fallback for Map.toString() representation: {key=val, key2=val2}
        Map<String, Object> fallback = new HashMap<>();
        String trimmed = payloadJson.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
            String[] pairs = trimmed.split(",");
            for (String pair : pairs) {
                int eqIdx = pair.indexOf('=');
                if (eqIdx > 0) {
                    String k = pair.substring(0, eqIdx).trim();
                    String v = pair.substring(eqIdx + 1).trim();
                    fallback.put(k, v);
                }
            }
        }
        return fallback;
    }
}
