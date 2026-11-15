package com.erp.crm.modules.integration.entity;

import com.erp.crm.modules.integration.enums.IntegrationProvider;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_integration_channel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmIntegrationChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
        @Column(name = "provider_code", nullable = false, unique = true)
    private IntegrationProvider providerCode;

    @Column(name = "provider_name", nullable = false, length = 100)
    private String providerName;

    @Column(name = "provider_category", nullable = false, length = 50)
    private String providerCategory;

    @Builder.Default
    @Column(name = "supports_pull", nullable = false)
    private Boolean supportsPull = false;

    @Builder.Default
    @Column(name = "supports_push", nullable = false)
    private Boolean supportsPush = true;

    @Builder.Default
    @Column(name = "supports_oauth", nullable = false)
    private Boolean supportsOauth = false;

    @Column(name = "auth_instructions", columnDefinition = "text")
    private String authInstructions;

    @Column(name = "documentation_url", length = 500)
    private String documentationUrl;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
