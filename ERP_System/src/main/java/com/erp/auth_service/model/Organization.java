package com.erp.auth_service.model;

import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.OrganizationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization", uniqueConstraints = @UniqueConstraint(name = "uk_organization_code", columnNames = "organization_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {
    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "organization_code", nullable = false, length = 120)
    private String organizationCode;

    @Column(name = "legal_name", nullable = false, length = 255)
    private String legalName;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private OrganizationStatus status = OrganizationStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_mode", nullable = false, length = 30)
    @Builder.Default
    private AccessMode accessMode = AccessMode.FULL;

    @Column(length = 80)
    private String timezone;

    @Column(length = 3)
    private String currency;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
