package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationAuthType;
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
public class AdminProviderCreateRequest {

    @NotBlank(message = "Provider code is required")
    private String code; // e.g. "TRADEINDIA", "JUSTDIAL", "LINKEDIN_LEADS"

    @NotBlank(message = "Display name is required")
    private String displayName; // e.g. "TradeIndia Marketplace"

    @NotNull(message = "Authorization type is required")
    private IntegrationAuthType authType; // OAUTH2, API_KEY, WEBHOOK

    private String logoUrl;

    private Map<String, Object> globalConfig;

    private String globalConfigJson;

    @Builder.Default
    private Boolean isEnabled = true;
}
