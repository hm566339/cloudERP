package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
    name = "organization_role_template",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_org_role_template_name", columnNames = {"organization_id", "name"})
    },
    indexes = {
        @Index(name = "idx_org_role_template_org", columnList = "organization_id"),
        @Index(name = "idx_org_role_template_status", columnList = "organization_id, status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRoleTemplate {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean isSystem = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean status = true;

    @OneToMany(
        mappedBy = "roleTemplate",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @Builder.Default
    private List<OrganizationRoleTemplatePermission> permissions = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

