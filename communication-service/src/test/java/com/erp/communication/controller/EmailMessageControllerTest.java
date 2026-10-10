package com.erp.communication.controller;

import com.erp.communication.channel.CommunicationChannel;
import com.erp.communication.channel.ProviderRegistry;
import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.dto.request.SendChannelMessageRequest;
import com.erp.communication.dto.request.SendEmailRequest;
import com.erp.communication.dto.response.CommunicationResponse;
import com.erp.communication.exception.GlobalExceptionHandler;
import com.erp.communication.exception.UnsupportedChannelException;
import com.erp.communication.model.NotificationStatus;
import com.erp.communication.service.CommunicationDispatchService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class EmailMessageControllerTest {

    private MockMvc mockMvcEmail;
    private MockMvc mockMvcChannel;
    private CommunicationDispatchService dispatchService;

    @BeforeEach
    void setUp() {
        dispatchService = Mockito.mock(CommunicationDispatchService.class);

        EmailMessageController emailController = new EmailMessageController(dispatchService);
        CommunicationMessageController channelController = new CommunicationMessageController(dispatchService);

        mockMvcEmail = MockMvcBuilders.standaloneSetup(emailController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        mockMvcChannel = MockMvcBuilders.standaloneSetup(channelController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("Should successfully accept valid email request")
    void testDispatchEmailSuccess() throws Exception {
        UUID notifId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        CommunicationResponse response = CommunicationResponse.builder()
                .notificationId(notifId)
                .companyId(companyId)
                .channel(CommunicationChannel.EMAIL)
                .recipientMasked("e***e@example.com")
                .status(NotificationStatus.ACCEPTED_BY_PROVIDER)
                .providerName("SMTP")
                .createdAt(LocalDateTime.now())
                .message("Email accepted by mail provider for delivery")
                .build();

        when(dispatchService.dispatchEmail(any(SendEmailRequest.class))).thenReturn(response);

        String body = """
                {
                    "companyId": "%s",
                    "recipient": "employee@example.com",
                    "subject": "Greetings",
                    "htmlContent": "<p>Hello World</p>"
                }
                """.formatted(companyId);

        mockMvcEmail.perform(post("/api/communication/v1/messages/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(notifId.toString()))
                .andExpect(jsonPath("$.status").value("ACCEPTED_BY_PROVIDER"))
                .andExpect(jsonPath("$.channel").value("EMAIL"))
                .andExpect(jsonPath("$.providerName").value("SMTP"));
    }

    @Test
    @DisplayName("Should return 422 CHANNEL_NOT_SUPPORTED when requesting WHATSAPP channel")
    void testRejectWhatsAppChannel() throws Exception {
        when(dispatchService.dispatchChannelMessage(any(SendChannelMessageRequest.class)))
                .thenThrow(new UnsupportedChannelException(CommunicationChannel.WHATSAPP));

        String body = """
                {
                    "companyId": "%s",
                    "channel": "WHATSAPP",
                    "recipient": "+919876543210",
                    "templateCode": "WHATSAPP_INVITE"
                }
                """.formatted(UUID.randomUUID());

        mockMvcChannel.perform(post("/api/communication/v1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.errorCode").value("CHANNEL_NOT_SUPPORTED"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("not supported")));
    }

    @Test
    @DisplayName("Should return 400 when recipient is malformed")
    void testRejectInvalidRecipient() throws Exception {
        String body = """
                {
                    "companyId": "%s",
                    "recipient": "not-valid-email",
                    "subject": "Invalid"
                }
                """.formatted(UUID.randomUUID());

        mockMvcEmail.perform(post("/api/communication/v1/messages/email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_ERROR"));
    }
}
