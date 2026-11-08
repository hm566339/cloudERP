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
        assertTrue(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/my-org-123"));
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
            // Organization admin endpoints — all require authentication
            "/api/sso/organization/appearance",
            "/api/sso/organization/appearance/",
            "/api/sso/organization/appearance/reset",
            "/api/sso/organization/companies",
            "/api/sso/organization/companies/",
            "/api/sso/organization/subscription",
            "/api/sso/organization/subscription/",
            "/api/sso/organization/profile",
            "/api/sso/organization/members",
            "/api/sso/organization/members/companies",
            "/api/sso/organization/members/123/companies",
            "/api/sso/organization/role-templates",
            "/api/sso/organization/permissions",
            "/api/sso/organization/login-portal",
            "/api/sso/organization/regional-settings",
            "/api/sso/organization/security",
            "/api/sso/organization/modules",
            "/api/sso/organization/settings",
            "/api/sso/organization/audit",
            // Other protected endpoints
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

    @Test
    @DisplayName("Organization company and subscription mutations must require authentication")
    void testOrganizationCompanyAndSubscriptionMutationsRequireAuth() {
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("POST", "/api/sso/organization/companies"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("PUT", "/api/sso/organization/companies/some-id"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("DELETE", "/api/sso/organization/companies/some-id"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("POST", "/api/sso/organization/subscription"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("PUT", "/api/sso/organization/subscription"));
    }

    @Test
    @DisplayName("Public org lookup does not apply to paths with sub-segments beyond the org code")
    void testOrgLookupDoesNotMatchDeepPaths() {
        // /api/sso/organization/my-org/anything is NOT public even though my-org alone would be
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/my-org/companies"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/my-org/subscription"));
        assertFalse(JwtAuthenticationFilter.isPublicEndpoint("GET", "/api/sso/organization/my-org/members"));
    }
}
