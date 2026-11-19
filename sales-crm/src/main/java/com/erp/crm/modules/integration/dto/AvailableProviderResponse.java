package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailableProviderResponse {

    private IntegrationProviderCode code;
    private String displayName;
    private IntegrationAuthType authType;
    private String clientId;
    private String redirectUri;
    private Boolean isEnabled;
    private String description;
}
