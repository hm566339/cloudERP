package com.erp.communication.service;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.template.RenderedEmail;
import com.erp.communication.template.TemplateCode;
import com.erp.communication.template.TemplateEngineService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OutboxRetryWorkerTest {

    @Mock
    private NotificationRequestRepository requestRepository;

    @Mock
    private CommunicationDispatchService dispatchService;

    @Mock
    private TemplateEngineService templateEngineService;

    private ObjectMapper objectMapper;
    private OutboxRetryWorker worker;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        worker = new OutboxRetryWorker(requestRepository, dispatchService, templateEngineService, objectMapper);
        worker.setOutboxEnabled(true);
        worker.setBatchSize(20);
    }

    @Test
    @DisplayName("Should route EMAIL retry to executeEmailDelivery and render template")
    void testProcessEmailRetrySuccess() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(CommunicationChannel.EMAIL)
                .recipient("john@example.com")
                .recipientMasked("j***@example.com")
                .eventCode("EMPLOYEE_PROVISIONING")
                .subject("Welcome to Mark2 ERP")
                .payloadJson("{\"fullName\":\"John Doe\"}")
                .status(NotificationStatus.PENDING)
                .retryCount(1)
                .maxRetries(3)
                .nextRetryAt(LocalDateTime.now())
                .build();

        RenderedEmail rendered = RenderedEmail.builder()
                .subject("Welcome to Mark2 ERP")
                .htmlContent("<p>Welcome John Doe</p>")
                .plainTextContent("Welcome John Doe")
                .build();

        when(templateEngineService.render(eq(TemplateCode.EMPLOYEE_PROVISIONING), eq("Welcome to Mark2 ERP"), anyMap()))
                .thenReturn(rendered);

        worker.processSingleNotification(request);

        verify(dispatchService, times(1)).executeEmailDelivery(eq(notificationId), eq(rendered), eq(Collections.emptyList()));
        verify(dispatchService, never()).executeWhatsAppDelivery(any(UUID.class), anyString());
        verify(dispatchService, never()).executeWhatsAppDelivery(any(UUID.class), anyString(), anyMap());
        verify(requestRepository, never()).save(request);
    }

    @Test
    @DisplayName("Should fallback to generic RenderedEmail on template render failure for EMAIL")
    void testProcessEmailRetryWithFallback() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(CommunicationChannel.EMAIL)
                .recipient("user@example.com")
                .recipientMasked("u***@example.com")
                .eventCode("UNKNOWN_EVENT_CODE")
                .subject("Important Account Update")
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .build();

        worker.processSingleNotification(request);

        ArgumentCaptor<RenderedEmail> captor = ArgumentCaptor.forClass(RenderedEmail.class);
        verify(dispatchService, times(1)).executeEmailDelivery(eq(notificationId), captor.capture(), eq(Collections.emptyList()));
        RenderedEmail captured = captor.getValue();
        assertEquals("Important Account Update", captured.getSubject());
        assertTrue(captured.getHtmlContent().contains("Important Account Update"));
    }

    @Test
    @DisplayName("Should route WHATSAPP retry to executeWhatsAppDelivery and extract messageText from JSON payload")
    void testProcessWhatsAppRetryWithJsonPayload() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(CommunicationChannel.WHATSAPP)
                .recipient("+919876543210")
                .recipientMasked("+91******3210")
                .eventCode("WHATSAPP_MESSAGE")
                .subject("Order Status")
                .payloadJson("{\"messageText\":\"Your quotation #QT-1001 is ready for approval\",\"quotationId\":\"QT-1001\"}")
                .status(NotificationStatus.PENDING)
                .retryCount(1)
                .maxRetries(3)
                .nextRetryAt(LocalDateTime.now())
                .build();

        worker.processSingleNotification(request);

        ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Map<String, Object>> mapCaptor = ArgumentCaptor.forClass(Map.class);

        verify(dispatchService, times(1)).executeWhatsAppDelivery(eq(notificationId), messageCaptor.capture(), mapCaptor.capture());
        verify(dispatchService, never()).executeEmailDelivery(any(UUID.class), any(RenderedEmail.class), anyList());

        assertEquals("Your quotation #QT-1001 is ready for approval", messageCaptor.getValue());
        assertEquals("QT-1001", mapCaptor.getValue().get("quotationId"));
    }

    @Test
    @DisplayName("Should fallback to subject when payloadJson does not contain messageText for WHATSAPP")
    void testProcessWhatsAppRetryWithSubjectFallback() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(CommunicationChannel.WHATSAPP)
                .recipient("+919876543210")
                .recipientMasked("+91******3210")
                .eventCode("WHATSAPP_ALERT")
                .subject("Payment reminder: Invoice #INV-500 is due today")
                .payloadJson(null)
                .status(NotificationStatus.PENDING)
                .retryCount(0)
                .build();

        worker.processSingleNotification(request);

        verify(dispatchService, times(1)).executeWhatsAppDelivery(eq(notificationId), eq("Payment reminder: Invoice #INV-500 is due today"), anyMap());
        verify(dispatchService, never()).executeEmailDelivery(any(UUID.class), any(RenderedEmail.class), anyList());
    }

    @Test
    @DisplayName("Should mark unsupported channel (SMS) permanently FAILED and clear nextRetryAt to prevent retry loops")
    void testProcessUnsupportedChannelSms() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(CommunicationChannel.SMS)
                .recipient("+919876543210")
                .recipientMasked("+91******3210")
                .eventCode("SMS_OTP")
                .subject("Your OTP is 123456")
                .status(NotificationStatus.PENDING)
                .retryCount(1)
                .maxRetries(3)
                .nextRetryAt(LocalDateTime.now().plusSeconds(60))
                .build();

        worker.processSingleNotification(request);

        verify(dispatchService, never()).executeEmailDelivery(any(), any(), any());
        verify(dispatchService, never()).executeWhatsAppDelivery(any(), any());
        verify(dispatchService, never()).executeWhatsAppDelivery(any(), any(), any());

        assertEquals(NotificationStatus.FAILED, request.getStatus());
        assertEquals("Unsupported communication channel: SMS", request.getErrorSummary());
        assertNull(request.getNextRetryAt(), "nextRetryAt must be cleared to prevent infinite outbox loop");
        verify(requestRepository, times(1)).save(request);
    }

    @Test
    @DisplayName("Should mark null channel permanently FAILED and clear nextRetryAt")
    void testProcessNullChannel() {
        UUID notificationId = UUID.randomUUID();
        NotificationRequest request = NotificationRequest.builder()
                .id(notificationId)
                .companyId(UUID.randomUUID())
                .channel(null)
                .recipient("test@example.com")
                .recipientMasked("t***@example.com")
                .status(NotificationStatus.PENDING)
                .nextRetryAt(LocalDateTime.now())
                .build();

        worker.processSingleNotification(request);

        verify(dispatchService, never()).executeEmailDelivery(any(), any(), any());
        verify(dispatchService, never()).executeWhatsAppDelivery(any(), any());

        assertEquals(NotificationStatus.FAILED, request.getStatus());
        assertEquals("Unsupported communication channel: null", request.getErrorSummary());
        assertNull(request.getNextRetryAt());
        verify(requestRepository, times(1)).save(request);
    }

    @Test
    @DisplayName("Should process pending notifications from repository poll loop")
    void testProcessPendingNotificationsLoop() {
        NotificationRequest emailReq = NotificationRequest.builder()
                .id(UUID.randomUUID())
                .channel(CommunicationChannel.EMAIL)
                .eventCode("CUSTOM_EMAIL")
                .subject("System Update")
                .status(NotificationStatus.PENDING)
                .build();

        NotificationRequest waReq = NotificationRequest.builder()
                .id(UUID.randomUUID())
                .channel(CommunicationChannel.WHATSAPP)
                .eventCode("WHATSAPP_MESSAGE")
                .subject("Order Delivered")
                .status(NotificationStatus.PENDING)
                .build();

        when(requestRepository.findPendingRetries(eq(NotificationStatus.PENDING), any(LocalDateTime.class), any(Pageable.class)))
                .thenReturn(List.of(emailReq, waReq));

        worker.processPendingNotifications();

        verify(dispatchService, times(1)).executeEmailDelivery(eq(emailReq.getId()), any(RenderedEmail.class), anyList());
        verify(dispatchService, times(1)).executeWhatsAppDelivery(eq(waReq.getId()), eq("Order Delivered"), anyMap());
    }

    @Test
    @DisplayName("Should skip processing when outbox is disabled")
    void testOutboxDisabledSkipsProcessing() {
        worker.setOutboxEnabled(false);
        worker.processPendingNotifications();

        verifyNoInteractions(requestRepository);
        verifyNoInteractions(dispatchService);
    }
}
