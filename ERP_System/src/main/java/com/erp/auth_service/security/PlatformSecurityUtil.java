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

    public static boolean isElevatedAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            if (auth.getPrincipal() instanceof PlatformAdminPrincipal) {
                return true;
            }
            if (auth.getAuthorities() != null) {
                return auth.getAuthorities().stream().anyMatch(a -> {
                    String authStr = a.getAuthority();
                    return "SYSTEM_ADMIN".equalsIgnoreCase(authStr)
                            || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(authStr)
                            || "SUPER_ADMIN".equalsIgnoreCase(authStr)
                            || "ROLE_SUPER_ADMIN".equalsIgnoreCase(authStr)
                            || "ROLE_PLATFORM_SUPPORT".equalsIgnoreCase(authStr)
                            || "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(authStr)
                            || "ROLE_SUPPORT_ADMIN".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_ADMIN_MANAGE".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_SUPPORT_ACCESS".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_COMPANY_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_SUBSCRIPTION_READ".equalsIgnoreCase(authStr);
                });
            }
        }
        return false;
    }

    public static boolean isOwner() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            return auth.getAuthorities().stream().anyMatch(a -> {
                String authStr = a.getAuthority();
                return "OWNER".equalsIgnoreCase(authStr)
                        || "ROLE_OWNER".equalsIgnoreCase(authStr);
            });
        }
        return false;
    }

    public static boolean isOwnerOrAdmin() {
        if (isElevatedAdmin() || isOwner()) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities() != null) {
            return auth.getAuthorities().stream().anyMatch(a -> {
                String authStr = a.getAuthority();
                return "ADMIN".equalsIgnoreCase(authStr)
                        || "ROLE_ADMIN".equalsIgnoreCase(authStr);
            });
        }
        return false;
    }
}

