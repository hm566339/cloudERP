package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateOrganizationAppearanceRequest {

    private String activeTheme;
    private String appearanceMode;
    private String layoutDensity;
    private String fontFamily;

    /**
     * Optional nested request data wrapper for compatibility with both
     * `{ activeTheme: 'ocean' }` and `{ data: { activeTheme: 'ocean' } }`.
     */
    private UpdateOrganizationAppearanceRequest data;

    public String resolveActiveTheme() {
        if (data != null && data.getActiveTheme() != null) {
            return data.getActiveTheme();
        }
        return activeTheme;
    }

    public String resolveAppearanceMode() {
        if (data != null && data.getAppearanceMode() != null) {
            return data.getAppearanceMode();
        }
        return appearanceMode;
    }

    public String resolveLayoutDensity() {
        if (data != null && data.getLayoutDensity() != null) {
            return data.getLayoutDensity();
        }
        return layoutDensity;
    }

    public String resolveFontFamily() {
        if (data != null && data.getFontFamily() != null) {
            return data.getFontFamily();
        }
        return fontFamily;
    }
}

