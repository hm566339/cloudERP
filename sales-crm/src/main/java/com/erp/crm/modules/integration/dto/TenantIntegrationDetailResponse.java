package com.erp.crm.modules.integration.dto;

import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.enums.TenantIntegrationStatus;
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
public class TenantIntegrationDetailResponse {

    private UUID id;
    private UUID tenantId;
    private IntegrationProviderCode providerCode;
    private String integrationName;
    private TenantIntegrationStatus status;
    private String webhookSlug;
    private String webhookUrl;
    private LocalDateTime lastSyncedAt;
    private Map<String, Object> safeCredentials;
    private Map<String, Object> routingConfig;
    private UUID createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Backward-compatibility getters for existing UI components
    public String getConnectionName() {
        return integrationName;
    }

    public String getChannelCode() {
        return providerCode != null ? providerCode.name() : "WEBHOOK";
    }

    public String getSyncStatus() {
        return status != null ? status.name() : "CONNECTED";
    }

    public LocalDateTime getLastSyncAt() {
        return lastSyncedAt;
    }
}
