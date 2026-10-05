package com.erp.auth_service.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "razorpay")
@Getter
@Setter
public class RazorpayProperties {
    private boolean enabled = true;
    private String keyId;
    private String keySecret;
    private String webhookSecret;
    private String baseUrl = "https://api.razorpay.com/v1";

    public boolean isConfigured() {
        return enabled && keyId != null && !keyId.isBlank()
                && keySecret != null && !keySecret.isBlank();
    }
}
