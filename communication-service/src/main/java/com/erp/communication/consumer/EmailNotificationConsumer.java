package com.erp.communication.consumer;

import com.erp.communication.channel.email.SmtpEmailProvider;
import com.erp.communication.dto.request.SendEmailRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.event.EmailNotificationEvent;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.service.CommunicationDispatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * RabbitMQ consumer for email notification queue.
 * Implements database-backed idempotency, bounded retries, and dead-letter routing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationConsumer {

    private final CommunicationDispatchService dispatchService;
    private final NotificationRequestRepository requestRepository;

    @RabbitListener(
            queues = "${app.rabbitmq.email-queue:erp.notification.email.queue}",
            containerFactory = "rabbitListenerContainerFactory"
    )
    public void processEmailNotification(EmailNotificationEvent event) {
        if (event == null) {
            log.error("Received null EmailNotificationEvent from queue");
            throw new AmqpRejectAndDontRequeueException("EmailNotificationEvent is null");
        }

        String maskedRecipient = SmtpEmailProvider.maskEmail(event.getRecipient());
        log.info("AMQP: Consuming email notification | recipient={} | companyId={} | idempotencyKey={}",
                maskedRecipient, event.getCompanyId(), event.getIdempotencyKey());

        // 1. Mandatory Schema Validation
        if (event.getCompanyId() == null) {
            log.error("Rejecting unprocessable email message: missing companyId");
            throw new AmqpRejectAndDontRequeueException("Missing companyId in EmailNotificationEvent");
        }
        if (event.getRecipient() == null || event.getRecipient().isBlank()) {
            log.error("Rejecting unprocessable email message: missing recipient address");
            throw new AmqpRejectAndDontRequeueException("Missing recipient in EmailNotificationEvent");
        }

        // 2. Database-backed Idempotency Check
        if (event.getIdempotencyKey() != null && !event.getIdempotencyKey().isBlank()) {
            Optional<NotificationRequest> existing = requestRepository.findByCompanyIdAndIdempotencyKey(
                    event.getCompanyId(), event.getIdempotencyKey().trim());

            if (existing.isPresent()) {
                NotificationRequest nr = existing.get();
                if (nr.getStatus() == NotificationStatus.ACCEPTED_BY_PROVIDER) {
                    log.info("AMQP: Idempotent duplicate event detected | notificationId={} | key={}. Skipping delivery.",
                            nr.getId(), nr.getIdempotencyKey());
                    return; // ACK message without re-invoking external SMTP provider
                }
            }
        }

        // 3. Dispatch Email via Centralized Service
        SendEmailRequest request = SendEmailRequest.builder()
                .companyId(event.getCompanyId())
                .recipient(event.getRecipient().trim())
                .subject(event.getSubject())
                .templateCode(event.getTemplateCode())
                .templateData(event.getTemplateData())
                .htmlContent(event.getHtmlContent())
                .plainTextContent(event.getPlainTextContent())
                .idempotencyKey(event.getIdempotencyKey())
                .attachments(event.getAttachments())
                .async(false) // Execute synchronously in consumer thread for AMQP delivery guarantees
                .build();

        CommunicationResponse response;
        try {
            response = dispatchService.dispatchEmail(request);
        } catch (Exception ex) {
            log.error("Unhandled exception during email dispatch | recipient={} | error={}",
                    maskedRecipient, ex.getMessage(), ex);
            throw new RuntimeException("Transient error dispatching email: " + ex.getMessage(), ex);
        }

        // 4. Outcome Classification (Permanent failure vs Transient error vs Success)
        if (response.getStatus() == NotificationStatus.ACCEPTED_BY_PROVIDER) {
            log.info("AMQP: Email delivery accepted by provider | notificationId={}", response.getNotificationId());
        } else if (response.getStatus() == NotificationStatus.FAILED) {
            log.warn("AMQP: Permanent failure for email | notificationId={} | message={}",
                    response.getNotificationId(), response.getMessage());
            // Fatal permanent error: Reject and send directly to DLQ without requeuing
            throw new AmqpRejectAndDontRequeueException("Permanent email dispatch error: " + response.getMessage());
        } else if (response.getStatus() == NotificationStatus.PENDING) {
            log.warn("AMQP: Transient error for email | notificationId={} | scheduling backoff",
                    response.getNotificationId());
            // Retryable error: Throw exception so Spring AMQP retry interceptor applies backoff
            throw new RuntimeException("Transient email dispatch error: " + response.getMessage());
        }
    }
}
