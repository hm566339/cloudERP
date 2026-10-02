package com.erp.inventory.common.security.authorization;

import com.erp.inventory.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.inventory.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import com.erp.inventory.common.security.CurrentUserContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Inventory-specific end-to-end checks: the full SSO -> principal -> manager chain,
 * the HTTP method -> action mapping (including PUT/PATCH -> UPDATE), the custom action
 * suffixes (/approve, /reject, /cancel, /export, /verify) and fail-closed behavior.
 */
class SsoAuthorizationManagerInventoryTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    private static final Map<String, List<String>> INVENTORY_MODULES = Map.ofEntries(
            Map.entry("PRODUCTS", List.of("/api/inventory/products/**")),
            Map.entry("STOCK", List.of("/api/inventory/inventory-stocks/**")),
            Map.entry("STOCK_ADJUSTMENTS", List.of("/api/inventory/stock-adjustments/**")),
            Map.entry("INVENTORY_REPORTS", List.of("/api/inventory/reports/**")),
            Map.entry("WAREHOUSES", List.of("/api/inventory/warehouses/**")));

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(INVENTORY_MODULES);
        manager = new SsoAuthorizationManager(properties);
    }

    // ── Full chain: SSO verify response -> principal -> manager ────────────

    private static class Chain {
        final AuthenticatedUser principal;
        final UsernamePasswordAuthenticationToken auth;

        Chain(AuthenticatedUser principal, UsernamePasswordAuthenticationToken auth) {
            this.principal = principal;
            this.auth = auth;
        }
    }

    /**
     * Requirement 14: features and permissions delivered by the SSO /token/verify
     * response (on the user object) reach the final authorization manager
     * unchanged through the AuthenticatedUser principal.
     */
    private Chain chainFromVerifyResponse(UserResponse user, PermissionResponse... responseRootPermissions) {
        TokenVerifyResponse verify = TokenVerifyResponse.builder().valid(true).user(user).build();
        if (responseRootPermissions != null && responseRootPermissions.length > 0) {
            verify.setPermissions(List.of(responseRootPermissions));
        }
        AuthenticatedUser principal = AuthenticatedUser.from(verify);
        var authorities = SsoAuthorities.from(verify);
        return new Chain(principal, new UsernamePasswordAuthenticationToken(principal, null, authorities));
    }

    private AuthorizationDecision decide(Chain chain, String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> chain.auth, new RequestAuthorizationContext(request, null));
    }

    private UserResponse activeUser(String username, RoleResponse role,
                                    List<FeatureResponse> features, List<PermissionResponse> permissions) {
        return UserResponse.builder()
                .id(UUID.randomUUID())
                .username(username)
                .companyCode("ACME")
                .companyId(UUID.randomUUID())
                .accountStatus(AccountStatus.ACTIVE)
                .role(role != null ? List.of(role) : List.of())
                .features(features)
                .permissions(permissions)
                .build();
    }

    private PermissionResponse activePerm(String module, String action) {
        return PermissionResponse.builder()
                .permissionCode(module + ":" + action)
                .action(action)
                .moduleName(module)
                .featureCode(module)
                .active(true)
                .allowed(true)
                .build();
    }

    private FeatureResponse feature(String code) {
        return FeatureResponse.builder().featureCode(code).build();
    }

    // ── Tests 1-5: valid / missing / inactive / disallowed / null ──────────

    @Test
    @DisplayName("1. Valid active+allowed SSO permission -> ALLOW")
    void validSsoPermissionAllows() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain chain = chainFromVerifyResponse(
                activeUser("johndoe", role, List.of(feature("PRODUCTS")), List.of(activePerm("PRODUCTS", "READ"))));

        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
    }

    @Test
    @DisplayName("2. Missing permission -> DENY")
    void missingPermissionDenies() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain chain = chainFromVerifyResponse(
                activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));

        assertThat(decide(chain, "DELETE", "/api/inventory/products/123")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("3. active=false -> DENY")
    void inactivePermissionDenies() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        PermissionResponse perm = activePerm("PRODUCTS", "READ");
        perm.setActive(false);
        Chain chain = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(perm)));

        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("4. allowed=false -> DENY")
    void disallowedPermissionDenies() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        PermissionResponse perm = activePerm("PRODUCTS", "READ");
        perm.setAllowed(false);
        Chain chain = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(perm)));

        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("5. Null active or allowed -> DENY")
    void nullFlagsDeny() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        PermissionResponse perm = PermissionResponse.builder()
                .permissionCode("PRODUCTS:READ").action("READ").moduleName("PRODUCTS")
                .active(null).allowed(null).build();
        Chain chain = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(perm)));

        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    // ── Test 6: role alone ─────────────────────────────────────────────────

    @Test
    @DisplayName("6. Role alone must NOT grant access (no local role grants)")
    void roleAloneDenies() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain chain = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of()));

        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
        assertThat(decide(chain, "GET", "/api/inventory/inventory-stocks")).matches(d -> !d.isGranted());
    }

    // ── Tests 7-8: SYSTEM_ADMIN ────────────────────────────────────────────

    @Test
    @DisplayName("7. Active SYSTEM_ADMIN bypasses module checks")
    void activeSystemAdminBypasses() {
        RoleResponse role = RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build();
        Chain chain = chainFromVerifyResponse(activeUser("admin", role, List.of(), List.of()));

        assertThat(decide(chain, "DELETE", "/api/inventory/anything-unmapped")).matches(AuthorizationDecision::isGranted);
    }

    @Test
    @DisplayName("8. Inactive SYSTEM_ADMIN -> DENY")
    void inactiveSystemAdminDenies() {
        RoleResponse role = RoleResponse.builder().name("SYSTEM_ADMIN").status(false).build();
        Chain chain = chainFromVerifyResponse(activeUser("admin", role, List.of(), List.of()));

        assertThat(chain.principal.isSystemAdmin()).isFalse();
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    // ── Tests 9-12: HTTP method mapping ────────────────────────────────────

    @Test
    @DisplayName("9. GET -> READ")
    void getMapsToRead() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withRead = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));

        assertThat(decide(withRead, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);

        Chain withoutRead = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "CREATE"))));
        assertThat(decide(withoutRead, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("10. POST -> CREATE (or WRITE)")
    void postMapsToCreate() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withCreate = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "CREATE"))));
        Chain withWrite = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "WRITE"))));

        assertThat(decide(withCreate, "POST", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withWrite, "POST", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);

        Chain withoutCreate = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));
        assertThat(decide(withoutCreate, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("11. PUT and PATCH -> UPDATE")
    void putAndPatchMapToUpdate() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withUpdate = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "UPDATE"))));

        assertThat(decide(withUpdate, "PUT", "/api/inventory/products/123")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withUpdate, "PATCH", "/api/inventory/products/123")).matches(AuthorizationDecision::isGranted);

        Chain withoutUpdate = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));
        assertThat(decide(withoutUpdate, "PATCH", "/api/inventory/products/123")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("12. DELETE -> DELETE")
    void deleteMapsToDelete() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withDelete = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "DELETE"))));

        assertThat(decide(withDelete, "DELETE", "/api/inventory/products/123")).matches(AuthorizationDecision::isGranted);

        Chain withoutDelete = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));
        assertThat(decide(withoutDelete, "DELETE", "/api/inventory/products/123")).matches(d -> !d.isGranted());
    }

    // ── Test 13: unknown module → DENY ─────────────────────────────────────

    @Test
    @DisplayName("13. Unknown module -> DENY (fail closed)")
    void unknownModuleDenied() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain chain = chainFromVerifyResponse(
                activeUser("johndoe", role, List.of(), List.of(activePerm("PRODUCTS", "READ"))));

        assertThat(decide(chain, "GET", "/api/inventory/non-existing-resource")).matches(d -> !d.isGranted());
    }

    // ── Test 14: features + permissions reach the manager and grant via feature scoping ──

    @Test
    @DisplayName("14. SSO features/permissions reach the final authorization manager")
    void featuresAndPermissionsReachTheManager() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        UserResponse user = activeUser("johndoe", role,
                List.of(feature("STOCK"), feature("INVENTORY_REPORTS")),
                List.of(activePerm("STOCK", "READ"), activePerm("STOCK", "WRITE"),
                        activePerm("INVENTORY_REPORTS", "READ"), activePerm("INVENTORY_REPORTS", "EXPORT")));

        Chain chain = chainFromVerifyResponse(user);

        // The principal carries the raw verified permission objects and feature codes.
        assertThat(chain.principal.getActiveFeatures()).contains("STOCK", "INVENTORY_REPORTS");
        assertThat(chain.principal.getPermissions()).hasSize(4);
        assertThat(chain.principal.activeAndAllowedPermissionCount()).isEqualTo(4);
        assertThat(chain.principal.hasPermission("STOCK", "READ")).isTrue();
        assertThat(chain.principal.hasPermission("STOCK", "DELETE")).isFalse();
        assertThat(chain.principal.hasPermission("INVENTORY_REPORTS", "EXPORT")).isTrue();

        // Managers grants from those self-same permissions.
        assertThat(decide(chain, "GET", "/api/inventory/inventory-stocks")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(chain, "POST", "/api/inventory/inventory-stocks")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(chain, "GET", "/api/inventory/reports")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(chain, "GET", "/api/inventory/reports/export")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(chain, "DELETE", "/api/inventory/inventory-stocks/123")).matches(d -> !d.isGranted());
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    // ── Custom action suffixes: /approve /reject /cancel /export /verify ───

    @Test
    @DisplayName("Custom action /approve requires APPROVE, /reject REJECT, /cancel CANCEL")
    void customStateTransitionSuffixes() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withApprove = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("STOCK_ADJUSTMENTS", "APPROVE"))));
        Chain withReject = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("STOCK_ADJUSTMENTS", "REJECT"))));
        Chain withCancel = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("STOCK_ADJUSTMENTS", "CANCEL"))));

        assertThat(decide(withApprove, "POST", "/api/inventory/stock-adjustments/1/approve")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withReject, "POST", "/api/inventory/stock-adjustments/1/reject")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withCancel, "POST", "/api/inventory/stock-adjustments/1/cancel")).matches(AuthorizationDecision::isGranted);

        // Without the specific action the state transition is denied.
        Chain withRead = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("STOCK_ADJUSTMENTS", "READ"))));
        assertThat(decide(withRead, "POST", "/api/inventory/stock-adjustments/1/approve")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("Custom action /export requires EXPORT")
    void exportSuffix() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withExport = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("INVENTORY_REPORTS", "EXPORT"))));
        Chain withRead = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("INVENTORY_REPORTS", "READ"))));

        assertThat(decide(withExport, "GET", "/api/inventory/reports/export")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withRead, "GET", "/api/inventory/reports/export")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("Custom action /verify resolves to UPDATE")
    void verifySuffix() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Chain withUpdate = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("WAREHOUSES", "UPDATE"))));
        Chain withRead = chainFromVerifyResponse(activeUser("johndoe", role, List.of(), List.of(activePerm("WAREHOUSES", "READ"))));

        assertThat(decide(withUpdate, "POST", "/api/inventory/warehouses/1/verify")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(withRead, "POST", "/api/inventory/warehouses/1/verify")).matches(d -> !d.isGranted());
    }

    // ── Prompt Required Tests ───────────────────────────────────────────────

    @Test
    @DisplayName("1. OWNER + Inventory + FULL -> Inventory READ, WRITE, DELETE allowed")
    void ownerWithInventoryFullGetsReadWriteDelete() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        UserResponse user = activeUser("owner@company.com", ownerRole,
                List.of(feature("PRODUCTS")),
                List.of(
                        activePerm("PRODUCTS", "READ"),
                        activePerm("PRODUCTS", "CREATE"),
                        activePerm("PRODUCTS", "UPDATE"),
                        activePerm("PRODUCTS", "DELETE"),
                        activePerm("PRODUCTS", "WRITE")
                ));
        user.setAccessMode("FULL");
        CurrentUserContext.setAccessMode("FULL");
        try {
            Chain chain = chainFromVerifyResponse(user);
            assertThat(decide(chain, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(chain, "POST", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(chain, "PUT", "/api/inventory/products/123")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(chain, "DELETE", "/api/inventory/products/123")).matches(AuthorizationDecision::isGranted);
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("2. OWNER + Inventory module disabled -> Inventory request denied")
    void ownerWithInventoryModuleDisabledDenied() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        // Module disabled in SSO: no active permissions for inventory
        UserResponse user = activeUser("owner@company.com", ownerRole, List.of(), List.of());
        user.setAccessMode("FULL");
        Chain chain = chainFromVerifyResponse(user);
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("3. Normal USER + only READ permission -> READ allowed, WRITE denied, DELETE denied")
    void normalUserWithOnlyReadPermissionAllowedReadDeniedWriteDelete() {
        RoleResponse userRole = RoleResponse.builder().name("USER").status(true).build();
        UserResponse user = activeUser("user@company.com", userRole,
                List.of(feature("PRODUCTS")),
                List.of(activePerm("PRODUCTS", "READ")));
        Chain chain = chainFromVerifyResponse(user);
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(chain, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
        assertThat(decide(chain, "DELETE", "/api/inventory/products/123")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("4. OWNER + READ_ONLY organization -> GET allowed, mutations denied")
    void ownerWithReadOnlyOrganizationModeBlocksMutations() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        UserResponse user = activeUser("owner@company.com", ownerRole,
                List.of(feature("PRODUCTS")),
                List.of(
                        activePerm("PRODUCTS", "READ"),
                        activePerm("PRODUCTS", "CREATE"),
                        activePerm("PRODUCTS", "UPDATE"),
                        activePerm("PRODUCTS", "DELETE"),
                        activePerm("PRODUCTS", "WRITE")
                ));
        CurrentUserContext.setAccessMode("READ_ONLY");
        try {
            Chain chain = chainFromVerifyResponse(user);
            assertThat(decide(chain, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(chain, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
            assertThat(decide(chain, "PUT", "/api/inventory/products/123")).matches(d -> !d.isGranted());
            assertThat(decide(chain, "PATCH", "/api/inventory/products/123")).matches(d -> !d.isGranted());
            assertThat(decide(chain, "DELETE", "/api/inventory/products/123")).matches(d -> !d.isGranted());
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("5. OWNER + BLOCKED organization -> all requests denied")
    void ownerWithBlockedOrganizationDenied() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        UserResponse user = activeUser("owner@company.com", ownerRole,
                List.of(feature("PRODUCTS")),
                List.of(activePerm("PRODUCTS", "READ"), activePerm("PRODUCTS", "WRITE")));
        CurrentUserContext.setAccessMode("BLOCKED");
        try {
            Chain chain = chainFromVerifyResponse(user);
            assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
            assertThat(decide(chain, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("6. Account OWNER permissions must not accidentally authorize Inventory endpoints")
    void accountOwnerPermissionsDoNotAuthorizeInventoryEndpoints() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        UserResponse user = activeUser("owner@company.com", ownerRole,
                List.of(feature("CUSTOMERS"), feature("DASHBOARD")),
                List.of(
                        PermissionResponse.builder()
                                .permissionCode("CUSTOMERS:READ")
                                .action("READ")
                                .moduleName("ACCOUNT")
                                .featureCode("CUSTOMERS")
                                .active(true)
                                .allowed(true)
                                .build(),
                        PermissionResponse.builder()
                                .permissionCode("DASHBOARD:READ")
                                .action("READ")
                                .moduleName("ACCOUNT")
                                .featureCode("DASHBOARD")
                                .active(true)
                                .allowed(true)
                                .build()
                ));
        Chain chain = chainFromVerifyResponse(user);
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
        assertThat(decide(chain, "GET", "/api/inventory/inventory-stocks")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("7. Canonical module name normalization: inventory -> INVENTORY")
    void moduleNameNormalization() {
        RoleResponse ownerRole = RoleResponse.builder().name("OWNER").status(true).build();
        PermissionResponse perm = PermissionResponse.builder()
                .permissionCode("PRODUCTS:READ")
                .action("READ")
                .moduleName("inventory")
                .featureCode("PRODUCTS")
                .active(true)
                .allowed(true)
                .build();
        UserResponse user = activeUser("owner@company.com", ownerRole, List.of(), List.of(perm));
        Chain chain = chainFromVerifyResponse(user);
        assertThat(decide(chain, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
    }
}