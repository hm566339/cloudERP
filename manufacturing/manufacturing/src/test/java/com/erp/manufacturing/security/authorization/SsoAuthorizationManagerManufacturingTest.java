package com.erp.manufacturing.security.authorization;

import com.erp.manufacturing.security.dto.sso.AccountStatus;
import com.erp.manufacturing.security.dto.sso.PermissionResponse;
import com.erp.manufacturing.security.dto.sso.RoleResponse;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import com.erp.manufacturing.security.dto.sso.UserResponse;
import com.erp.manufacturing.util.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Supplier;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SsoAuthorizationManagerManufacturingTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager authorizationManager;

    @BeforeEach
    void setUp() {
        CurrentUserContext.clear();

        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "MANUFACTURING", List.of(
                        "/api/manufacturing",
                        "/api/manufacturing/**",
                        "/api/boms",
                        "/api/boms/**"
                )
        ));

        FeatureGroupPermissionResolver groupResolver = new FeatureGroupPermissionResolver(properties);
        authorizationManager = new SsoAuthorizationManager(properties, groupResolver);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    private RequestAuthorizationContext createContext(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return new RequestAuthorizationContext(request);
    }

    private Supplier<Authentication> authSupplier(Authentication auth) {
        return () -> auth;
    }

    private AuthenticatedUser buildAuthenticatedUser(String role, List<PermissionResponse> permissions) {
        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .companyId(UUID.randomUUID())
                .accountStatus(AccountStatus.ACTIVE)
                .role(role != null ? List.of(RoleResponse.builder().name(role).status(true).build()) : List.of())
                .permissions(permissions)
                .build();

        TokenVerifyResponse verify = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .permissions(permissions)
                .build();

        return AuthenticatedUser.from(verify);
    }

    @Test
    @DisplayName("Unauthenticated request is denied")
    void testAuthorize_Unauthenticated_Denied() {
        RequestAuthorizationContext context = createContext("GET", "/api/manufacturing/production-orders");
        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(null), context);
        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("SYSTEM_ADMIN bypasses module permission checks")
    void testAuthorize_SystemAdmin_Allowed() {
        RequestAuthorizationContext context = createContext("POST", "/api/manufacturing/production-orders/123/approve");

        AuthenticatedUser adminUser = buildAuthenticatedUser("SYSTEM_ADMIN", List.of());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminUser, "token", List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("BLOCKED access mode is denied on all endpoints")
    void testAuthorize_BlockedAccessMode_Denied() {
        CurrentUserContext.setAccessMode("BLOCKED");

        RequestAuthorizationContext context = createContext("GET", "/api/manufacturing/production-orders");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", "token", List.of(new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_READ")));

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("READ_ONLY access mode allows GET but denies POST mutation")
    void testAuthorize_ReadOnlyAccessMode_AllowsGetDeniesPost() {
        CurrentUserContext.setAccessMode("READ_ONLY");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", "token", List.of(
                new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_READ"),
                new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_CREATE")
        ));

        // GET allowed
        RequestAuthorizationContext getContext = createContext("GET", "/api/manufacturing/production-orders");
        AuthorizationDecision getDecision = authorizationManager.authorize(authSupplier(auth), getContext);
        assertTrue(getDecision.isGranted());

        // POST denied
        RequestAuthorizationContext postContext = createContext("POST", "/api/manufacturing/production-orders");
        AuthorizationDecision postDecision = authorizationManager.authorize(authSupplier(auth), postContext);
        assertFalse(postDecision.isGranted());
    }

    @Test
    @DisplayName("Unmapped route fails closed")
    void testAuthorize_UnmappedRoute_FailsClosed() {
        RequestAuthorizationContext context = createContext("GET", "/api/unmapped/unknown");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user", "token", List.of(new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_READ")));

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("GET endpoint granted with READ permission")
    void testAuthorize_GetWithReadPermission_Allowed() {
        RequestAuthorizationContext context = createContext("GET", "/api/manufacturing/production-orders");

        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("MANUFACTURING")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildAuthenticatedUser("USER", List.of(perm));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, "token", SsoAuthorities.from(TokenVerifyResponse.builder().user(UserResponse.builder().id(user.getUserId()).username(user.getUsername()).permissions(List.of(perm)).build()).permissions(List.of(perm)).build()));

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertTrue(decision.isGranted());
    }

    @Test
    @DisplayName("GET endpoint denied when permission lacks READ action")
    void testAuthorize_GetWithoutReadPermission_Denied() {
        RequestAuthorizationContext context = createContext("GET", "/api/manufacturing/production-orders");

        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("MANUFACTURING")
                .action("CREATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser user = buildAuthenticatedUser("USER", List.of(perm));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, "token", List.of(new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_CREATE")));

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("Inactive or disallowed permission is rejected (fail closed)")
    void testAuthorize_InactivePermission_Denied() {
        RequestAuthorizationContext context = createContext("GET", "/api/manufacturing/production-orders");

        PermissionResponse inactivePerm = PermissionResponse.builder()
                .moduleName("MANUFACTURING")
                .action("READ")
                .active(false) // Inactive!
                .allowed(true)
                .build();
        AuthenticatedUser user = buildAuthenticatedUser("USER", List.of(inactivePerm));

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, "token", List.of());

        AuthorizationDecision decision = authorizationManager.authorize(authSupplier(auth), context);
        assertFalse(decision.isGranted());
    }

    @Test
    @DisplayName("Custom action suffix /approve requires APPROVE action")
    void testAuthorize_ApproveSuffix_RequiresApproveAction() {
        RequestAuthorizationContext context = createContext("POST", "/api/manufacturing/production-orders/123/approve");

        PermissionResponse approvePerm = PermissionResponse.builder()
                .moduleName("MANUFACTURING")
                .action("APPROVE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser userWithApprove = buildAuthenticatedUser("USER", List.of(approvePerm));

        UsernamePasswordAuthenticationToken authApproved = new UsernamePasswordAuthenticationToken(
                userWithApprove, "token", List.of(new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_APPROVE")));

        AuthorizationDecision granted = authorizationManager.authorize(authSupplier(authApproved), context);
        assertTrue(granted.isGranted());

        // Without APPROVE (e.g. only CREATE) -> Denied
        PermissionResponse createPerm = PermissionResponse.builder()
                .moduleName("MANUFACTURING")
                .action("CREATE")
                .active(true)
                .allowed(true)
                .build();
        AuthenticatedUser userWithCreate = buildAuthenticatedUser("USER", List.of(createPerm));
        UsernamePasswordAuthenticationToken authCreate = new UsernamePasswordAuthenticationToken(
                userWithCreate, "token", List.of(new SimpleGrantedAuthority("MODULE_MANUFACTURING_ACTION_CREATE")));

        AuthorizationDecision denied = authorizationManager.authorize(authSupplier(authCreate), context);
        assertFalse(denied.isGranted());
    }
}
