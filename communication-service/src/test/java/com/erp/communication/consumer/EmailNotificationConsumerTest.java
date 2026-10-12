package com.erp.communication.consumer;

import com.erp.communication.channel.email.EmailMessage;
import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.event.EmailNotificationEvent;
import com.erp.communication.model.CommunicationResult;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.service.CommunicationDispatchService;
import com.erp.communication.template.TemplateCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class EmailNotificationConsumerTest {

    @Autowired
    private EmailNotificationConsumer consumer;

    @Autowired
    private NotificationRequestRepository requestRepository;

    @MockitoBean
    private EmailProvider emailProvider;

    @Test
    @DisplayName("Should successfully consume email event, dispatch to SMTP provider, and record delivery")
    void testSuccessfulEmailQueueProcessing() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.success("SMTP", "msg-queue-101", 30L));

        UUID companyId = UUID.randomUUID();
        String idempotencyKey = "amqp-email-" + UUID.randomUUID();

        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .companyId(companyId)
                .recipient("test.user@mark2.in")
                .subject("Welcome to Mark2 ERP")
                .templateCode(TemplateCode.EMPLOYEE_PROVISIONING)
                .templateData(Map.of("fullName", "Bob Hope", "companyName", "Mark2 Inc"))
                .idempotencyKey(idempotencyKey)
                .build();

        assertDoesNotThrow(() -> consumer.processEmailNotification(event));

        Optional<NotificationRequest> saved = requestRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
        assertTrue(saved.isPresent());
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, saved.get().getStatus());
        verify(emailProvider, times(1)).sendEmail(any(EmailMessage.class));
    }

    @Test
    @DisplayName("Should detect duplicate message via idempotency and skip external provider dispatch")
    void testDuplicateMessageHandling() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.success("SMTP", "msg-idempotent-202", 20L));

        UUID companyId = UUID.randomUUID();
        String idempotencyKey = "amqp-dup-" + UUID.randomUUID();

        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .companyId(companyId)
                .recipient("duplicate.user@mark2.in")
                .subject("Invoice Alert")
                .plainTextContent("Invoice 123 is ready")
                .idempotencyKey(idempotencyKey)
                .build();

        // First delivery attempt
        consumer.processEmailNotification(event);
        verify(emailProvider, times(1)).sendEmail(any(EmailMessage.class));

        // Second delivery attempt with exact same idempotency key
        consumer.processEmailNotification(event);

        // Verification: email provider was STILL called only 1 time in total!
        verify(emailProvider, times(1)).sendEmail(any(EmailMessage.class));
    }

    @Test
    @DisplayName("Should throw RuntimeException on transient failure to trigger AMQP retry with backoff")
    void testTransientFailureTriggersRetry() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.failure("SMTP", "Connection timed out to mail host", true, 50L));

        UUID companyId = UUID.randomUUID();
        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .companyId(companyId)
                .recipient("transient.fail@mark2.in")
                .subject("Notice")
                .plainTextContent("Test message")
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> consumer.processEmailNotification(event));
        assertTrue(ex.getMessage().contains("Transient email dispatch error"));
    }

    @Test
    @DisplayName("Should throw AmqpRejectAndDontRequeueException on permanent error for immediate DLQ routing")
    void testPermanentFailureRoutesToDlq() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.failure("SMTP", "Invalid recipient email address format: bad@domain", false, 10L));

        UUID companyId = UUID.randomUUID();
        EmailNotificationEvent event = EmailNotificationEvent.builder()
                .companyId(companyId)
                .recipient("bad@domain")
                .subject("Notice")
                .plainTextContent("Test message")
                .build();

        AmqpRejectAndDontRequeueException ex = assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processEmailNotification(event));
        assertTrue(ex.getMessage().contains("Permanent email dispatch error"));
    }

    @Test
    @DisplayName("Should reject message immediately without retry when mandatory fields are missing")
    void testMissingFieldsRejectsImmediately() {
        EmailNotificationEvent eventWithoutRecipient = EmailNotificationEvent.builder()
                .companyId(UUID.randomUUID())
                .recipient(null)
                .build();

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processEmailNotification(eventWithoutRecipient));

        EmailNotificationEvent eventWithoutCompanyId = EmailNotificationEvent.builder()
                .companyId(null)
                .recipient("valid@mark2.in")
                .build();

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.processEmailNotification(eventWithoutCompanyId));
    }
}
