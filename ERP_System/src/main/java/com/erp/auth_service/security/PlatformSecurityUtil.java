package com.erp.auth_service.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class PlatformSecurityUtil {

    private PlatformSecurityUtil() {}

    public static UUID getCurrentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof PlatformAdminPrincipal principal) {
            return principal.getAdminId();
        }
        return null;
    }

    public static String getCurrentAdminEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof PlatformAdminPrincipal principal) {
            return principal.getEmail();
        }
        return auth != null ? auth.getName() : null;
    }
}
