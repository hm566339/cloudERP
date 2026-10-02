package com.erp.account.security;

import com.erp.account.security.authorization.AuthenticatedUser;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.account.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.service.SsoService;
import com.erp.account.modules.company.service.CompanyBootstrapService;
import com.erp.account.security.authorization.AuthenticatedUser;
import com.erp.account.security.authorization.SsoAuthorizationManager;
import com.erp.account.security.authorization.SsoAuthorizationProperties;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationFilterTest {

    @Mock
    private SsoService ssoService;

    private final TestCompanyBootstrapService companyBootstrapService = new TestCompanyBootstrapService();
    private AuthenticationFilter filter;

    @BeforeEach
    void initFilter() {
        filter = new AuthenticationFilter(companyBootstrapService, ssoService);
    }

    /**
     * Recording bootstrap that stands in for the Feign/JPA ensureCompanyByCode call.
     */
    static class TestCompanyBootstrapService implements CompanyBootstrapService {
        String lastCompanyCode;
        String lastToken;

        @Override
        public UUID ensureCompanyByCode(String companyCode, String bearerToken) {
            lastCompanyCode = companyCode;
            lastToken = bearerToken;
            return UUID.fromString("11111111-1111-1111-1111-111111111111");
        }

        @Override
        public UUID ensureCompanyById(UUID companyId, String bearerToken) {
            return companyId;
        }
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        CurrentUserContext.clear();
    }

    private TokenVerifyResponse verified(UserResponse user) {
        return TokenVerifyResponse.builder().valid(true).user(user).build();
    }

    private FeatureResponse feature(String code) {
        return FeatureResponse.builder().featureCode(code).build();
    }

    private UserResponse user(AccountStatus status, RoleResponse role,
                              List<FeatureResponse> features, List<PermissionResponse> permissions) {
        return UserResponse.builder()
                .id(UUID.fromString("c2c7e9f2-6c5a-4b0a-9c1d-1a2b3c4d5e6f"))
                .username("johndoe")
                .companyCode("ACME")
                .fullName("John Doe")
                .accountStatus(status)
                .role(role != null ? List.of(role) : List.of())
                .features(features)
                .permissions(permissions)
                .build();
    }

    private Authentication authenticate(TokenVerifyResponse verifyResponse, String token) throws Exception {
        when(ssoService.verifyToken(token)).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/account/customers");
        request.addHeader("Authorization", "Bearer " + token);
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, new MockHttpServletResponse(), chain);
        return SecurityContextHolder.getContext().getAuthentication();
    }

    // ── Valid SSO response → authorities + tenant resolution ───────────────

    @Test
    @DisplayName("Valid SSO response authenticates and stores authorities")
    void validResponseAuthenticates() throws Exception {
        PermissionResponse read = PermissionResponse.builder()
                .permissionCode("CUSTOMERS:READ")
                .action("READ")
                .moduleName("CUSTOMERS")
                .featureCode("CUSTOMER_MGMT")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("FINANCE_MANAGER").status(true).build(),
                List.of(feature("CUSTOMER_MGMT")),
                List.of(read));

        Authentication authentication = authenticate(verified(user), "abc-123");

        // Tenant isolation: SSO company code is provisioned for the non-admin user.
        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(companyBootstrapService.lastCompanyCode).isEqualTo("ACME");
        assertThat(companyBootstrapService.lastToken).isEqualTo("abc-123");
        assertThat(CurrentUserContext.getCompanyId()).isEqualTo(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        assertThat(CurrentUserContext.getUsername()).isEqualTo("johndoe");
        assertThat(CurrentUserContext.getUserRole()).isEqualTo("FINANCE_MANAGER");
        assertThat(authentication.getName()).isEqualTo("johndoe");

        // The principal carries the structured, verified SSO permissions.
        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(principal.getRoles()).containsExactly("FINANCE_MANAGER");
        assertThat(principal.getActiveFeatures()).contains("CUSTOMER_MGMT");
        assertThat(principal.getPermissions()).hasSize(1);
        assertThat(principal.hasPermission("CUSTOMERS", "READ")).isTrue();
        assertThat(principal.hasPermission("CUSTOMERS", "WRITE")).isFalse();

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("ROLE_FINANCE_MANAGER", "FEATURE_CUSTOMER_MGMT", "MODULE_CUSTOMERS_ACTION_READ");
    }

    @Test
    @DisplayName("Invalid or expired token leaves the security context empty")
    void invalidTokenLeavesContextEmpty() throws Exception {
        when(ssoService.verifyToken("expired-token"))
                .thenThrow(new UnauthorizedException("invalid token"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/account/customers");
        request.addHeader("Authorization", "Bearer expired-token");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(CurrentUserContext.getUserId()).isNull();
    }

    // ── Non-ACTIVE account ─────────────────────────────────────────────────

    @Test
    @DisplayName("Inactive account is never authenticated (fail closed)")
    void inactiveAccountNotAuthenticated() throws Exception {
        UserResponse user = user(AccountStatus.INACTIVE, null, List.of(), List.of());
        Authentication authentication = authenticate(verified(user), "inactive-token");

        assertThat(authentication).isNull();
        assertThat(CurrentUserContext.getUserId()).isNull();
    }

    @Test
    @DisplayName("Blocked account is never authenticated (fail closed)")
    void blockedAccountNotAuthenticated() throws Exception {
        UserResponse user = user(AccountStatus.BLOCKED, null, List.of(), List.of());
        Authentication authentication = authenticate(verified(user), "blocked-token");

        assertThat(authentication).isNull();
    }

    // ── Inactive / disallowed / missing permissions ────────────────────────

    @Test
    @DisplayName("Inactive permission is not converted to an authority")
    void inactivePermissionNotConverted() throws Exception {
        PermissionResponse perm = PermissionResponse.builder()
                .action("WRITE")
                .moduleName("CUSTOMERS")
                .active(false)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(), List.of(perm));

        Authentication authentication = authenticate(verified(user), "inactive-perm");

        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .doesNotContain("MODULE_CUSTOMERS_ACTION_WRITE");
    }

    @Test
    @DisplayName("Disallowed permission is not converted to an authority")
    void disallowedPermissionNotConverted() throws Exception {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("CUSTOMERS")
                .active(true)
                .allowed(false)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(), List.of(perm));

        Authentication authentication = authenticate(verified(user), "disallowed-perm");

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .doesNotContain("MODULE_CUSTOMERS_ACTION_DELETE");
    }

    @Test
    @DisplayName("Permissions delivered at the verify-response root are merged into the principal")
    void responseRootPermissionsMergedIntoPrincipal() throws Exception {
        PermissionResponse rootRead = PermissionResponse.builder()
                .permissionCode("DASHBOARD:READ")
                .action("READ")
                .moduleName("DASHBOARD")
                .featureCode("DASHBOARD")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("FINANCE_MANAGER").status(true).build(),
                List.of(), List.of());

        TokenVerifyResponse verify = verified(user);
        verify.setPermissions(List.of(rootRead));
        verify.setFeatures(List.of(feature("DASHBOARD")));

        when(ssoService.verifyToken("root-perms-token")).thenReturn(verify);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/account/customers");
        request.addHeader("Authorization", "Bearer root-perms-token");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();

        // Response-root features + permissions were merged in.
        assertThat(principal.getActiveFeatures()).contains("DASHBOARD");
        assertThat(principal.hasPermission("DASHBOARD", "READ")).isTrue();

        // And they were flattened to authorities too.
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("MODULE_DASHBOARD_ACTION_READ", "FEATURE_DASHBOARD");
    }

    @Test
    @DisplayName("Missing permission data leaves no module authorities at all")
    void missingPermissionsNoModuleAuthorities() throws Exception {
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(feature("PAYMENTS")), List.of());

        Authentication authentication = authenticate(verified(user), "no-perms");

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("FEATURE_PAYMENTS")
                .doesNotContain("MODULE_PAYMENTS_ACTION_READ");
        assertThat(authentication.getAuthorities())
                .extracting("authority", Object.class)
                .map(String::valueOf)
                .noneMatch(a -> a.startsWith("MODULE_") || a.startsWith("PERMISSION_"));
    }

    // ── SYSTEM_ADMIN tenant isolation ──────────────────────────────────────

    @Test
    @DisplayName("SYSTEM_ADMIN is authenticated with NO tenant resolution")
    void systemAdminSkipsTenantResolution() throws Exception {
        RoleResponse sysAdmin = RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build();
        UserResponse user = user(AccountStatus.ACTIVE, sysAdmin, List.of(), List.of());

        when(ssoService.verifyToken("sys-admin-token")).thenReturn(verified(user));

        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/account/something");
        request.addHeader("Authorization", "Bearer sys-admin-token");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("ROLE_SYSTEM_ADMIN");
        assertThat(CurrentUserContext.getCompanyId()).isNull();
        assertThat(CurrentUserContext.isSystemAdmin()).isTrue();
        assertThat(companyBootstrapService.lastCompanyCode).isNull();
        assertThat(companyBootstrapService.lastToken).isNull();
    }

    @Test
    @DisplayName("Inactive SYSTEM_ADMIN role never bypasses tenant rules")
    void inactiveSystemAdminRoleNotBypassing() throws Exception {
        RoleResponse sysAdminInactive = RoleResponse.builder().name("SYSTEM_ADMIN").status(false).build();
        UserResponse user = user(AccountStatus.ACTIVE, sysAdminInactive, List.of(), List.of());

        Authentication authentication = authenticate(verified(user), "inactive-admin");

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .doesNotContain("ROLE_SYSTEM_ADMIN");
        assertThat(CurrentUserContext.isSystemAdmin()).isFalse();
    }

    // ── End-to-end: SSO permission set → principal → authorization manager ──

    /**
     * Mirrors the exact permission set the SSO /verify response carries for a
     * FINANCE_MANAGER: DASHBOARD READ + CUSTOMERS READ/WRITE/DELETE, all
     * active=true, allowed=true, source=ROLE. This test proves the full chain:
     * the response is copied into the principal and the same {@code
     * SsoAuthorizationManager} wired into SecurityConfig decides from that
     * collection — with no role-based grant involved.
     */
    @Test
    @DisplayName("SSO permission set propagates into the principal and authorizes dashboard + customers endpoints")
    void ssoPermissionsPropagateAndAuthorizeDashboardAndCustomers() throws Exception {
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("FINANCE_MANAGER").status(true).build(),
                List.of(feature("DASHBOARD"), feature("CUSTOMERS")),
                List.of(ssoPermission("DASHBOARD", "READ", true, true),
                        ssoPermission("CUSTOMERS", "READ", true, true),
                        ssoPermission("CUSTOMERS", "WRITE", true, true),
                        ssoPermission("CUSTOMERS", "DELETE", true, true)));

        Authentication authentication = authenticate(verified(user), "sso-log-permissions");

        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(principal.getRoles()).containsExactly("FINANCE_MANAGER");

        // Complete SSO permission data is preserved on the principal.
        assertThat(principal.getPermissions()).hasSize(4);
        assertThat(principal.getPermissions())
                .extracting("permissionCode")
                .containsExactlyInAnyOrder("DASHBOARD:READ", "CUSTOMERS:READ", "CUSTOMERS:WRITE", "CUSTOMERS:DELETE");
        assertThat(principal.getPermissions())
                .allMatch(p -> "ROLE".equals(p.getSource()))
                .allMatch(p -> Boolean.TRUE.equals(p.getActive()))
                .allMatch(p -> Boolean.TRUE.equals(p.getAllowed()));

        // This is the log line that previously printed 0; now it must be positive.
        assertThat(principal.activeAndAllowedPermissionCount()).isEqualTo(4);

        // The manager reads the exact collection the filter just populated.
        SsoAuthorizationProperties props = new SsoAuthorizationProperties();
        props.setModules(Map.of(
                "CUSTOMERS", List.of("/api/account/customers", "/api/account/customers/**"),
                "DASHBOARD", List.of("/api/account/dashboard", "/api/account/dashboard/**")));
        SsoAuthorizationManager manager = new SsoAuthorizationManager(props);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, authentication.getAuthorities());

        // DASHBOARD + READ authorizes every dashboard GET endpoint.
        assertAuthorized(manager, auth, "GET", "/api/account/dashboard");
        assertAuthorized(manager, auth, "GET", "/api/account/dashboard/cards");
        assertAuthorized(manager, auth, "GET", "/api/account/dashboard/charts");
        assertAuthorized(manager, auth, "GET", "/api/account/dashboard/quick-actions");

        // CUSTOMERS + READ (and its WRITE/DELETE grants) authorize customer endpoints.
        assertAuthorized(manager, auth, "GET", "/api/account/customers");
        assertAuthorized(manager, auth, "GET", "/api/account/customers/123");
        assertAuthorized(manager, auth, "POST", "/api/account/customers");
        assertAuthorized(manager, auth, "DELETE", "/api/account/customers/123");

        // No permission for another module -> denied.
        assertDenied(manager, auth, "GET", "/api/account/purchase-orders");
    }

    private PermissionResponse ssoPermission(String module, String action, boolean active, boolean allowed) {
        return PermissionResponse.builder()
                .permissionCode(module + ":" + action)
                .action(action)
                .featureCode(module)
                .moduleName(module)
                .source("ROLE")
                .active(active)
                .allowed(allowed)
                .build();
    }

    private void assertAuthorized(SsoAuthorizationManager manager, UsernamePasswordAuthenticationToken auth,
                                  String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        AuthorizationDecision decision = manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
        assertThat(decision.isGranted()).as("%s %s should be allowed", method, uri).isTrue();
    }

    private void assertDenied(SsoAuthorizationManager manager, UsernamePasswordAuthenticationToken auth,
                              String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        AuthorizationDecision decision = manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
        assertThat(decision.isGranted()).as("%s %s should be denied", method, uri).isFalse();
    }
}