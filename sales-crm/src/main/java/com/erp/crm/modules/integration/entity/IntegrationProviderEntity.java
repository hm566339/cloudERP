package com.erp.crm.modules.integration.entity;

import com.erp.crm.modules.integration.converter.Aes256EncryptionConverter;
import com.erp.crm.modules.integration.enums.IntegrationAuthType;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Global provider configuration managed exclusively by System Administrators.
 * Holds OAuth client credentials, API base URLs, redirect URIs, and default field mappings.
 * Sensitive fields inside global_config_json are encrypted at rest using AES-256.
 */
@Entity
@Table(name = "integration_providers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IntegrationProviderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "code", nullable = false, unique = true, length = 50)
    private IntegrationProviderCode code;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false, length = 30)
    private IntegrationAuthType authType;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    /**
     * Encrypted JSON storing global defaults:
     * clientId, clientSecret, apiBaseUrl, redirectUri, defaultFieldMapping
     */
    @Convert(converter = Aes256EncryptionConverter.class)
    @Column(name = "global_config_json", columnDefinition = "text")
    private String globalConfigJson;

    @Builder.Default
    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
