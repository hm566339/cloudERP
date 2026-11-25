package com.erp.communication.service;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.ProviderRegistry;
import com.erp.communication.channel.email.EmailMessage;
import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.dto.request.SendChannelMessageRequest;
import com.erp.communication.dto.request.SendEmailRequest;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.dto.response.NotificationStatusResponse;
import com.erp.communication.model.CommunicationResult;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationDeliveryRepository;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.template.RenderedEmail;
import com.erp.communication.template.TemplateCode;
import com.erp.communication.template.TemplateEngineService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class CommunicationDispatchServiceTest {

    @Autowired
    private CommunicationDispatchService dispatchService;

    @Autowired
    private NotificationQueryService queryService;

    @Autowired
    private NotificationRequestRepository requestRepository;

    @Autowired
    private NotificationDeliveryRepository deliveryRepository;

    @MockitoBean
    private EmailProvider emailProvider;

    @Test
    @DisplayName("Should dispatch email synchronously, create delivery record, and prevent duplicate sends via idempotency")
    void testDispatchEmailAndIdempotency() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.success("SMTP", "msg-id-100", 25L));

        UUID companyId = UUID.randomUUID();
        String idempotencyKey = "user-setup-" + UUID.randomUUID();

        SendEmailRequest request = SendEmailRequest.builder()
                .companyId(companyId)
                .recipient("employee@acme.com")
                .templateCode(TemplateCode.EMPLOYEE_PROVISIONING)
                .templateData(Map.of(
                        "fullName", "Alice Walker",
                        "companyName", "Acme ERP",
                        "username", "awalker",
                        "setupUrl", "https://www.mark2.in/erp/set-password?token=abc"
                ))
                .idempotencyKey(idempotencyKey)
                .async(false)
                .build();

        // 1. First Dispatch
        CommunicationResponse response1 = dispatchService.dispatchEmail(request);
        assertNotNull(response1);
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, response1.getStatus());
        assertEquals("SMTP", response1.getProviderName());
        verify(emailProvider, times(1)).sendEmail(any(EmailMessage.class));

        // 2. Query Status
        NotificationStatusResponse statusResponse = queryService.getNotificationStatus(response1.getNotificationId(), companyId);
        assertNotNull(statusResponse);
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, statusResponse.getStatus());
        assertEquals(1, statusResponse.getDeliveryAttempts().size());

        // 3. Second Dispatch with exact same Idempotency Key -> Must NOT call provider again
        CommunicationResponse response2 = dispatchService.dispatchEmail(request);
        assertNotNull(response2);
        assertEquals(response1.getNotificationId(), response2.getNotificationId());
        // Verify email provider was STILL called only 1 time in total!
        verify(emailProvider, times(1)).sendEmail(any(EmailMessage.class));
    }

    @Test
    @DisplayName("Should schedule retry with backoff when transient failure occurs")
    void testTransientErrorSchedulesRetry() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.failure("SMTP", "Socket connection timeout to smtp.gmail.com", true, 100L));

        UUID companyId = UUID.randomUUID();
        SendEmailRequest request = SendEmailRequest.builder()
                .companyId(companyId)
                .recipient("bob@acme.com")
                .subject("Invoice Notice")
                .plainTextContent("Please find attached invoice")
                .async(false)
                .build();

        CommunicationResponse response = dispatchService.dispatchEmail(request);
        assertNotNull(response);
        assertEquals(NotificationStatus.PENDING, response.getStatus());

        var entity = requestRepository.findById(response.getNotificationId()).orElseThrow();
        assertEquals(1, entity.getRetryCount());
        assertNotNull(entity.getNextRetryAt(), "Transient error must schedule a next retry timestamp");
    }

    @Test
    @DisplayName("Should mark notification permanently FAILED and not schedule retry for permanent errors")
    void testPermanentErrorDoesNotScheduleRetry() {
        when(emailProvider.sendEmail(any(EmailMessage.class)))
                .thenReturn(CommunicationResult.failure("SMTP", "Invalid recipient email address format: bad@domain", false, 15L));

        UUID companyId = UUID.randomUUID();
        SendEmailRequest request = SendEmailRequest.builder()
                .companyId(companyId)
                .recipient("bad@domain")
                .subject("Notice")
                .plainTextContent("Test message")
                .async(false)
                .build();

        CommunicationResponse response = dispatchService.dispatchEmail(request);
        assertNotNull(response);
        assertEquals(NotificationStatus.FAILED, response.getStatus());

        var entity = requestRepository.findById(response.getNotificationId()).orElseThrow();
        assertEquals(1, entity.getRetryCount());
        assertNull(entity.getNextRetryAt(), "Permanent error must NOT schedule any future retry");
    }

    @Test
    @DisplayName("Should dispatch WhatsApp synchronously and record delivery")
    void testDispatchWhatsAppSuccess() {
        UUID companyId = UUID.randomUUID();
        SendChannelMessageRequest request = SendChannelMessageRequest.builder()
                .companyId(companyId)
                .channel(CommunicationChannel.WHATSAPP)
                .recipient("+919876543210")
                .subject("Welcome to Mark2 ERP")
                .templateCode("WELCOME_USER")
                .templateData(Map.of("messageText", "Hello from Mark2 ERP", "userId", "user-123"))
                .async(false)
                .build();

        CommunicationResponse response = dispatchService.dispatchWhatsApp(request);
        assertNotNull(response);
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, response.getStatus());
        assertEquals("MOCK_WHATSAPP", response.getProviderName());

        var entity = requestRepository.findById(response.getNotificationId()).orElseThrow();
        assertEquals(CommunicationChannel.WHATSAPP, entity.getChannel());
        assertEquals(1, entity.getRetryCount());
        assertNull(entity.getNextRetryAt());
    }

    @Test
    @DisplayName("Should execute WhatsApp retry via executeWhatsAppDelivery overload")
    void testExecuteWhatsAppDeliveryOverload() {
        UUID companyId = UUID.randomUUID();
        NotificationRequest initial = NotificationRequest.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .channel(CommunicationChannel.WHATSAPP)
                .recipient("+919876543210")
                .recipientMasked("+91******3210")
                .eventCode("WHATSAPP_ALERT")
                .subject("Critical Server Alert")
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .maxRetries(3)
                .build();

        NotificationRequest saved = requestRepository.save(initial);

        CommunicationResponse response = dispatchService.executeWhatsAppDelivery(saved.getId(), "Critical Server Alert");
        assertNotNull(response);
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, response.getStatus());

        var updated = requestRepository.findById(saved.getId()).orElseThrow();
        assertEquals(1, updated.getRetryCount());
        assertEquals(NotificationStatus.ACCEPTED_BY_PROVIDER, updated.getStatus());
    }
}
