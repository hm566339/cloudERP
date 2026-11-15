package com.erp.crm.modules.integration.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.integration.enums.IntegrationSyncStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_tenant_integration")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmTenantIntegration extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "integration_channel_id", nullable = false)
    private UUID integrationChannelId;

    @Column(name = "connection_name", nullable = false, length = 150)
    private String connectionName;

    @Builder.Default
    @Column(name = "auth_type", nullable = false, length = 30)
    private String authType = "API_KEY";

    @Column(name = "credential_vault_ref", length = 255)
    private String credentialVaultRef;

    @Column(name = "webhook_secret_hash", length = 255)
    private String webhookSecretHash;

    @Column(name = "webhook_slug", nullable = false, unique = true, length = 120)
    private String webhookSlug;

    @Builder.Default
    @Column(name = "sync_frequency_minutes")
    private Integer syncFrequencyMinutes = 15;

    @Enumerated(EnumType.STRING)
        @Column(name = "sync_status", nullable = false)
    @Builder.Default
    private IntegrationSyncStatus syncStatus = IntegrationSyncStatus.ACTIVE;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Column(name = "last_error_message", columnDefinition = "text")
    private String lastErrorMessage;

    @Builder.Default
    @Column(name = "consecutive_failures", nullable = false)
    private Integer consecutiveFailures = 0;

    @Column(name = "settings_json", columnDefinition = "text")
    private String settingsJson;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;
}
