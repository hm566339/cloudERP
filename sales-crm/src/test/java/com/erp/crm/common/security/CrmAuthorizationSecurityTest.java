package com.erp.crm.common.security;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.common.exception.GlobalExceptionHandler;
import com.erp.crm.common.security.authorization.AuthenticatedUser;
import com.erp.crm.common.security.authorization.SsoAuthorizationManager;
import com.erp.crm.common.security.authorization.SsoAuthorizationProperties;
import com.erp.crm.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.crm.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.UserResponse;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CrmAuthorizationSecurityTest {

    private SsoAuthorizationManager authorizationManager;
    private SsoAuthorizationProperties properties;
    private GlobalExceptionHandler exceptionHandler;
    private JwtAuthenticationEntryPoint entryPoint;
    private CustomAccessDeniedHandler accessDeniedHandler;

    private final UUID testCompanyId = UUID.randomUUID();
    private final UUID testUserId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        Map<String, List<String>> modules = new LinkedHashMap<>();
        modules.put("CRM_INTEGRATIONS", List.of("/api/crm/integrations", "/api/crm/integrations/**"));
        modules.put("CRM_AUTOMATION", List.of("/api/crm/automation", "/api/crm/automation/**"));
        modules.put("CRM_LEADS", List.of("/api/crm/leads", "/api/crm/leads/**"));
        modules.put("CRM_ACCOUNTS", List.of("/api/crm/accounts", "/api/crm/accounts/**"));
        modules.put("CRM_DASHBOARD", List.of("/api/crm/dashboard", "/api/crm/dashboard/**"));
        properties.setModules(modules);

        Map<String, String> suffixes = new LinkedHashMap<>();
        suffixes.put("/sync", "EXECUTE");
        properties.setCustomActionSuffixes(suffixes);

        authorizationManager = new SsoAuthorizationManager(properties);
        exceptionHandler = new GlobalExceptionHandler();
        entryPoint = new JwtAuthenticationEntryPoint();
        accessDeniedHandler = new CustomAccessDeniedHandler();

        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    private AuthenticatedUser buildAuthenticatedUser(String role, List<PermissionResponse> permissions, UUID companyId) {
        UserResponse user = UserResponse.builder()
                .id(testUserId)
                .username("test-user")
                .companyCode(companyId != null ? "TEST-CO" : null)
                .companyId(companyId)
                .accountStatus(AccountStatus.ACTIVE)
                .role(List.of(RoleResponse.builder().name(role).status(true).build()))
                .permissions(permissions)
                .build();

        TokenVerifyResponse verify = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .permissions(permissions)
                .build();

        return AuthenticatedUser.from(verify);
    }

    private RequestAuthorizationContext buildContext(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setDispatcherType(DispatcherType.REQUEST);
        return new RequestAuthorizationContext(request);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 1: Valid token + CRM module access -> 200 (Decision: TRUE)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 1: Valid token + CRM module access (CRM:READ) grants access to /integrations, /available, /round-robin-pools")
    void testValidToken_WithCrmModuleAccess_GrantsAccess() {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM:READ")
                        .moduleName("CRM")
                        .featureCode("CRM")
                        .action("READ")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user = buildAuthenticatedUser("OWNER", permissions, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);
        CurrentUserContext.setUserRole("OWNER");

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"), new SimpleGrantedAuthority("MODULE_CRM_ACTION_READ")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Test /api/crm/integrations
        AuthorizationDecision d1 = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertTrue(d1.isGranted(), "CRM:READ should grant access to /api/crm/integrations");

        // Test /api/crm/integrations/available
        AuthorizationDecision d2 = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations/available"));
        assertTrue(d2.isGranted(), "CRM:READ should grant access to /api/crm/integrations/available");

        // Test /api/crm/automation/round-robin-pools
        AuthorizationDecision d3 = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/automation/round-robin-pools"));
        assertTrue(d3.isGranted(), "CRM:READ should grant access to /api/crm/automation/round-robin-pools");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 2: Valid token + specific feature permission -> 200 (Decision: TRUE)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 2: Valid token + specific feature permission (CRM_INTEGRATIONS:READ) grants access to /integrations")
    void testValidToken_WithFeaturePermission_GrantsAccess() {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM_INTEGRATIONS:READ")
                        .moduleName("CRM")
                        .featureCode("CRM_INTEGRATIONS")
                        .action("READ")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user = buildAuthenticatedUser("SALES_REP", permissions, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("FEATURE_CRM_INTEGRATIONS_ACTION_READ")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertTrue(decision.isGranted(), "CRM_INTEGRATIONS:READ should grant access to /api/crm/integrations");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 3: Valid token + Execute action -> 200 (Decision: TRUE)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 3: Valid token + CRM_INTEGRATIONS:EXECUTE grants access to /sync endpoint")
    void testValidToken_WithExecutePermission_GrantsSyncAccess() {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM_INTEGRATIONS:EXECUTE")
                        .moduleName("CRM")
                        .featureCode("CRM_INTEGRATIONS")
                        .action("EXECUTE")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user = buildAuthenticatedUser("OWNER", permissions, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("FEATURE_CRM_INTEGRATIONS_ACTION_EXECUTE")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth,
                buildContext("POST", "/api/crm/integrations/" + UUID.randomUUID() + "/sync"));
        assertTrue(decision.isGranted(), "CRM_INTEGRATIONS:EXECUTE should grant access to /sync");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 4: Missing token -> 401 Unauthorized
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 4: Missing token produces 401 Unauthorized via JwtAuthenticationEntryPoint")
    void testMissingToken_Returns401Unauthorized() throws Exception {
        AuthorizationDecision decision = authorizationManager.authorize(() -> null, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "Unauthenticated request must be denied by AuthorizationManager");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/crm/integrations");
        MockHttpServletResponse response = new MockHttpServletResponse();
        entryPoint.commence(request, response, new org.springframework.security.authentication.InsufficientAuthenticationException("Full authentication is required"));

        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatus(), "Missing token must produce HTTP 401");
        assertTrue(response.getContentAsString().contains("Unauthorized"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 5: Invalid or expired token -> 401 Unauthorized
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 5: Invalid or expired token leaves SecurityContext empty, producing 401 Unauthorized")
    void testInvalidOrExpiredToken_Returns401Unauthorized() throws Exception {
        // When token verification fails, SecurityContext remains unauthenticated
        Authentication unauthenticatedAuth = new UsernamePasswordAuthenticationToken("anonymousUser", null);
        AuthorizationDecision decision = authorizationManager.authorize(() -> unauthenticatedAuth, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "Unauthenticated/anonymous principal must be denied");

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/crm/integrations");
        MockHttpServletResponse response = new MockHttpServletResponse();
        entryPoint.commence(request, response, new org.springframework.security.authentication.BadCredentialsException("Token invalid or expired"));

        assertEquals(HttpStatus.UNAUTHORIZED.value(), response.getStatus(), "Invalid token must produce HTTP 401");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 6: Valid token + no CRM access -> 403 Forbidden
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 6: Valid token + no CRM access (ACCOUNT:READ only) produces 403 Forbidden")
    void testValidToken_NoCrmAccess_Returns403Forbidden() throws Exception {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("ACCOUNT:READ")
                        .moduleName("ACCOUNT")
                        .featureCode("ACCOUNT")
                        .action("READ")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user = buildAuthenticatedUser("USER", permissions, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("MODULE_ACCOUNT_ACTION_READ")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "User with ACCOUNT:READ only must NOT have access to CRM integrations");

        // Authenticated user being denied triggers AccessDeniedHandler -> 403
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/crm/integrations");
        MockHttpServletResponse response = new MockHttpServletResponse();
        accessDeniedHandler.handle(request, response, new AccessDeniedException("Access Denied"));

        assertEquals(HttpStatus.FORBIDDEN.value(), response.getStatus(), "Lacking CRM access must produce HTTP 403");
        assertTrue(response.getContentAsString().contains("Forbidden"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 7: Valid token + no company access -> 403 Forbidden
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 7: Valid token + no company membership produces 403 Forbidden")
    void testValidToken_NoCompanyAccess_Returns403Forbidden() throws Exception {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM:READ")
                        .moduleName("CRM")
                        .featureCode("CRM")
                        .action("READ")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        // User without company context
        AuthenticatedUser user = buildAuthenticatedUser("USER", permissions, null);
        CurrentUserContext.clearCompanyId();
        CurrentUserContext.setUserId(testUserId);

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("MODULE_CRM_ACTION_READ")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "User without company membership must be denied CRM access");

        // Cross-tenant access check in CurrentUserContext
        CurrentUserContext.setCompanyId(testCompanyId);
        UUID foreignCompanyId = UUID.randomUUID();
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            CurrentUserContext.resolveCompanyId(foreignCompanyId);
        });

        ResponseEntity<ApiResponse<Object>> response = exceptionHandler.handleAccessDeniedException(ex);
        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode(), "Cross-tenant access must return HTTP 403 Forbidden");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 8: Valid token + missing feature permission -> 403 Forbidden
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 8: Valid token + missing feature permission (CRM_LEADS:READ for /integrations) produces 403 Forbidden")
    void testValidToken_MissingFeaturePermission_Returns403Forbidden() {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM_LEADS:READ")
                        .moduleName("CRM")
                        .featureCode("CRM_LEADS")
                        .action("READ")
                        .active(true)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user = buildAuthenticatedUser("SALES_REP", permissions, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("FEATURE_CRM_LEADS_ACTION_READ")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "User with CRM_LEADS:READ must NOT have access to CRM_INTEGRATIONS");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 9: Valid token + permission allowed=false or active=false -> 403
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 9: Valid token + permission allowed=false or active=false produces 403 Forbidden")
    void testValidToken_PermissionAllowedOrActiveFalse_Returns403Forbidden() {
        // Disallowed permission
        List<PermissionResponse> disallowedPerms = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM_INTEGRATIONS:READ")
                        .moduleName("CRM")
                        .featureCode("CRM_INTEGRATIONS")
                        .action("READ")
                        .active(true)
                        .allowed(false)
                        .build()
        );

        AuthenticatedUser user1 = buildAuthenticatedUser("USER", disallowedPerms, testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);

        Authentication auth1 = new UsernamePasswordAuthenticationToken(user1, "token", List.of());
        SecurityContextHolder.getContext().setAuthentication(auth1);

        AuthorizationDecision d1 = authorizationManager.authorize(() -> auth1, buildContext("GET", "/api/crm/integrations"));
        assertFalse(d1.isGranted(), "Permission with allowed=false must be denied");

        // Inactive permission
        List<PermissionResponse> inactivePerms = List.of(
                PermissionResponse.builder()
                        .permissionCode("CRM_INTEGRATIONS:READ")
                        .moduleName("CRM")
                        .featureCode("CRM_INTEGRATIONS")
                        .action("READ")
                        .active(false)
                        .allowed(true)
                        .build()
        );

        AuthenticatedUser user2 = buildAuthenticatedUser("USER", inactivePerms, testCompanyId);
        Authentication auth2 = new UsernamePasswordAuthenticationToken(user2, "token", List.of());
        SecurityContextHolder.getContext().setAuthentication(auth2);

        AuthorizationDecision d2 = authorizationManager.authorize(() -> auth2, buildContext("GET", "/api/crm/integrations"));
        assertFalse(d2.isGranted(), "Permission with active=false must be denied");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 10: OWNER role does NOT bypass permission check
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Scenario 10: OWNER role does not automatically bypass permission checks when CRM permissions are absent")
    void testOwnerRole_DoesNotBypassPermissionCheck() {
        // OWNER with no CRM permissions
        AuthenticatedUser user = buildAuthenticatedUser("OWNER", List.of(), testCompanyId);
        CurrentUserContext.setCompanyId(testCompanyId);
        CurrentUserContext.setUserId(testUserId);
        CurrentUserContext.setUserRole("OWNER");

        Authentication auth = new UsernamePasswordAuthenticationToken(user, "token",
                List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        AuthorizationDecision decision = authorizationManager.authorize(() -> auth, buildContext("GET", "/api/crm/integrations"));
        assertFalse(decision.isGranted(), "OWNER role without CRM permissions must be denied access (no automatic bypass)");
    }
}
