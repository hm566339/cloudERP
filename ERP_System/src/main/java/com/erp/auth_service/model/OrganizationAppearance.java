package com.erp.auth_service.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_appearance", uniqueConstraints = @UniqueConstraint(name = "uk_org_appearance_organization", columnNames = {
        "organization_id" }))
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

    // ── Layout & Structure Customization ──

    @Column(name = "sidebar_default_state", length = 20)
    @Builder.Default
    private String sidebarDefaultState = "expanded";

    @Column(name = "content_width", length = 20)
    @Builder.Default
    private String contentWidth = "standard";

    @Column(name = "border_radius", length = 20)
    @Builder.Default
    private String borderRadius = "medium";

    @Column(name = "card_shadow")
    @Builder.Default
    private Boolean cardShadow = true;

    @Column(name = "table_density", length = 20)
    @Builder.Default
    private String tableDensity = "comfortable";

    // ── Typography Customization ──

    @Column(name = "base_font_size", length = 20)
    @Builder.Default
    private String baseFontSize = "default";

    // ── Branding Assets & Logo Configuration ──

    @Column(name = "light_logo_url", columnDefinition = "TEXT")
    private String lightLogoUrl;

    @Column(name = "dark_logo_url", columnDefinition = "TEXT")
    private String darkLogoUrl;

    @Column(name = "favicon_url", columnDefinition = "TEXT")
    private String faviconUrl;

    // ── Custom Palette Overrides (Advanced) ──

    @Column(name = "custom_overrides_enabled")
    @Builder.Default
    private Boolean customOverridesEnabled = false;

    @Column(name = "custom_palette", columnDefinition = "TEXT")
    private String customPalette;

    @Column(name = "primary_color", length = 30)
    private String primaryColor;

    @Column(name = "secondary_color", length = 30)
    private String secondaryColor;

    @Column(name = "accent_color", length = 30)
    private String accentColor;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
