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
    private String authType;
    private String webhookSlug;
    private Integer syncFrequencyMinutes;
    private IntegrationSyncStatus syncStatus;
    private LocalDateTime lastSyncAt;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
}

