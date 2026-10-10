package com.erp.communication.channel;

import com.erp.communication.channel.email.EmailProvider;
import com.erp.communication.exception.UnsupportedChannelException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProviderRegistry {

    private final EmailProvider emailProvider;
    private final Map<CommunicationChannel, CommunicationProvider> providers = new ConcurrentHashMap<>();

    public EmailProvider getEmailProvider() {
        return emailProvider;
    }

    public CommunicationProvider getProvider(CommunicationChannel channel) {
        if (channel == null) {
            throw new IllegalArgumentException("Channel cannot be null");
        }
        if (channel == CommunicationChannel.EMAIL) {
            return emailProvider;
        }
        // WHATSAPP, SMS, PUSH, IN_APP are strictly unsupported in Phase 1
        log.warn("Requested channel [{}] is not implemented or supported", channel);
        throw new UnsupportedChannelException(channel);
    }

    public boolean isChannelSupported(CommunicationChannel channel) {
        return channel == CommunicationChannel.EMAIL;
    }
}
