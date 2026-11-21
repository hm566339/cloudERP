package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableProviderResponse {

    private IntegrationProviderCode code;
    private String displayName;
    private IntegrationAuthType authType;
    private String logoUrl;
    private String clientId;
    private String redirectUri;
    private Boolean isEnabled;
    private String description;

    /**
     * Dynamic schema definition of fields tenant users must provide when connecting this provider.
     * Contains e.g. [{ key: "userid", label: "User ID", type: "text", required: true }]
     */
    private List<Map<String, Object>> tenantFields;

    /**
     * Safe non-sensitive global configuration (sensitive secrets like clientSecret are stripped).
     */
    private Map<String, Object> globalConfig;

    // Backward-compatible constructor
    public AvailableProviderResponse(IntegrationProviderCode code, String displayName,
            IntegrationAuthType authType, String clientId, String redirectUri,
            Boolean isEnabled, String description, List<Map<String, Object>> tenantFields,
            Map<String, Object> globalConfig) {
        this(code, displayName, authType, null, clientId, redirectUri, isEnabled, description, tenantFields, globalConfig);
    }
}
