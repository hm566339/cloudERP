package com.erp.workflow.security;

import com.erp.workflow.exception.UnauthorizedException;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.security.dto.sso.*;
import com.erp.workflow.security.sso.SsoService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    @Mock
    private SsoService ssoService;

    private AuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthenticationFilter(ssoService);
        ReflectionTestUtils.setField(filter, "cookieName", "access_token");
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    private UserResponse buildActiveUser(UUID userId, String username, RoleResponse role) {
        return UserResponse.builder()
                .id(userId)
                .username(username)
                .fullName("Test User")
                .companyCode("ACME")
                .organizationId(UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"))
                .organizationCode("ORG_ACME")
                .accessMode("FULL")
                .accountStatus(AccountStatus.ACTIVE)
                .role(role != null ? List.of(role) : List.of())
                .features(List.of(FeatureResponse.builder().featureCode("WORKFLOW").build()))
                .permissions(List.of(
                        PermissionResponse.builder()
                                .permissionCode("WORKFLOW:READ")
                                .action("READ")
                                .moduleName("WORKFLOW")
                                .active(true)
                                .allowed(true)
                                .build()
                ))
                .build();
    }

    @Test
    @DisplayName("Valid SSO token with active account authenticates request and populates context")
    void testValidTokenWithActiveAccount() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse user = buildActiveUser(userId, "john.doe", RoleResponse.builder().name("WORKFLOW_USER").status(true).build());
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("valid-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer valid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(auth.getPrincipal()).isInstanceOf(AuthenticatedUser.class);

        AuthenticatedUser principal = (AuthenticatedUser) auth.getPrincipal();
        assertThat(principal.getUserId()).isEqualTo(userId);
        assertThat(principal.getUsername()).isEqualTo("john.doe");
        assertThat(principal.hasActiveRole("WORKFLOW_USER")).isTrue();
        assertThat(principal.hasPermission("WORKFLOW", "READ")).isTrue();

        // Also check SecurityUtils works with the authenticated user
        assertThat(SecurityUtils.getCurrentUserId()).contains(userId);
        assertThat(SecurityUtils.getCurrentUsername()).isEqualTo("john.doe");
        assertThat(SecurityUtils.getCurrentRoles()).contains("WORKFLOW_USER");
    }

    @Test
    @DisplayName("Missing access token leaves security context empty")
    void testMissingToken() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(SecurityUtils.getCurrentUserId()).isEmpty();
        verifyNoInteractions(ssoService);
    }

    @Test
    @DisplayName("Expired or invalid token rejected by SSO leaves security context empty")
    void testExpiredToken() throws Exception {
        when(ssoService.verifyToken("expired-token")).thenThrow(new UnauthorizedException("Token expired"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer expired-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(SecurityUtils.getCurrentUserId()).isEmpty();
    }

    @Test
    @DisplayName("Invalid verification response (valid=false) leaves security context empty")
    void testInvalidTokenResponse() throws Exception {
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(false).build();
        when(ssoService.verifyToken("invalid-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer invalid-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Inactive account status rejects authentication")
    void testInactiveAccountRejected() throws Exception {
        UserResponse user = buildActiveUser(UUID.randomUUID(), "inactive.user", null);
        user.setAccountStatus(AccountStatus.INACTIVE);
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("inactive-user-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer inactive-user-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Missing user identity in SSO response rejects authentication")
    void testMissingUserIdentityRejected() throws Exception {
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder()
                .valid(true)
                .user(UserResponse.builder().id(null).username("").build())
                .build();

        when(ssoService.verifyToken("no-user-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer no-user-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("Spoofed Gateway headers do NOT authenticate request when external token is absent")
    void testSpoofedGatewayHeadersIgnored() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("X-User-Id", UUID.randomUUID().toString());
        request.addHeader("X-Company-Id", UUID.randomUUID().toString());
        request.addHeader("X-Username", "admin");
        request.addHeader("X-Roles", "SYSTEM_ADMIN");

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        // Security context MUST be empty; spoofed headers are not trusted
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(ssoService);
    }

    @Test
    @DisplayName("Access token in cookie is extracted and verified")
    void testCookieAccessTokenExtracted() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse user = buildActiveUser(userId, "cookie.user", null);
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("cookie-jwt-value")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.setCookies(new Cookie("access_token", "cookie-jwt-value"));

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityUtils.getCurrentUserId()).contains(userId);
    }

    @Test
    @DisplayName("Public Swagger and Actuator endpoints bypass filter")
    void testPublicEndpointsBypassed() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/swagger-ui.html");
        assertThat(filter.shouldNotFilter(request)).isTrue();

        MockHttpServletRequest actuatorRequest = new MockHttpServletRequest("GET", "/actuator/health");
        assertThat(filter.shouldNotFilter(actuatorRequest)).isTrue();

        MockHttpServletRequest apiDocsRequest = new MockHttpServletRequest("GET", "/v3/api-docs/swagger-config");
        assertThat(filter.shouldNotFilter(apiDocsRequest)).isTrue();

        MockHttpServletRequest workflowRequest = new MockHttpServletRequest("GET", "/api/v1/workflow/tasks");
        assertThat(filter.shouldNotFilter(workflowRequest)).isFalse();
    }

    @Test
    @DisplayName("OWNER with organizationId and null companyId does not clobber companyId")
    void testOwnerPreservesOrganizationIdWithoutOverwritingCompanyId() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UserResponse user = buildActiveUser(userId, "owner.user", RoleResponse.builder().name("OWNER").status(true).build());
        user.setOrganizationId(orgId);
        user.setCompanyId(null);
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("owner-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer owner-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                assertThat(CurrentUserContext.getOrganizationId()).isEqualTo(orgId);
                assertThat(CurrentUserContext.getCompanyId()).isNull();
                assertThat(SecurityUtils.getCurrentOrganizationId()).contains(orgId);
                assertThat(SecurityUtils.getCurrentCompanyId()).isEmpty();
            }
        };

        filter.doFilter(request, response, chain);

        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        AuthenticatedUser principal = (AuthenticatedUser) auth.getPrincipal();
        assertThat(principal.getOrganizationId()).isEqualTo(orgId);
        assertThat(principal.getCompanyId()).isNull();
    }

    @Test
    @DisplayName("OWNER with organizationId resolves companyId from X-Company-Id header")
    void testOwnerResolvesCompanyIdFromHeader() throws Exception {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID selectedCompanyId = UUID.randomUUID();
        UserResponse user = buildActiveUser(userId, "owner.user", RoleResponse.builder().name("OWNER").status(true).build());
        user.setOrganizationId(orgId);
        user.setCompanyId(null);
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(user).build();

        when(ssoService.verifyToken("owner-token-with-header")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/v1/workflow/definitions/123/activate");
        request.addHeader("Authorization", "Bearer owner-token-with-header");
        request.addHeader("X-Company-Id", selectedCompanyId.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain() {
            @Override
            public void doFilter(jakarta.servlet.ServletRequest req, jakarta.servlet.ServletResponse res) {
                assertThat(CurrentUserContext.getOrganizationId()).isEqualTo(orgId);
                assertThat(CurrentUserContext.getCompanyId()).isEqualTo(selectedCompanyId);
                assertThat(SecurityUtils.getCurrentCompanyId()).contains(selectedCompanyId);
            }
        };

        filter.doFilter(request, response, chain);
    }
}
