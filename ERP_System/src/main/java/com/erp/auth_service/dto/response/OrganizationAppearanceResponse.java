package com.erp.auth_service.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OrganizationAppearanceResponse {

    private UUID organizationId;
    private String organizationCode;
    private String activeTheme;
    private String appearanceMode;
    private String layoutDensity;
    private String fontFamily;

    // ── Layout & Structure Customization ──
    private String sidebarDefaultState;
    private String contentWidth;
    private String borderRadius;
    private Boolean cardShadow;
    private String tableDensity;

    // ── Typography Customization ──
    private String baseFontSize;

    // ── Branding Assets & Logo Configuration ──
    private String lightLogoUrl;
    private String darkLogoUrl;
    private String faviconUrl;

    // ── Custom Palette Overrides ──
    private Boolean customOverridesEnabled;
    private String customPalette;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;

    private LocalDateTime updatedAt;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public Map<String, Object> getLayout() {
        Map<String, Object> map = new HashMap<>();
        map.put("sidebarCollapsed", "collapsed".equalsIgnoreCase(sidebarDefaultState));
        map.put("sidebarDefaultState", sidebarDefaultState != null ? sidebarDefaultState : "expanded");
        map.put("density", layoutDensity != null ? layoutDensity : "comfortable");
        map.put("contentWidth", contentWidth != null ? contentWidth : "standard");
        map.put("borderRadius", borderRadius != null ? borderRadius : "medium");
        map.put("cardShadows", cardShadow != null ? cardShadow : true);
        map.put("tableDensity", tableDensity != null ? tableDensity : "comfortable");
        return map;
    }

    public Map<String, Object> getTypography() {
        Map<String, Object> map = new HashMap<>();
        map.put("fontSize", baseFontSize != null ? baseFontSize : "default");
        map.put("fontFamily", fontFamily != null ? fontFamily : "default");
        return map;
    }

    public Map<String, Object> getBranding() {
        Map<String, Object> map = new HashMap<>();
        map.put("lightLogoUrl", lightLogoUrl);
        map.put("darkLogoUrl", darkLogoUrl);
        map.put("faviconUrl", faviconUrl);
        return map;
    }

    public Object getCustomColors() {
        if (!Boolean.TRUE.equals(customOverridesEnabled)) {
            return null;
        }
        if (StringUtils.hasText(customPalette)) {
            try {
                return MAPPER.readValue(customPalette, new TypeReference<Map<String, Object>>() {
                });
            } catch (Exception ignored) {
                // Return string representation if not valid json
                return customPalette;
            }
        }
        if (primaryColor != null || secondaryColor != null || accentColor != null) {
            Map<String, String> colors = new HashMap<>();
            if (primaryColor != null)
                colors.put("primary", primaryColor);
            if (secondaryColor != null)
                colors.put("secondary", secondaryColor);
            if (accentColor != null)
                colors.put("accent", accentColor);
            return colors;
        }
        return null;
    }

    public static OrganizationAppearanceResponse defaultFor(UUID organizationId, String organizationCode) {
        return OrganizationAppearanceResponse.builder()
                .organizationId(organizationId)
                .organizationCode(organizationCode)
                .activeTheme("sage")
                .appearanceMode("system")
                .layoutDensity("comfortable")
                .fontFamily("default")
                .sidebarDefaultState("expanded")
                .contentWidth("standard")
                .borderRadius("medium")
                .cardShadow(true)
                .tableDensity("comfortable")
                .baseFontSize("default")
                .lightLogoUrl(null)
                .darkLogoUrl(null)
                .faviconUrl(null)
                .customOverridesEnabled(false)
                .customPalette(null)
                .primaryColor(null)
                .secondaryColor(null)
                .accentColor(null)
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
