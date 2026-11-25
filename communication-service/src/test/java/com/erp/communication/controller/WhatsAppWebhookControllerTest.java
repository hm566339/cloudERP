package com.erp.communication.controller;

import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.entity.CompanyWhatsAppConfig;
import com.erp.communication.entity.NotificationDelivery;
import com.erp.communication.entity.NotificationRequest;
import com.erp.communication.model.DeliveryStatus;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.repository.CompanyWhatsAppConfigRepository;
import com.erp.communication.repository.NotificationDeliveryRepository;
import com.erp.communication.repository.NotificationRequestRepository;
import com.erp.communication.service.WhatsAppWebhookService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class WhatsAppWebhookControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CompanyWhatsAppConfigRepository configRepository;

    @Mock
    private NotificationDeliveryRepository deliveryRepository;

    @Mock
    private NotificationRequestRepository requestRepository;

    private WhatsAppProperties properties;
    private WhatsAppWebhookService webhookService;

    @BeforeEach
    void setUp() {
        properties = new WhatsAppProperties();
        properties.setWebhookVerifyToken("mark2-whatsapp-verify-token");

        webhookService = new WhatsAppWebhookService(
                properties,
                configRepository,
                deliveryRepository,
                requestRepository
        );

        WhatsAppWebhookController controller = new WhatsAppWebhookController(webhookService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("GET /webhooks/whatsapp: succeeds with challenge on valid global verify token")
    void testVerifyWebhookSuccessWithGlobalToken() throws Exception {
        mockMvc.perform(get("/api/communication/v1/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "mark2-whatsapp-verify-token")
                        .param("hub.challenge", "challenge_abc_123"))
                .andExpect(status().isOk())
                .andExpect(content().string("challenge_abc_123"));
    }

    @Test
    @DisplayName("GET /webhooks/whatsapp: succeeds with challenge on valid company-specific verify token")
    void testVerifyWebhookSuccessWithCompanyToken() throws Exception {
        UUID companyId = UUID.randomUUID();
        CompanyWhatsAppConfig config = CompanyWhatsAppConfig.builder()
                .companyId(companyId)
                .webhookVerifyToken("company-secret-token")
                .isActive(true)
                .build();

        when(configRepository.findByCompanyIdAndIsActiveTrue(companyId))
                .thenReturn(Optional.of(config));

        mockMvc.perform(get("/api/communication/v1/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "company-secret-token")
                        .param("hub.challenge", "company_challenge_789")
                        .param("company_id", companyId.toString()))
                .andExpect(status().isOk())
                .andExpect(content().string("company_challenge_789"));
    }

    @Test
    @DisplayName("GET /webhooks/whatsapp: returns 403 Forbidden on invalid verify token")
    void testVerifyWebhookInvalidToken() throws Exception {
        mockMvc.perform(get("/api/communication/v1/webhooks/whatsapp")
                        .param("hub.mode", "subscribe")
                        .param("hub.verify_token", "wrong-token")
                        .param("hub.challenge", "challenge_abc_123"))
                .andExpect(status().isForbidden())
                .andExpect(content().string("Verification token mismatch"));
    }

    @Test
    @DisplayName("POST /webhooks/whatsapp: updates delivery & request status to DELIVERED on Meta status callback")
    void testWebhookStatusCallbackDelivered() throws Exception {
        String wamid = "wamid.HBgLMTIzNDU2Nzg5MA==";
        NotificationRequest request = NotificationRequest.builder()
                .id(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .status(NotificationStatus.ACCEPTED_BY_PROVIDER)
                .build();

        NotificationDelivery delivery = NotificationDelivery.builder()
                .id(UUID.randomUUID())
                .notificationRequest(request)
                .providerMessageId(wamid)
                .status(DeliveryStatus.SUBMITTED)
                .attemptAt(LocalDateTime.now())
                .build();

        when(deliveryRepository.findFirstByProviderMessageIdOrderByAttemptAtDesc(wamid))
                .thenReturn(Optional.of(delivery));

        String json = """
                {
                  "object": "whatsapp_business_account",
                  "entry": [
                    {
                      "id": "WABA_ID_100",
                      "changes": [
                        {
                          "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                              "display_phone_number": "+919876543210",
                              "phone_number_id": "PN_ID_200"
                            },
                            "statuses": [
                              {
                                "id": "%s",
                                "status": "delivered",
                                "timestamp": "1732540000",
                                "recipient_id": "919876543210"
                              }
                            ]
                          },
                          "field": "messages"
                        }
                      ]
                    }
                  ]
                }
                """.formatted(wamid);

        mockMvc.perform(post("/api/communication/v1/webhooks/whatsapp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        assertEquals(DeliveryStatus.DELIVERED, delivery.getStatus());
        assertEquals(NotificationStatus.DELIVERED, request.getStatus());
        verify(deliveryRepository).save(delivery);
        verify(requestRepository).save(request);
    }

    @Test
    @DisplayName("POST /webhooks/whatsapp: updates delivery & request status to READ on Meta read receipt")
    void testWebhookStatusCallbackRead() throws Exception {
        String wamid = "wamid.HBgLOTg3NjU0MzIxMA==";
        NotificationRequest request = NotificationRequest.builder()
                .id(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .status(NotificationStatus.DELIVERED)
                .build();

        NotificationDelivery delivery = NotificationDelivery.builder()
                .id(UUID.randomUUID())
                .notificationRequest(request)
                .providerMessageId(wamid)
                .status(DeliveryStatus.DELIVERED)
                .attemptAt(LocalDateTime.now())
                .build();

        when(deliveryRepository.findFirstByProviderMessageIdOrderByAttemptAtDesc(wamid))
                .thenReturn(Optional.of(delivery));

        String json = """
                {
                  "object": "whatsapp_business_account",
                  "entry": [
                    {
                      "id": "WABA_ID_100",
                      "changes": [
                        {
                          "value": {
                            "messaging_product": "whatsapp",
                            "statuses": [
                              {
                                "id": "%s",
                                "status": "read",
                                "timestamp": "1732540100",
                                "recipient_id": "919876543210"
                              }
                            ]
                          },
                          "field": "messages"
                        }
                      ]
                    }
                  ]
                }
                """.formatted(wamid);

        mockMvc.perform(post("/api/communication/v1/webhooks/whatsapp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        assertEquals(DeliveryStatus.READ, delivery.getStatus());
        assertEquals(NotificationStatus.READ, request.getStatus());
        verify(deliveryRepository).save(delivery);
        verify(requestRepository).save(request);
    }

    @Test
    @DisplayName("POST /webhooks/whatsapp: logs inbound message and returns 200 OK")
    void testWebhookInboundCustomerMessage() throws Exception {
        String json = """
                {
                  "object": "whatsapp_business_account",
                  "entry": [
                    {
                      "id": "WABA_ID_100",
                      "changes": [
                        {
                          "value": {
                            "messaging_product": "whatsapp",
                            "messages": [
                              {
                                "from": "919876543210",
                                "id": "wamid.INBOUND_MSG_1",
                                "timestamp": "1732540200",
                                "type": "text",
                                "text": {
                                  "body": "Thank you for the quotation"
                                }
                              }
                            ]
                          },
                          "field": "messages"
                        }
                      ]
                    }
                  ]
                }
                """;

        mockMvc.perform(post("/api/communication/v1/webhooks/whatsapp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        verify(deliveryRepository, never()).save(any());
    }
}
