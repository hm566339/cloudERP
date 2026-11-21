package com.erp.crm.modules.integration.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum IntegrationProviderCode {
    FACEBOOK,
    INDIAMART,
    TRADEINDIA,
    CUSTOM_WEBHOOK,
    JUSTDIAL,
    LINKEDIN_LEADS,
    GOOGLE_ADS,
    ZAPIER,
    MAKE,
    OTHER;

    @JsonCreator
    public static IntegrationProviderCode fromString(String value) {
        if (value == null || value.isBlank()) return OTHER;
        String normalized = value.trim().toUpperCase().replace("-", "_").replace(" ", "_");
        for (IntegrationProviderCode c : values()) {
            if (c.name().equalsIgnoreCase(normalized)) {
                return c;
            }
        }
        return OTHER;
    }
}
