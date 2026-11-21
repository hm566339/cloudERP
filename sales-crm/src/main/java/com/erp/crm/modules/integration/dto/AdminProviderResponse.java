package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProviderResponse {

    private UUID id;
    private IntegrationProviderCode code;
    private String displayName;
    private IntegrationAuthType authType;
    private String logoUrl;
    private Map<String, Object> globalConfig;
    private String globalConfigJson;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Backward-compatible 9-argument constructor
    public AdminProviderResponse(UUID id, IntegrationProviderCode code, String displayName,
            IntegrationAuthType authType, Map<String, Object> globalConfig,
            String globalConfigJson, Boolean isEnabled, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this(id, code, displayName, authType, null, globalConfig, globalConfigJson, isEnabled, createdAt, updatedAt);
    }
}
