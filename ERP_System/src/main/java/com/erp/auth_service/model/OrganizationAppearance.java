package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "organization_appearance",
        uniqueConstraints = @UniqueConstraint(name = "uk_org_appearance_organization", columnNames = {"organization_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationAppearance {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "uuid")
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false, unique = true)
    private Organization organization;

    @Column(name = "active_theme", nullable = false, length = 50)
    @Builder.Default
    private String activeTheme = "sage";

    @Column(name = "appearance_mode", nullable = false, length = 20)
    @Builder.Default
    private String appearanceMode = "system";

    @Column(name = "layout_density", nullable = false, length = 20)
    @Builder.Default
    private String layoutDensity = "comfortable";

    @Column(name = "font_family", nullable = false, length = 50)
    @Builder.Default
    private String fontFamily = "default";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

