package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantIntegrationResponse {

    private UUID id;
    private UUID companyId;
    private UUID integrationChannelId;
    private String connectionName;
    private String integrationName;
    private String channelCode;
    private String providerName;
    private String authType;
    private String webhookSlug;
    private String webhookUrl;
    private Integer syncFrequencyMinutes;
    private IntegrationSyncStatus syncStatus;
    private LocalDateTime lastSyncAt;
    private Boolean autoQualify;
    private UUID roundRobinPoolId;
    private String settingsJson;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
}

