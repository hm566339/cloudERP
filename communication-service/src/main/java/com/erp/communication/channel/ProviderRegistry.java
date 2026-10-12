package com.erp.communication.channel;

import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.channel.whatsapp.WhatsAppProvider;
import com.erp.communication.exception.UnsupportedChannelException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ProviderRegistry {

    private final EmailProvider emailProvider;
    private final WhatsAppProvider whatsAppProvider;

    @Autowired
    public ProviderRegistry(EmailProvider emailProvider, ObjectProvider<WhatsAppProvider> whatsAppProvider) {
        this.emailProvider = emailProvider;
        this.whatsAppProvider = whatsAppProvider.getIfAvailable();
    }

    public ProviderRegistry(EmailProvider emailProvider) {
        this.emailProvider = emailProvider;
        this.whatsAppProvider = null;
    }

    public ProviderRegistry(EmailProvider emailProvider, WhatsAppProvider whatsAppProvider) {
        this.emailProvider = emailProvider;
        this.whatsAppProvider = whatsAppProvider;
    }

    public EmailProvider getEmailProvider() {
        return emailProvider;
    }

    public WhatsAppProvider getWhatsAppProvider() {
        if (whatsAppProvider == null) {
            throw new UnsupportedChannelException(CommunicationChannel.WHATSAPP);
        }
        return whatsAppProvider;
    }

    public CommunicationProvider getProvider(CommunicationChannel channel) {
        if (channel == null) {
            throw new IllegalArgumentException("Channel cannot be null");
        }
        if (channel == CommunicationChannel.EMAIL) {
            return emailProvider;
        }
        if (channel == CommunicationChannel.WHATSAPP && whatsAppProvider != null) {
            return whatsAppProvider;
        }

        log.warn("Requested channel [{}] is not implemented or supported", channel);
        throw new UnsupportedChannelException(channel);
    }

    public boolean isChannelSupported(CommunicationChannel channel) {
        if (channel == CommunicationChannel.EMAIL) {
            return true;
        }
        if (channel == CommunicationChannel.WHATSAPP) {
            return whatsAppProvider != null;
        }
        return false;
    }
}
