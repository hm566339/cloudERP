package com.erp.communication.producer;

import com.erp.communication.config.RabbitMqProperties;
import com.erp.communication.event.EmailNotificationEvent;
import com.erp.communication.event.WhatsAppNotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Reliable RabbitMQ message producer with Publisher Confirms, persistent delivery mode,
 * and correlation tracking.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationMessageProducer {

    private final RabbitTemplate rabbitTemplate;
    private final RabbitMqProperties properties;

    /**
     * Publishes an email notification event to RabbitMQ with persistent delivery mode and publisher confirms.
     *
     * @param event Email event to publish
     * @return true if broker confirmed receipt (or if published in async mode), false if rejected or failed.
     */
    public boolean sendEmailNotification(EmailNotificationEvent event) {
        if (event == null) {
            log.error("Cannot publish null EmailNotificationEvent");
            return false;
        }

        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID());
        }

        CorrelationData correlationData = new CorrelationData(event.getEventId().toString());

        try {
            log.info("AMQP Producer: Publishing email event | eventId={} | companyId={} | recipient={}",
                    event.getEventId(), event.getCompanyId(), event.getRecipient());

            rabbitTemplate.convertAndSend(
                    properties.getExchange(),
                    properties.getEmailRoutingKey(),
                    event,
                    message -> {
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        message.getMessageProperties().setHeader("X-Company-Id", String.valueOf(event.getCompanyId()));
                        message.getMessageProperties().setHeader("X-Event-Id", String.valueOf(event.getEventId()));
                        return message;
                    },
                    correlationData
            );

            // Wait bounded time for publisher confirm if supported
            CorrelationData.Confirm confirm = correlationData.getFuture().get(5, TimeUnit.SECONDS);
            if (confirm != null && confirm.ack()) {
                log.debug("AMQP Producer: Email event broker ACK received | eventId={}", event.getEventId());
                return true;
            } else {
                log.warn("AMQP Producer: Email event broker NACK or null | eventId={} | reason={}",
                        event.getEventId(), confirm != null ? confirm.reason() : "timeout/null");
                return false;
            }

        } catch (Exception ex) {
            log.error("AMQP Producer: Failed to publish email event | eventId={} | error={}",
                    event.getEventId(), ex.getMessage(), ex);
            return false;
        }
    }

    /**
     * Publishes a WhatsApp notification event to RabbitMQ with persistent delivery mode and publisher confirms.
     *
     * @param event WhatsApp event to publish
     * @return true if broker confirmed receipt, false if rejected or timed out.
     */
    public boolean sendWhatsAppNotification(WhatsAppNotificationEvent event) {
        if (event == null) {
            log.error("Cannot publish null WhatsAppNotificationEvent");
            return false;
        }

        if (event.getEventId() == null) {
            event.setEventId(UUID.randomUUID());
        }

        CorrelationData correlationData = new CorrelationData(event.getEventId().toString());

        try {
            log.info("AMQP Producer: Publishing WhatsApp event | eventId={} | companyId={} | to={}",
                    event.getEventId(), event.getCompanyId(), event.getRecipientPhone());

            rabbitTemplate.convertAndSend(
                    properties.getExchange(),
                    properties.getWhatsappRoutingKey(),
                    event,
                    message -> {
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        message.getMessageProperties().setHeader("X-Company-Id", String.valueOf(event.getCompanyId()));
                        message.getMessageProperties().setHeader("X-Event-Id", String.valueOf(event.getEventId()));
                        return message;
                    },
                    correlationData
            );

            CorrelationData.Confirm confirm = correlationData.getFuture().get(5, TimeUnit.SECONDS);
            if (confirm != null && confirm.ack()) {
                log.debug("AMQP Producer: WhatsApp event broker ACK received | eventId={}", event.getEventId());
                return true;
            } else {
                log.warn("AMQP Producer: WhatsApp event broker NACK | eventId={} | reason={}",
                        event.getEventId(), confirm != null ? confirm.reason() : "timeout/null");
                return false;
            }

        } catch (Exception ex) {
            log.error("AMQP Producer: Failed to publish WhatsApp event | eventId={} | error={}",
                    event.getEventId(), ex.getMessage(), ex);
            return false;
        }
    }
}
