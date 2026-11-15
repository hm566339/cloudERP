package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantIntegrationRequest {

    @NotNull(message = "Channel ID is required")
    private UUID integrationChannelId;

    @NotBlank(message = "Connection name is required")
    private String connectionName;

    @Builder.Default
    private String authType = "API_KEY";

    private String credentialVaultRef;

    private Integer syncFrequencyMinutes;

    private String settingsJson;
}

