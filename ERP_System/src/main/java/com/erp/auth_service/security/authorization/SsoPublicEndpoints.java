package com.erp.auth_service.security.authorization;

import java.util.Locale;
import java.util.Set;

public final class SsoPublicEndpoints {

    private SsoPublicEndpoints() {
    }

    public static final Set<String> RESERVED_ORGANIZATION_PATHS = Set.of(
            "role-templates",
            "permissions",
            "members",
            "appearance",
            "profile",
            "login-portal",
            "regional-settings",
            "security",
            "companies",
            "subscription",
            "modules",
            "settings",
            "audit");

    public static final String[] PUBLIC_ENDPOINTS = {
            "/api/admin/auth/login",
            "/api/sso/admin/auth/login",
            "/api/sso/auth/login",
            "/api/billing/webhook/**",
            "/api/sso/billing/webhook/**",
            "/api/webhooks/**",
            "/api/sso/webhooks/**",
            "/api/sso/auth/select-company",
            "/api/sso/auth/admin-login",
            "/api/sso/auth/register",
            "/api/sso/signup",
            "/api/sso/authorize",
            "/api/sso/token/exchange",
            "/api/sso/token/refresh",
            "/api/sso/company/open",
            "/api/sso/admin/token/refresh",
            "/api/sso/token/verify",
            "/api/sso/auth/logout",

            "/api/sso/user/verify-email",
            "/api/sso/user/forgot-password",
            "/api/sso/user/reset-password",

            "/api/sso/session/sso/callback",
            "/api/sso/session/sso/refresh",
            "/api/sso/session/sso/logout",

            "/api/sso/module-routes/internal/routes",

            // Swagger
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/api-docs/**",
            "/api-docs",
            "/v3/api-docs/**",

            // Actuator
            "/actuator/**"
    };

    public static final String[] PUBLIC_POST_ENDPOINTS = {
            "/api/sso/user",
            "/api/sso/user/"
    };

    public static boolean isPublicRegistration(String method, String path) {
        if (!"POST".equalsIgnoreCase(method)) {
            return false;
        }
        if (path == null) {
            return false;
        }
        String cleanPath = path;
        int qIdx = cleanPath.indexOf('?');
        if (qIdx >= 0) {
            cleanPath = cleanPath.substring(0, qIdx);
        }
        return "/api/sso/user".equals(cleanPath) || "/api/sso/user/".equals(cleanPath);
    }

    public static boolean isPublicOrganizationLookup(String method, String path) {
        if (!"GET".equalsIgnoreCase(method)) {
            return false;
        }
        if (path == null) {
            return false;
        }
        String cleanPath = path;
        int qIdx = cleanPath.indexOf('?');
        if (qIdx >= 0) {
            cleanPath = cleanPath.substring(0, qIdx);
        }
        if (!cleanPath.startsWith("/api/sso/organization/")) {
            return false;
        }
        String sub = cleanPath.substring("/api/sso/organization/".length());
        if (sub.endsWith("/")) {
            sub = sub.substring(0, sub.length() - 1);
        }
        if (sub.isEmpty() || sub.contains("/")) {
            return false;
        }
        return !RESERVED_ORGANIZATION_PATHS.contains(sub.toLowerCase(Locale.ROOT));
    }
}
