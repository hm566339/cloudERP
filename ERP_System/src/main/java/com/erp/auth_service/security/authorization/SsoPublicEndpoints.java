package com.erp.auth_service.security.authorization;

public final class SsoPublicEndpoints {

    private SsoPublicEndpoints() {}

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
            "/api/sso/organization/*",
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
}
