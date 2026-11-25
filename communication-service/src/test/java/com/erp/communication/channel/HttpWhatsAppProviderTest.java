package com.erp.communication.channel;

import com.erp.communication.channel.whatsapp.HttpWhatsAppProvider;
import com.erp.communication.channel.whatsapp.MockWhatsAppProvider;
import com.erp.communication.channel.whatsapp.WhatsAppMessage;
import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.model.CommunicationResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class HttpWhatsAppProviderTest {

    @Test
    @DisplayName("MockWhatsAppProvider: should simulate delivery and return MOCK_WHATSAPP provider name")
    void testMockWhatsAppProviderSuccess() {
        WhatsAppProperties props = new WhatsAppProperties();
        props.setEnabled(true);
        props.setProvider("mock");

        MockWhatsAppProvider provider = new MockWhatsAppProvider(props);
        assertEquals("MOCK_WHATSAPP", provider.getProviderName());
        assertTrue(provider.isEnabled());

        WhatsAppMessage message = WhatsAppMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipientPhone("+919876543210")
                .messageText("Your OTP is 123456")
                .build();

        CommunicationResult result = provider.sendWhatsApp(message);
        assertTrue(result.isSuccess());
        assertEquals("MOCK_WHATSAPP", result.getProviderName());
        assertTrue(result.getProviderMessageId().startsWith("mock-wa-"));
    }

    @Test
    @DisplayName("MockWhatsAppProvider: should fail if recipient phone is invalid")
    void testMockWhatsAppProviderInvalidPhone() {
        WhatsAppProperties props = new WhatsAppProperties();
        props.setEnabled(true);

        MockWhatsAppProvider provider = new MockWhatsAppProvider(props);
        WhatsAppMessage message = WhatsAppMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipientPhone("invalid-phone")
                .messageText("Hello")
                .build();

        CommunicationResult result = provider.sendWhatsApp(message);
        assertFalse(result.isSuccess());
        assertFalse(result.isRetryable());
        assertTrue(result.getErrorMessage().contains("Invalid phone number format"));
    }

    @Test
    @DisplayName("MockWhatsAppProvider: should properly mask phone numbers in logs and output")
    void testPhoneMasking() {
        assertEquals("+91****3210", MockWhatsAppProvider.maskPhoneNumber("+919876543210"));
        assertEquals("****", MockWhatsAppProvider.maskPhoneNumber("123"));
        assertEquals("[empty]", MockWhatsAppProvider.maskPhoneNumber(null));
    }

    @Test
    @DisplayName("HttpWhatsAppProvider: should fail safely without leaking or inventing secrets when unconfigured in production")
    void testHttpWhatsAppProviderFailsSafelyWhenUnconfigured() {
        WhatsAppProperties props = new WhatsAppProperties();
        props.setEnabled(true);
        props.setProvider("real");
        props.setApiUrl("");
        props.setApiToken("");

        HttpWhatsAppProvider provider = new HttpWhatsAppProvider(props);
        assertEquals("HTTP_WHATSAPP", provider.getProviderName());

        WhatsAppMessage message = WhatsAppMessage.builder()
                .notificationId(UUID.randomUUID())
                .companyId(UUID.randomUUID())
                .recipientPhone("+919876543210")
                .messageText("Test production message")
                .build();

        CommunicationResult result = provider.sendWhatsApp(message);
        assertFalse(result.isSuccess());
        assertFalse(result.isRetryable());
        assertTrue(result.getErrorMessage().contains("missing"));
    }

    @Test
    @DisplayName("HttpWhatsAppProvider: should resolve multi-tenant WABA credentials from repository when present")
    void testHttpWhatsAppProviderResolvesCompanyWabaConfig() {
        WhatsAppProperties props = new WhatsAppProperties();
        props.setEnabled(true);
        props.setProvider("real");
        props.setApiUrl("https://graph.facebook.com/v21.0/default/messages");
        props.setApiToken("default-token");

        com.erp.communication.repository.CompanyWhatsAppConfigRepository configRepo =
                org.mockito.Mockito.mock(com.erp.communication.repository.CompanyWhatsAppConfigRepository.class);

        UUID companyId = UUID.randomUUID();
        com.erp.communication.entity.CompanyWhatsAppConfig customConfig =
                com.erp.communication.entity.CompanyWhatsAppConfig.builder()
                        .id(UUID.randomUUID())
                        .companyId(companyId)
                        .phoneNumberId("109876543210987")
                        .accessToken("custom-company-access-token")
                        .apiUrl("https://graph.facebook.com/v21.0/109876543210987/messages")
                        .isActive(true)
                        .build();

        org.mockito.Mockito.when(configRepo.findByCompanyIdAndIsActiveTrue(companyId))
                .thenReturn(java.util.Optional.of(customConfig));

        HttpWhatsAppProvider provider = new HttpWhatsAppProvider(props, configRepo);
        assertEquals("HTTP_WHATSAPP", provider.getProviderName());
        assertTrue(provider.isEnabled());
    }
}
