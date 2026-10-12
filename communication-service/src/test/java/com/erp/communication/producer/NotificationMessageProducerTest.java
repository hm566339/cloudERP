package com.erp.communication.producer;

import com.erp.communication.config.RabbitMqProperties;
import com.erp.communication.event.EmailNotificationEvent;
import com.erp.communication.event.WhatsAppNotificationEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class NotificationMessageProducerTest {

    private RabbitTemplate rabbitTemplate;
    private RabbitMqProperties properties;
    private NotificationMessageProducer producer;

    @BeforeEach
    void setUp() {
        rabbitTemplate = Mockito.mock(RabbitTemplate.class);
        properties = new RabbitMqProperties();
        producer = new NotificationMessageProducer(rabbitTemplate, properties);
    }

    @Test
    @DisplayName("Should successfully publish email event and return true when broker sends ACK")
    void testSendEmailNotificationSuccess() {
        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .eventId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("test@mark2.in")
                .subject("Test Subject")
                .build();

        doAnswer(invocation -> {
            CorrelationData cd = invocation.getArgument(4);
            cd.getFuture().complete(new CorrelationData.Confirm(true, null));
            return null;
        }).when(rabbitTemplate).convertAndSend(eq(properties.getExchange()), eq(properties.getEmailRoutingKey()), any(), any(), any(CorrelationData.class));

        boolean published = producer.sendEmailNotification(event);
        assertTrue(published);
        verify(rabbitTemplate, times(1)).convertAndSend(eq(properties.getExchange()), eq(properties.getEmailRoutingKey()), eq(event), any(), any(CorrelationData.class));
    }

    @Test
    @DisplayName("Should return false when broker returns NACK for email event")
    void testSendEmailNotificationNack() {
        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .eventId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipient("test@mark2.in")
                .build();

        doAnswer(invocation -> {
            CorrelationData cd = invocation.getArgument(4);
            cd.getFuture().complete(new CorrelationData.Confirm(false, "Queue full"));
            return null;
        }).when(rabbitTemplate).convertAndSend(eq(properties.getExchange()), eq(properties.getEmailRoutingKey()), any(), any(), any(CorrelationData.class));

        boolean published = producer.sendEmailNotification(event);
        assertFalse(published);
    }

    @Test
    @DisplayName("Should successfully publish WhatsApp event and return true when broker sends ACK")
    void testSendWhatsAppNotificationSuccess() {
        WhatsAppNotificationEvent event = WhatsAppNotificationEvent.builder()
                .eventId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipientPhone("+919876543210")
                .messageText("Hello")
                .build();

        doAnswer(invocation -> {
            CorrelationData cd = invocation.getArgument(4);
            cd.getFuture().complete(new CorrelationData.Confirm(true, null));
            return null;
        }).when(rabbitTemplate).convertAndSend(eq(properties.getExchange()), eq(properties.getWhatsappRoutingKey()), any(), any(), any(CorrelationData.class));

        boolean published = producer.sendWhatsAppNotification(event);
        assertTrue(published);
        verify(rabbitTemplate, times(1)).convertAndSend(eq(properties.getExchange()), eq(properties.getWhatsappRoutingKey()), eq(event), any(), any(CorrelationData.class));
    }

    @Test
    @DisplayName("Should reject publishing null event gracefully")
    void testPublishNullEvent() {
        assertFalse(producer.sendEmailNotification(null));
        assertFalse(producer.sendWhatsAppNotification(null));
    }
}
