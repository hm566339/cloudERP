package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@Slf4j
public class UpdateOrganizationAppearanceRequest {

    private String activeTheme;
    private String appearanceMode;
    private String layoutDensity;
    private String fontFamily;

    // ── Layout & Structure ──
    private String sidebarDefaultState;
    private String contentWidth;
    private String borderRadius;
    private Boolean cardShadow;
    private String tableDensity;

    // ── Typography ──
    private String baseFontSize;

    // ── Branding Assets ──
    private String lightLogoUrl;
    private String darkLogoUrl;
    private String faviconUrl;

    // ── Custom Palette Overrides ──
    private Boolean customOverridesEnabled;
    private String customPalette;
    private String primaryColor;
    private String secondaryColor;
    private String accentColor;

    // ── Nested payload support for frontend structures ──
    private Map<String, Object> layout;
    private Map<String, Object> typography;
    private Map<String, Object> branding;
    private Object customColors;

    /**
     * Optional nested request data wrapper for compatibility with both
     * `{ activeTheme: 'ocean' }` and `{ data: { activeTheme: 'ocean' } }`.
     */
    private UpdateOrganizationAppearanceRequest data;

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public String resolveActiveTheme() {
        if (data != null && data.resolveActiveTheme() != null) {
            return data.resolveActiveTheme();
        }
        return activeTheme;
    }

    public String resolveAppearanceMode() {
        if (data != null && data.resolveAppearanceMode() != null) {
            return data.resolveAppearanceMode();
        }
        return appearanceMode;
    }

    public String resolveLayoutDensity() {
        if (data != null && data.resolveLayoutDensity() != null) {
            return data.resolveLayoutDensity();
        }
        if (StringUtils.hasText(layoutDensity)) {
            return layoutDensity;
        }
        if (layout != null && layout.get("density") != null) {
            return String.valueOf(layout.get("density"));
        }
        return null;
    }

    public String resolveFontFamily() {
        if (data != null && data.resolveFontFamily() != null) {
            return data.resolveFontFamily();
        }
        if (StringUtils.hasText(fontFamily)) {
            return fontFamily;
        }
        if (typography != null && typography.get("fontFamily") != null) {
            return String.valueOf(typography.get("fontFamily"));
        }
        return null;
    }

    public String resolveSidebarDefaultState() {
        if (data != null && data.resolveSidebarDefaultState() != null) {
            return data.resolveSidebarDefaultState();
        }
        if (StringUtils.hasText(sidebarDefaultState)) {
            return sidebarDefaultState;
        }
        if (layout != null) {
            if (layout.get("sidebarDefaultState") != null) {
                return String.valueOf(layout.get("sidebarDefaultState"));
            }
            if (layout.get("sidebarCollapsed") != null) {
                Object val = layout.get("sidebarCollapsed");
                boolean collapsed = Boolean.parseBoolean(String.valueOf(val));
                return collapsed ? "collapsed" : "expanded";
            }
        }
        return null;
    }

    public String resolveContentWidth() {
        if (data != null && data.resolveContentWidth() != null) {
            return data.resolveContentWidth();
        }
        if (StringUtils.hasText(contentWidth)) {
            return contentWidth;
        }
        if (layout != null && layout.get("contentWidth") != null) {
            return String.valueOf(layout.get("contentWidth"));
        }
        return null;
    }

    public String resolveBorderRadius() {
        if (data != null && data.resolveBorderRadius() != null) {
            return data.resolveBorderRadius();
        }
        if (StringUtils.hasText(borderRadius)) {
            return borderRadius;
        }
        if (layout != null && layout.get("borderRadius") != null) {
            return String.valueOf(layout.get("borderRadius"));
        }
        return null;
    }

    public Boolean resolveCardShadow() {
        if (data != null && data.resolveCardShadow() != null) {
            return data.resolveCardShadow();
        }
        if (cardShadow != null) {
            return cardShadow;
        }
        if (layout != null) {
            if (layout.get("cardShadow") != null) {
                return Boolean.parseBoolean(String.valueOf(layout.get("cardShadow")));
            }
            if (layout.get("cardShadows") != null) {
                return Boolean.parseBoolean(String.valueOf(layout.get("cardShadows")));
            }
        }
        return null;
    }

    public String resolveTableDensity() {
        if (data != null && data.resolveTableDensity() != null) {
            return data.resolveTableDensity();
        }
        if (StringUtils.hasText(tableDensity)) {
            return tableDensity;
        }
        if (layout != null && layout.get("tableDensity") != null) {
            return String.valueOf(layout.get("tableDensity"));
        }
        return null;
    }

    public String resolveBaseFontSize() {
        if (data != null && data.resolveBaseFontSize() != null) {
            return data.resolveBaseFontSize();
        }
        if (StringUtils.hasText(baseFontSize)) {
            return baseFontSize;
        }
        if (typography != null) {
            if (typography.get("baseFontSize") != null) {
                return String.valueOf(typography.get("baseFontSize"));
            }
            if (typography.get("fontSize") != null) {
                return String.valueOf(typography.get("fontSize"));
            }
        }
        return null;
    }

    public String resolveLightLogoUrl() {
        if (data != null && data.resolveLightLogoUrl() != null) {
            return data.resolveLightLogoUrl();
        }
        if (StringUtils.hasText(lightLogoUrl)) {
            return lightLogoUrl;
        }
        if (branding != null && branding.get("lightLogoUrl") != null) {
            return String.valueOf(branding.get("lightLogoUrl"));
        }
        return null;
    }

    public String resolveDarkLogoUrl() {
        if (data != null && data.resolveDarkLogoUrl() != null) {
            return data.resolveDarkLogoUrl();
        }
        if (StringUtils.hasText(darkLogoUrl)) {
            return darkLogoUrl;
        }
        if (branding != null && branding.get("darkLogoUrl") != null) {
            return String.valueOf(branding.get("darkLogoUrl"));
        }
        return null;
    }

    public String resolveFaviconUrl() {
        if (data != null && data.resolveFaviconUrl() != null) {
            return data.resolveFaviconUrl();
        }
        if (StringUtils.hasText(faviconUrl)) {
            return faviconUrl;
        }
        if (branding != null && branding.get("faviconUrl") != null) {
            return String.valueOf(branding.get("faviconUrl"));
        }
        return null;
    }

    public Boolean resolveCustomOverridesEnabled() {
        if (data != null && data.resolveCustomOverridesEnabled() != null) {
            return data.resolveCustomOverridesEnabled();
        }
        if (customOverridesEnabled != null) {
            return customOverridesEnabled;
        }
        if (customColors != null) {
            if (customColors instanceof Map<?, ?> m && !m.isEmpty()) {
                return true;
            }
        }
        return null;
    }

    public String resolveCustomPalette() {
        if (data != null && data.resolveCustomPalette() != null) {
            return data.resolveCustomPalette();
        }
        if (StringUtils.hasText(customPalette)) {
            return customPalette;
        }
        if (customColors != null) {
            if (customColors instanceof String s && StringUtils.hasText(s)) {
                return s;
            }
            if (customColors instanceof Map<?, ?>) {
                try {
                    return MAPPER.writeValueAsString(customColors);
                } catch (JsonProcessingException e) {
                    log.warn("Failed to serialize customColors map to JSON", e);
                }
            }
        }
        return null;
    }

    public String resolvePrimaryColor() {
        if (data != null && data.resolvePrimaryColor() != null) {
            return data.resolvePrimaryColor();
        }
        if (StringUtils.hasText(primaryColor)) {
            return primaryColor;
        }
        if (customColors instanceof Map<?, ?> m && m.get("primary") != null) {
            return String.valueOf(m.get("primary"));
        }
        return null;
    }

    public String resolveSecondaryColor() {
        if (data != null && data.resolveSecondaryColor() != null) {
            return data.resolveSecondaryColor();
        }
        if (StringUtils.hasText(secondaryColor)) {
            return secondaryColor;
        }
        if (customColors instanceof Map<?, ?> m && m.get("secondary") != null) {
            return String.valueOf(m.get("secondary"));
        }
        return null;
    }

    public String resolveAccentColor() {
        if (data != null && data.resolveAccentColor() != null) {
            return data.resolveAccentColor();
        }
        if (StringUtils.hasText(accentColor)) {
            return accentColor;
        }
        if (customColors instanceof Map<?, ?> m && m.get("accent") != null) {
            return String.valueOf(m.get("accent"));
        }
        return null;
    }
}
