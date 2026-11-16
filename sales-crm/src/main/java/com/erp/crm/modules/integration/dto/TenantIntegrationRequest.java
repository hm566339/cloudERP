package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantIntegrationRequest {

    private UUID integrationChannelId;

    private String channelCode;

    private String connectionName;

    private String integrationName;

    private String webhookSlug;

    private String apiKey;

    private String webhookSecret;

    @Builder.Default
    private Boolean autoQualify = true;

    private UUID roundRobinPoolId;

    @Builder.Default
    private String authType = "API_KEY";

    private String credentialVaultRef;

    private Integer syncFrequencyMinutes;

    private String settingsJson;
}

