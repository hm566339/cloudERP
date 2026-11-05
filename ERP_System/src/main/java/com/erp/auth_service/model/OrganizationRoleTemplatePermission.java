package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "organization_role_template_permission",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_org_role_template_perm", columnNames = {"role_template_id", "feature_permission_id"})
    },
    indexes = {
        @Index(name = "idx_org_template_perm_template", columnList = "role_template_id"),
        @Index(name = "idx_org_template_perm_feature", columnList = "feature_permission_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRoleTemplatePermission {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_template_id", nullable = false)
    private OrganizationRoleTemplate roleTemplate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "feature_permission_id", nullable = false)
    private FeaturePermission permission;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

