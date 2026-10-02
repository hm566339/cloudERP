package com.erp.inventory.common.security;

import com.erp.inventory.common.exception.UnauthorizedException;
import com.erp.inventory.common.security.authorization.AuthenticatedUser;
import com.erp.inventory.common.security.authorization.SsoAuthorizationManager;
import com.erp.inventory.common.security.authorization.SsoAuthorizationProperties;
import com.erp.inventory.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.inventory.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.inventory.modules.auth.service.SsoService;
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
class JwtAuthenticationFilterTest {

    @Mock
    private SsoService ssoService;

    private JwtAuthenticationFilter filter;

    @BeforeEach
    void initFilter() {
        filter = new JwtAuthenticationFilter(ssoService);
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
                .companyId(UUID.fromString("11111111-1111-1111-1111-111111111111"))
                .fullName("John Doe")
                .accountStatus(status)
                .role(role != null ? List.of(role) : List.of())
                .features(features)
                .permissions(permissions)
                .build();
    }

    private Authentication authenticate(TokenVerifyResponse verifyResponse, String token) throws Exception {
        when(ssoService.verifyToken(token)).thenReturn(verifyResponse);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/inventory/products");
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
                .permissionCode("PRODUCTS:READ")
                .action("READ")
                .moduleName("PRODUCTS")
                .featureCode("PRODUCT_MGMT")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build(),
                List.of(feature("PRODUCT_MGMT")),
                List.of(read));

        Authentication authentication = authenticate(verified(user), "abc-123");

        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(CurrentUserContext.getCompanyId()).isEqualTo(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        assertThat(authentication.getName()).isEqualTo("johndoe");

        // The principal carries the structured, verified SSO permissions.
        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(principal.getRoles()).containsExactly("INVENTORY_MANAGER");
        assertThat(principal.getActiveFeatures()).contains("PRODUCT_MGMT");
        assertThat(principal.getPermissions()).hasSize(1);
        assertThat(principal.hasPermission("PRODUCTS", "READ")).isTrue();
        assertThat(principal.hasPermission("PRODUCTS", "WRITE")).isFalse();

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("ROLE_INVENTORY_MANAGER", "FEATURE_PRODUCT_MGMT", "MODULE_PRODUCTS_ACTION_READ");
    }

    @Test
    @DisplayName("Invalid or expired token leaves the security context empty")
    void invalidTokenLeavesContextEmpty() throws Exception {
        when(ssoService.verifyToken("expired-token"))
                .thenThrow(new UnauthorizedException("invalid token"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/inventory/products");
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
                .moduleName("PRODUCTS")
                .active(false)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(), List.of(perm));

        Authentication authentication = authenticate(verified(user), "inactive-perm");

        assertThat(authentication.isAuthenticated()).isTrue();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .doesNotContain("MODULE_PRODUCTS_ACTION_WRITE");
    }

    @Test
    @DisplayName("Disallowed permission is not converted to an authority")
    void disallowedPermissionNotConverted() throws Exception {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("PRODUCTS")
                .active(true)
                .allowed(false)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(), List.of(perm));

        Authentication authentication = authenticate(verified(user), "disallowed-perm");

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .doesNotContain("MODULE_PRODUCTS_ACTION_DELETE");
    }

    @Test
    @DisplayName("Permissions delivered at the verify-response root are merged into the principal")
    void responseRootPermissionsMergedIntoPrincipal() throws Exception {
        PermissionResponse rootRead = PermissionResponse.builder()
                .permissionCode("STOCK:READ")
                .action("READ")
                .moduleName("STOCK")
                .featureCode("STOCK")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build(),
                List.of(), List.of());

        TokenVerifyResponse verify = verified(user);
        verify.setPermissions(List.of(rootRead));
        verify.setFeatures(List.of(feature("STOCK")));

        when(ssoService.verifyToken("root-perms-token")).thenReturn(verify);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/inventory/products");
        request.addHeader("Authorization", "Bearer root-perms-token");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();

        // Response-root features + permissions were merged in.
        assertThat(principal.getActiveFeatures()).contains("STOCK");
        assertThat(principal.hasPermission("STOCK", "READ")).isTrue();

        // And they were flattened to authorities too.
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("MODULE_STOCK_ACTION_READ", "FEATURE_STOCK");
    }

    @Test
    @DisplayName("Missing permission data leaves no module authorities at all")
    void missingPermissionsNoModuleAuthorities() throws Exception {
        UserResponse user = user(AccountStatus.ACTIVE, null, List.of(feature("STOCK")), List.of());

        Authentication authentication = authenticate(verified(user), "no-perms");

        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("FEATURE_STOCK")
                .doesNotContain("MODULE_STOCK_ACTION_READ");
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

        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/inventory/something");
        request.addHeader("Authorization", "Bearer sys-admin-token");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(authentication.getAuthorities())
                .extracting("authority")
                .contains("ROLE_SYSTEM_ADMIN");
        assertThat(CurrentUserContext.getCompanyId()).isNull();
        assertThat(CurrentUserContext.isSystemAdmin()).isTrue();
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

    @Test
    @DisplayName("SSO permission set propagates into the principal and authorizes endpoints")
    void ssoPermissionsPropagateAndAuthorize() throws Exception {
        UserResponse user = user(AccountStatus.ACTIVE,
                RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build(),
                List.of(feature("PRODUCTS"), feature("STOCK")),
                List.of(ssoPermission("PRODUCTS", "READ", true, true),
                        ssoPermission("STOCK", "READ", true, true),
                        ssoPermission("STOCK", "WRITE", true, true),
                        ssoPermission("STOCK", "DELETE", true, true)));

        Authentication authentication = authenticate(verified(user), "sso-log-permissions");

        assertThat(authentication.getPrincipal()).isInstanceOf(AuthenticatedUser.class);
        AuthenticatedUser principal = (AuthenticatedUser) authentication.getPrincipal();
        assertThat(principal.getRoles()).containsExactly("INVENTORY_MANAGER");

        // Complete SSO permission data is preserved on the principal.
        assertThat(principal.getPermissions()).hasSize(4);
        assertThat(principal.activeAndAllowedPermissionCount()).isEqualTo(4);

        // The manager reads the exact collection the filter just populated.
        SsoAuthorizationProperties props = new SsoAuthorizationProperties();
        props.setModules(Map.of(
                "PRODUCTS", List.of("/api/inventory/products", "/api/inventory/products/**"),
                "STOCK", List.of("/api/inventory/inventory-stocks", "/api/inventory/inventory-stocks/**")));
        SsoAuthorizationManager manager = new SsoAuthorizationManager(props);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, authentication.getAuthorities());

        assertAuthorized(manager, auth, "GET", "/api/inventory/products");
        assertAuthorized(manager, auth, "GET", "/api/inventory/products/123");
        assertAuthorized(manager, auth, "GET", "/api/inventory/inventory-stocks");
        assertAuthorized(manager, auth, "POST", "/api/inventory/inventory-stocks");
        assertAuthorized(manager, auth, "DELETE", "/api/inventory/inventory-stocks/123");

        // No permission for another module -> denied.
        assertDenied(manager, auth, "GET", "/api/inventory/warehouses");
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