package com.erp.auth_service.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateSecuritySettingsRequest {

    private Boolean enforce2FA;
    private Boolean twoFactorRequired;

    private Integer sessionTimeoutMinutes;
    private String sessionTimeout;

    private UpdateSecuritySettingsRequest data;

    public Boolean resolveEnforce2FA() {
        if (enforce2FA != null) return enforce2FA;
        if (twoFactorRequired != null) return twoFactorRequired;
        if (data != null) return data.resolveEnforce2FA();
        return null;
    }

    public Integer resolveSessionTimeoutMinutes() {
        if (sessionTimeoutMinutes != null && sessionTimeoutMinutes > 0) {
            return sessionTimeoutMinutes;
        }
        if (sessionTimeout != null && !sessionTimeout.isBlank()) {
            try {
                return Integer.parseInt(sessionTimeout.trim());
            } catch (NumberFormatException ignored) {}
        }
        if (data != null) {
            return data.resolveSessionTimeoutMinutes();
        }
        return null;
    }
}

