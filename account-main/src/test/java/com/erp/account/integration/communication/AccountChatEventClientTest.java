package com.erp.account.integration.communication;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountChatEventClientTest {

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private RestClient.RequestBodySpec requestBodySpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    private AccountChatEventClient client;

    @BeforeEach
    void setUp() {
        client = new AccountChatEventClient(restClient);
        client.setCommunicationServiceUrl("http://localhost:8084");
        client.setServiceToken("test-service-token");
    }

    @Test
    @DisplayName("Should send quotation ready event with company and service headers")
    void testSendQuotationReadyEventSuccess() {
        UUID companyId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();

        when(restClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.header(anyString(), anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.contentType(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.body(any(AccountChatEventClient.ChatEventPayload.class))).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);

        assertDoesNotThrow(() -> client.sendQuotationReadyEvent(
                companyId,
                quotationId,
                "QT-2026-9999",
                "Senior Accountant",
                Map.of("totalAmount", 125000.00, "status", "APPROVED")
        ));

        verify(restClient, times(1)).post();
        verify(requestBodySpec).header("X-Company-Id", companyId.toString());
        verify(requestBodySpec).header("X-Service-Token", "test-service-token");
    }

    @Test
    @DisplayName("Should not throw when communication-service is down or returns error")
    void testSendQuotationReadyEventFailureHandledGracefully() {
        UUID companyId = UUID.randomUUID();
        UUID quotationId = UUID.randomUUID();

        when(restClient.post()).thenThrow(new RuntimeException("Connection timeout to communication-service:8084"));

        assertDoesNotThrow(() -> client.sendQuotationReadyEvent(
                companyId,
                quotationId,
                "QT-2026-8888",
                "Accountant",
                Map.of()
        ));
    }
}
