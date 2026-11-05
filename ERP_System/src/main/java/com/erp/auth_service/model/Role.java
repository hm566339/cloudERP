package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "role",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"company_id", "name"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    /*
     * ROLE ID
     */
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    /*
     * COMPANY (MULTI TENANT)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /*
     * ORGANIZATION ROLE TEMPLATE (ORIGIN TEMPLATE)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private OrganizationRoleTemplate template;

    /*
     * ROLE DETAILS
     */
    @Column(length = 100, nullable = false)
    private String name;

    @Column(nullable = false)
    private boolean status = true;

    /*
     * RELATIONSHIPS
     */
    @OneToMany(
        mappedBy = "role",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<UserRole> userRoles;

    @OneToMany(
        mappedBy = "role",
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    private List<RolePermission> rolePermissions;

    /*
     * AUDIT
     */
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}