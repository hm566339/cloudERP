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
    private Map<String, Object> globalConfig;
    private String globalConfigJson;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
