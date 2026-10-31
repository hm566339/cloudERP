package com.erp.gateway_service.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtAuthenticationFilterTest {

    @Test
    @DisplayName("Organization lookup /api/sso/organization/{code} must be recognized as public")
    void testOrganizationLookupIsPublic() {
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/mohit"));
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/mohit/"));
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/acme-corp"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/sso/auth/login",
            "/api/sso/auth/admin-login",
            "/api/sso/auth/register",
            "/api/sso/auth/select-company",
            "/api/sso/signup",
            "/api/sso/authorize",
            "/api/sso/token/exchange",
            "/api/sso/token/refresh",
            "/api/sso/company/open",
            "/api/sso/token/verify",
            "/api/sso/auth/logout",
            "/api/sso/user/verify-email",
            "/api/sso/user/forgot-password",
            "/api/sso/user/reset-password",
            "/api/sso/session/sso/callback",
            "/api/sso/session/sso/refresh",
            "/api/sso/session/sso/logout",
            "/api/sso/module-routes/internal/routes",
            "/api/billing/webhook/razorpay",
            "/api/sso/billing/webhook/stripe",
            "/swagger-ui/index.html",
            "/api-docs",
            "/v3/api-docs/swagger-config",
            "/actuator/health"
    })
    @DisplayName("Standard public endpoints must bypass authentication")
    void testStandardPublicEndpoints(String path) {
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("GET", path));
    }

    @Test
    @DisplayName("Public user registration is public only for POST /api/sso/user")
    void testPublicUserRegistration() {
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("POST", "/api/sso/user"));
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("POST", "/api/sso/user/"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/user"));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/sso/organization/appearance",
            "/api/sso/organization/appearance/",
            "/api/sso/organization/appearance/reset",
            "/api/sso/organization/members/companies",
            "/api/sso/organization/members/123/companies",
            "/api/account/invoices",
            "/api/inventory/products",
            "/api/v1/workflow/definitions",
            "/api/v1/workflow/tasks/pending",
            "/api/sso/users",
            "/api/sso/companies"
    })
    @DisplayName("Protected and microservice endpoints must NOT be recognized as public")
    void testProtectedEndpointsRequireAuthentication(String path) {
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("GET", path));
    }

    @Test
    @DisplayName("Organization appearance PUT and POST must require authentication")
    void testOrganizationAppearanceMutationsRequireAuth() {
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("PUT", "/api/sso/organization/appearance"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("PUT", "/api/sso/organization/appearance/"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("POST", "/api/sso/organization/appearance/reset"));
    }
}
