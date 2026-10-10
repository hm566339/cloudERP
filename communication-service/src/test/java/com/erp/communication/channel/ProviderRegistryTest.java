package com.erp.communication.channel;

import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.exception.UnsupportedChannelException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

class ProviderRegistryTest {

    private EmailProvider mockEmailProvider;
    private ProviderRegistry providerRegistry;

    @BeforeEach
    void setUp() {
        mockEmailProvider = Mockito.mock(EmailProvider.class);
        providerRegistry = new ProviderRegistry(mockEmailProvider);
    }

    @Test
    @DisplayName("Should return SmtpEmailProvider for EMAIL channel")
    void testEmailChannelSupported() {
        assertTrue(providerRegistry.isChannelSupported(CommunicationChannel.EMAIL));
        CommunicationProvider provider = providerRegistry.getProvider(CommunicationChannel.EMAIL);
        assertNotNull(provider);
        assertEquals(mockEmailProvider, provider);
    }

    @Test
    @DisplayName("Should strictly throw UnsupportedChannelException for WHATSAPP")
    void testWhatsAppChannelUnsupported() {
        assertFalse(providerRegistry.isChannelSupported(CommunicationChannel.WHATSAPP));
        UnsupportedChannelException ex = assertThrows(UnsupportedChannelException.class, () ->
                providerRegistry.getProvider(CommunicationChannel.WHATSAPP));
        assertEquals(CommunicationChannel.WHATSAPP, ex.getChannel());
        assertTrue(ex.getMessage().contains("not supported in the current release"));
    }

    @Test
    @DisplayName("Should strictly throw UnsupportedChannelException for SMS")
    void testSmsChannelUnsupported() {
        assertFalse(providerRegistry.isChannelSupported(CommunicationChannel.SMS));
        UnsupportedChannelException ex = assertThrows(UnsupportedChannelException.class, () ->
                providerRegistry.getProvider(CommunicationChannel.SMS));
        assertEquals(CommunicationChannel.SMS, ex.getChannel());
    }
}
