package com.erp.communication.channel.whatsapp;

import com.erp.communication.config.WhatsAppProperties;
import com.erp.communication.model.CommunicationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Mock WhatsApp Provider for local development and automated testing only.
 * This provider explicitly logs that deliveries are simulated and NEVER connects to a real WhatsApp network.
 */
@Component("mockWhatsAppProvider")
@ConditionalOnProperty(name = "app.whatsapp.provider", havingValue = "mock", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class MockWhatsAppProvider implements WhatsAppProvider {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^\\+?[1-9]\\d{7,14}$");

    private final WhatsAppProperties properties;

    @Override
    public String getProviderName() {
        return "MOCK_WHATSAPP";
    }

    @Override
    public boolean isEnabled() {
        return properties.isEnabled();
    }

    @Override
    public CommunicationResult sendWhatsApp(WhatsAppMessage message) {
        long start = System.currentTimeMillis();
        String maskedPhone = maskPhoneNumber(message.getRecipientPhone());

        log.warn("MOCK_WHATSAPP: Simulating WhatsApp delivery (SIMULATION ONLY - NOT A REAL DELIVERY) | notificationId={} | recipient={} | template={}",
                message.getNotificationId(), maskedPhone, message.getTemplateCode());

        if (!properties.isEnabled()) {
            return CommunicationResult.failure(getProviderName(), "WhatsApp channel is disabled via configuration", false, 1L);
        }

        if (message.getRecipientPhone() == null || message.getRecipientPhone().isBlank()) {
            return CommunicationResult.failure(getProviderName(), "Recipient phone number is required", false, 1L);
        }

        String cleanedPhone = message.getRecipientPhone().replaceAll("[\\s\\-\\(\\)]", "");
        if (!PHONE_PATTERN.matcher(cleanedPhone).matches()) {
            return CommunicationResult.failure(getProviderName(), "Invalid phone number format: " + maskedPhone, false, 2L);
        }

        long duration = System.currentTimeMillis() - start;
        String simulatedMessageId = "mock-wa-" + (message.getNotificationId() != null ? message.getNotificationId() : System.currentTimeMillis());

        log.info("MOCK_WHATSAPP: Simulated delivery recorded successfully | providerMessageId={} | durationMs={}",
                simulatedMessageId, duration);

        return CommunicationResult.success(getProviderName(), simulatedMessageId, duration);
    }

    public static String maskPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) return "[empty]";
        String trimmed = phone.trim();
        if (trimmed.length() <= 4) return "****";
        return trimmed.substring(0, Math.min(3, trimmed.length() - 4)) + "****" + trimmed.substring(trimmed.length() - 4);
    }
}
