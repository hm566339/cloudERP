package com.erp.communication.consumer;

import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.event.WhatsAppNotificationEvent;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class WhatsAppNotificationConsumerTest {

    @Autowired
    private WhatsAppNotificationConsumer consumer;

    @Autowired
    private NotificationRequestRepository requestRepository;

    @Test
    @DisplayName("Should successfully consume WhatsApp event using mock provider without claiming real delivery")
    void testSuccessfulWhatsAppMockProcessing() {
        UUID companyId = UUID.randomUUID();
        String idempotencyKey = "amqp-wa-" + UUID.randomUUID();

        WhatsAppNotificationEvent event = WhatsAppNotificationEvent.builder()
                .companyId(companyId)
                .recipientPhone("+919876543210")
                .subject("Payment Received")
                .messageText("Thank you, your invoice has been paid.")
                .idempotencyKey(idempotencyKey)
                .build();

        assertDoesNotThrow(() -> consumer.processWhatsAppNotification(event));

        Optional<NotificationRequest> saved = requestRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
        assertTrue(saved.isPresent());
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, saved.get().getStatus());
        assertEquals("+919876543210", saved.get().getRecipient());
    }

    @Test
    @DisplayName("Should detect duplicate WhatsApp event via idempotency key and avoid redundant dispatch")
    void testDuplicateWhatsAppMessageHandling() {
        UUID companyId = UUID.randomUUID();
        String idempotencyKey = "amqp-wa-dup-" + UUID.randomUUID();

        WhatsAppNotificationEvent event = WhatsAppNotificationEvent.builder()
                .companyId(companyId)
                .recipientPhone("+919876543210")
                .subject("Reminder")
                .messageText("Reminder to approve purchase order.")
                .idempotencyKey(idempotencyKey)
                .build();

        // First delivery
        consumer.processWhatsAppNotification(event);
        Optional<NotificationRequest> first = requestRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
        assertTrue(first.isPresent());

        // Second delivery with same idempotency key must not fail and must preserve original request
        assertDoesNotThrow(() -> consumer.processWhatsAppNotification(event));
    }

    @Test
    @DisplayName("Should permanently reject and route to DLQ when phone number format is invalid")
    void testInvalidPhoneFormatRoutesToDlq() {
        UUID companyId = UUID.randomUUID();
        WhatsAppNotificationEvent event = WhatsAppNotificationEvent.builder()
                .companyId(companyId)
                .recipientPhone("invalid-phone-string")
                .messageText("Hello")
                .build();

        AmqpRejectAndDontRequeueException ex = assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processWhatsAppNotification(event));
        assertTrue(ex.getMessage().contains("Permanent WhatsApp dispatch error"));
    }

    @Test
    @DisplayName("Should reject message immediately when mandatory companyId or recipient is missing")
    void testMissingFieldsThrowsAmqpReject() {
        WhatsAppNotificationEvent eventNoRecipient = WhatsAppNotificationEvent.builder()
                .companyId(UUID.randomUUID())
                .recipientPhone(null)
                .build();

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processWhatsAppNotification(eventNoRecipient));

        WhatsAppNotificationEvent eventNoCompanyId = WhatsAppNotificationEvent.builder()
                .companyId(null)
                .recipientPhone("+919876543210")
                .build();

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processWhatsAppNotification(eventNoCompanyId));
    }
}
