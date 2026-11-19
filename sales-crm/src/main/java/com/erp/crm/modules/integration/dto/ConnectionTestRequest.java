package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
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
public class ConnectionTestRequest {

    @NotNull(message = "Provider code is required")
    private IntegrationProviderCode providerCode;

    /**
     * User-provided credentials to test (e.g. crmKey for IndiaMART)
     */
    private Map<String, Object> credentials;

    private String crmKey;
}
