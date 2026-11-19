package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProviderUpdateRequest {

    private String displayName;

    private IntegrationAuthType authType;

    /**
     * Accepts either a raw JSON string or structured map of config:
     * clientId, clientSecret, apiBaseUrl, redirectUri, defaultFieldMapping
     */
    private Map<String, Object> globalConfig;

    private String globalConfigJson;

    private Boolean isEnabled;
}
