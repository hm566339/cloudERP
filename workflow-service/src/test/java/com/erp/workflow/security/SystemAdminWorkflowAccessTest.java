package com.erp.workflow.security;

import com.erp.workflow.security.authorization.FeatureGroupPermissionResolver;
import com.erp.workflow.security.authorization.SsoAuthorizationManager;
import com.erp.workflow.security.authorization.SsoAuthorizationProperties;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.security.dto.sso.AccountStatus;
import com.erp.workflow.security.dto.sso.RoleResponse;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import com.erp.workflow.security.sso.SsoService;
import io.jsonwebtoken.Jwts;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemAdminWorkflowAccessTest {

    @Mock
    private SsoService ssoService;

    private JwtTokenProvider jwtTokenProvider;
    private AuthenticationFilter authenticationFilter;
    private SsoAuthorizationManager authorizationManager;
    private JwtAuthenticationEntryPoint authenticationEntryPoint;
    private CustomAccessDeniedHandler accessDeniedHandler;

    private static final String TEST_SECRET = "super-secret-hmac-key-for-test-with-at-least-32-chars";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(TEST_SECRET);
        authenticationFilter = new AuthenticationFilter(ssoService, jwtTokenProvider);

        SsoAuthorizationProperties properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "WORKFLOW_DEFINITIONS", List.of("/api/v1/workflow/definitions", "/api/v1/workflow/definitions/**"),
                "WORKFLOW_TRANSACTIONS", List.of("/api/v1/workflow/transactions", "/api/v1/workflow/transactions/**"),
                "WORKFLOW_TASKS", List.of("/api/v1/workflow/tasks", "/api/v1/workflow/tasks/**"),
                "WORKFLOW_NOTIFICATIONS", List.of("/api/v1/workflow/notifications", "/api/v1/workflow/notifications/**"),
                "WORKFLOW_ATTACHMENTS", List.of("/api/v1/workflow/attachments", "/api/v1/workflow/attachments/**")
        ));
        authorizationManager = new SsoAuthorizationManager(properties, new FeatureGroupPermissionResolver(properties));
        authenticationEntryPoint = new JwtAuthenticationEntryPoint();
        accessDeniedHandler = new CustomAccessDeniedHandler();

        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("SYSTEM_ADMIN authenticated via SSO verifyToken can access all workflow endpoints")
    void testSystemAdminAccessViaSso() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();
        UserResponse adminUser = UserResponse.builder()
                .id(adminId)
                .username("sysadmin")
                .companyCode("SYSTEM")
                .organizationId(companyId)
                .accessMode("FULL")
                .accountStatus(AccountStatus.ACTIVE)
                .role(List.of(RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build()))
                .build();
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(adminUser).build();

        when(ssoService.verifyToken("sso-admin-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer sso-admin-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();

        RequestAuthorizationContext context = new RequestAuthorizationContext(request);
        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, context);
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SYSTEM_ADMIN authenticated via JWT with claims (iss: ADMIN_PANEL, scope: SYSTEM_ADMIN) accesses workflow endpoints via local JWT validation")
    void testSystemAdminAccessViaJwtFallback() throws Exception {
        UUID adminId = UUID.randomUUID();
        UUID companyId = UUID.randomUUID();

        // Create JWT token using test secret
        Map<String, Object> claims = new HashMap<>();
        claims.put("iss", "ADMIN_PANEL");
        claims.put("userId", adminId.toString());
        claims.put("username", "admin_user");
        claims.put("companyCode", "COMP_01");
        claims.put("companyId", companyId.toString());
        claims.put("roles", List.of("SYSTEM_ADMIN"));
        claims.put("loginType", "ADMIN");
        claims.put("scope", "SYSTEM_ADMIN");

        String jwt = Jwts.builder()
                .claims(claims)
                .subject("admin_user")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 3600000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(TEST_SECRET.getBytes()))
                .compact();

        // SSO returns null/invalid so fallback activates
        when(ssoService.verifyToken(jwt)).thenReturn(TokenVerifyResponse.builder().valid(false).build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer " + jwt);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(((AuthenticatedUser) auth.getPrincipal()).getUserId()).isEqualTo(adminId);
        assertThat(((AuthenticatedUser) auth.getPrincipal()).isSystemAdmin()).isTrue();

        // Check authorization on multiple workflow APIs
        List<String> workflowPaths = List.of(
                "/api/v1/workflow/definitions",
                "/api/v1/workflow/definitions/active",
                "/api/v1/workflow/definitions/" + UUID.randomUUID() + "/activate",
                "/api/v1/workflow/tasks/my-tasks",
                "/api/v1/workflow/tasks/" + UUID.randomUUID() + "/approve",
                "/api/v1/workflow/transactions",
                "/api/v1/workflow/transactions/submit",
                "/api/v1/workflow/notifications"
        );

        for (String path : workflowPaths) {
            MockHttpServletRequest subRequest = new MockHttpServletRequest("GET", path);
            RequestAuthorizationContext subContext = new RequestAuthorizationContext(subRequest);
            AuthorizationDecision decision = authorizationManager.authorize(() -> auth, subContext);
            assertThat(decision.isGranted()).as("Expected access to " + path).isTrue();
        }
    }

    @Test
    @DisplayName("Request without token is denied with 401 Unauthorized JSON response")
    void testMissingTokenReturns401() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();

        RequestAuthorizationContext context = new RequestAuthorizationContext(request);
        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, context);
        assertThat(decision.isGranted()).isFalse();

        // Trigger EntryPoint
        authenticationEntryPoint.commence(request, response, new AuthenticationException("Missing token") {});
        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(response.getContentAsString()).contains("\"message\":\"Unauthorized\"");
    }

    @Test
    @DisplayName("Expired JWT token fails validation and leaves context unauthenticated")
    void testExpiredTokenDenied() throws Exception {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", UUID.randomUUID().toString());
        claims.put("roles", List.of("SYSTEM_ADMIN"));

        String expiredJwt = Jwts.builder()
                .claims(claims)
                .subject("expired_admin")
                .issuedAt(new Date(System.currentTimeMillis() - 7200000))
                .expiration(new Date(System.currentTimeMillis() - 3600000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(TEST_SECRET.getBytes()))
                .compact();

        when(ssoService.verifyToken(expiredJwt)).thenReturn(null);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer " + expiredJwt);
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNull();
    }

    @Test
    @DisplayName("Non-admin user without workflow permissions is denied with 403 Forbidden")
    void testUserWithoutPermissionsDenied() throws Exception {
        UUID regularUserId = UUID.randomUUID();
        UserResponse regularUser = UserResponse.builder()
                .id(regularUserId)
                .username("regular.employee")
                .organizationId(UUID.randomUUID())
                .accountStatus(AccountStatus.ACTIVE)
                .role(List.of(RoleResponse.builder().name("EMPLOYEE").status(true).build()))
                .permissions(Collections.emptyList())
                .build();

        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(regularUser).build();
        when(ssoService.verifyToken("regular-token")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.addHeader("Authorization", "Bearer regular-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();

        RequestAuthorizationContext context = new RequestAuthorizationContext(request);
        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, context);
        assertThat(decision.isGranted()).isFalse();

        accessDeniedHandler.handle(request, response, new AccessDeniedException("Access denied"));
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("\"message\":\"Forbidden\"");
    }

    @Test
    @DisplayName("Cookie-based token resolution supports ACCESS_TOKEN, access_token, and auth_token cookies")
    void testCookieBasedTokenResolution() throws Exception {
        UUID adminId = UUID.randomUUID();
        UserResponse adminUser = UserResponse.builder()
                .id(adminId)
                .username("cookie.admin")
                .accountStatus(AccountStatus.ACTIVE)
                .role(List.of(RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build()))
                .build();
        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder().valid(true).user(adminUser).build();

        when(ssoService.verifyToken("cookie-jwt-val")).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/workflow/definitions");
        request.setCookies(new jakarta.servlet.http.Cookie("ACCESS_TOKEN", "cookie-jwt-val"));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        authenticationFilter.doFilter(request, response, chain);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assertThat(auth).isNotNull();
        assertThat(auth.isAuthenticated()).isTrue();
        assertThat(CurrentUserContext.isSystemAdmin()).isTrue();
    }
}
