package com.erp.communication.consumer;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.whatsapp.MockWhatsAppProvider;
import com.erp.communication.dto.request.SendChannelMessageRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.event.WhatsAppNotificationEvent;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.service.CommunicationDispatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * RabbitMQ consumer for WhatsApp notification queue.
 * Implements database-backed idempotency, bounded retries, and dead-letter routing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WhatsAppNotificationConsumer {

    private final CommunicationDispatchService dispatchService;
    private final NotificationRequestRepository requestRepository;

    @RabbitListener(
            queues = "${app.rabbitmq.whatsapp-queue:erp.notification.whatsapp.queue}",
            containerFactory = "rabbitListenerContainerFactory"
    )
    public void processWhatsAppNotification(WhatsAppNotificationEvent event) {
        if (event == null) {
            log.error("Received null WhatsAppNotificationEvent from queue");
            throw new AmqpRejectAndDontRequeueException("WhatsAppNotificationEvent is null");
        }

        String maskedPhone = MockWhatsAppProvider.maskPhoneNumber(event.getRecipientPhone());
        log.info("AMQP: Consuming WhatsApp notification | to={} | companyId={} | idempotencyKey={}",
                maskedPhone, event.getCompanyId(), event.getIdempotencyKey());

        // 1. Mandatory Schema Validation
        if (event.getCompanyId() == null) {
            log.error("Rejecting unprocessable WhatsApp message: missing companyId");
            throw new AmqpRejectAndDontRequeueException("Missing companyId in WhatsAppNotificationEvent");
        }
        if (event.getRecipientPhone() == null || event.getRecipientPhone().isBlank()) {
            log.error("Rejecting unprocessable WhatsApp message: missing recipientPhone");
            throw new AmqpRejectAndDontRequeueException("Missing recipientPhone in WhatsAppNotificationEvent");
        }

        // 2. Database-backed Idempotency Check
        if (event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank()) {
            Optional<NotificationRequest> existing = requestRepository.findByCompanyIdAndIdempotencyKey(
                    event.getCompanyId(), event.getIdempotencyKey().trim());

            if (existing.isPresent()) {
                NotificationRequest nr = existing.get();
                if (nr.getStatus() == NotificationStatus.ACCEPTED_BY_PROVIDER) {
                    log.info("AMQP: Idempotent duplicate WhatsApp event detected | notificationId={} | key={}. Skipping delivery.",
                            nr.getId(), nr.getIdempotencyKey());
                    return; // ACK message without re-invoking WhatsApp provider
                }
            }
        }

        // 3. Prepare Dispatch Request
        Map<String, Object> templateData = event.getTemplateData() != null
                ? new HashMap<>(event.getTemplateData())
                : new HashMap<>();

        if (event.getMessageText() != null && !event.getMessageText().isBlank()) {
            templateData.putIfAbsent("messageText", event.getMessageText().trim());
        }

        SendChannelMessageRequest request = SendChannelMessageRequest.builder()
                .companyId(event.getCompanyId())
                .channel(CommunicationChannel.WHATSAPP)
                .recipient(event.getRecipientPhone().trim())
                .subject(event.getSubject())
                .templateCode(event.getTemplateCode())
                .templateData(templateData)
                .idempotencyKey(event.getIdempotencyKey())
                .async(false) // Execute synchronously in consumer thread for AMQP delivery guarantees
                .build();

        CommunicationResponse response;
        try {
            response = dispatchService.dispatchWhatsApp(request);
        } catch (Exception ex) {
            log.error("Unhandled exception during WhatsApp dispatch | to={} | error={}",
                    maskedPhone, ex.getMessage(), ex);
            throw new RuntimeException("Transient error dispatching WhatsApp: " + ex.getMessage(), ex);
        }

        // 4. Outcome Classification (Permanent failure vs Transient error vs Success)
        if (response.getStatus() == NotificationStatus.ACCEPTED_BY_PROVIDER) {
            log.info("AMQP: WhatsApp delivery accepted by provider | notificationId={}", response.getNotificationId());
        } else if (response.getStatus() == NotificationStatus.FAILED) {
            log.warn("AMQP: Permanent failure for WhatsApp | notificationId={} | message={}",
                    response.getNotificationId(), response.getMessage());
            // Fatal permanent error: Reject and route directly to DLQ without requeuing
            throw new AmqpRejectAndDontRequeueException("Permanent WhatsApp dispatch error: " + response.getMessage());
        } else if (response.getStatus() == NotificationStatus.PENDING) {
            log.warn("AMQP: Transient error for WhatsApp | notificationId={} | scheduling backoff",
                    response.getNotificationId());
            // Retryable error: Throw exception so Spring AMQP retry interceptor applies backoff
            throw new RuntimeException("Transient WhatsApp dispatch error: " + response.getMessage());
        }
    }
}
