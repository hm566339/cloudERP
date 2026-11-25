package com.erp.communication.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.whatsapp")
@Data
public class WhatsAppProperties {

    /**
     * Provider mode: "mock" (default for local/testing) or "real" (for production provider API).
     */
    private String provider = "mock";

    /**
     * Whether WhatsApp messaging is globally enabled.
     */
    private boolean enabled = true;

    /**
     * If provider is "real" and required credentials are empty, fail immediately instead of silently falling back.
     */
    private boolean failIfUnconfigured = true;

    /**
     * Base URL for the WhatsApp provider API (e.g. Meta Graph API or custom provider gateway).
     */
    private String apiUrl = "";

    /**
     * API authorization token for WhatsApp provider. Must be provided via environment variable.
     */
    private String apiToken = "";

    /**
     * Business phone number ID / account ID registered with the provider.
     */
    private String phoneNumberId = "";

    /**
     * WhatsApp Business Account ID (WABA ID).
     */
    private String wabaId = "";

    /**
     * Secret verification token for incoming Meta Webhook verification (GET challenge).
     */
    private String webhookVerifyToken = "mark2-whatsapp-verify-token";

    /**
     * Connection timeout in milliseconds.
     */
    private int connectionTimeoutMs = 5000;

    /**
     * Read timeout in milliseconds.
     */
    private int readTimeoutMs = 10000;
}
