package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import jakarta.validation.constraints.NotBlank;
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
public class TenantIntegrationConnectRequest {

    @NotNull(message = "Provider code is required")
    private IntegrationProviderCode providerCode;

    @NotBlank(message = "Integration name is required")
    private String integrationName;

    /**
     * User-specific credentials:
     * e.g., pageId, pageAccessToken, formId for Facebook; crmKey for IndiaMART
     */
    private Map<String, Object> credentials;

    /**
     * Routing configuration:
     * e.g., poolId (sales pool assignment), autoQualify (boolean)
     */
    private Map<String, Object> routingConfig;

    /**
     * Optional custom webhook slug or verification secret
     */
    private String webhookSlug;
}
