package com.erp.crm.modules.integration.entity;

import com.erp.crm.modules.integration.converter.Aes256EncryptionConverter;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.enums.TenantIntegrationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tenant integration instances managed by authorized tenant users.
 * Contains user-specific account credentials and routing rules.
 * Sensitive fields inside credentials_json are encrypted at rest using AES-256.
 */
@Entity
@Table(name = "tenant_integrations", indexes = {
        @Index(name = "idx_tenant_integrations_tenant", columnList = "tenant_id"),
        @Index(name = "idx_tenant_integrations_provider", columnList = "provider_code")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantIntegrationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider_code", nullable = false, length = 50)
    private IntegrationProviderCode providerCode;

    @Column(name = "integration_name", nullable = false, length = 150)
    private String integrationName;

    /**
     * Encrypted JSON containing user-specific credentials:
     * e.g., pageId, pageAccessToken, formId for Facebook; crmKey for IndiaMART
     */
    @Convert(converter = Aes256EncryptionConverter.class)
    @Column(name = "credentials_json", columnDefinition = "text")
    private String credentialsJson;

    /**
     * JSON containing routing configuration:
     * e.g., lead pool/team assignment (poolId), auto-qualify flag (autoQualify)
     */
    @Column(name = "routing_config_json", columnDefinition = "text")
    private String routingConfigJson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    @Builder.Default
    private TenantIntegrationStatus status = TenantIntegrationStatus.CONNECTED;

    @Column(name = "webhook_slug", length = 120, unique = true)
    private String webhookSlug;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "created_by")
    private UUID createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
