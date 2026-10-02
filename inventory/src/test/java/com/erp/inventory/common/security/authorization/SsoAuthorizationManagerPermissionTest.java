package com.erp.inventory.common.security.authorization;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.auth.dto.ssoresponse.PermissionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Decisions driven directly by the raw SSO {@link PermissionResponse} objects stored
 * on the {@link AuthenticatedUser} principal, with case-insensitive module matching
 * and strict active+allowed enforcement. No local role-to-permission grants exist.
 */
class SsoAuthorizationManagerPermissionTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "PRODUCTS", List.of("/api/inventory/products/**"),
                "DASHBOARD", List.of("/api/inventory/dashboard", "/api/inventory/dashboard/**"),
                "STOCK", List.of("/api/inventory/inventory-stocks/**")
        ));
        manager = new SsoAuthorizationManager(properties);
    }

    private PermissionResponse permission(String module, String action, Boolean active, Boolean allowed) {
        return PermissionResponse.builder()
                .permissionCode(module + ":" + action)
                .action(action)
                .moduleName(module)
                .featureCode(module)
                .active(active)
                .allowed(allowed)
                .build();
    }

    private AuthorizationDecision decide(AuthenticatedUser user, String method, String uri) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null,
                user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    // ── INVENTORY_MANAGER with PRODUCTS READ ───────────────────────────────

    @Test
    @DisplayName("INVENTORY_MANAGER with an active+allowed PRODUCTS READ permission is granted READ")
    void inventoryManagerWithProductsReadGetsProductsRead() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of("PRODUCT_MGMT"))
                .permissions(List.of(permission("PRODUCTS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("INVENTORY_MANAGER with PRODUCTS READ is NOT granted WRITE")
    void inventoryManagerWithProductsReadDeniedWriteAction() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("PRODUCTS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Role alone is never enough ─────────────────────────────────────────

    @Test
    @DisplayName("INVENTORY_MANAGER role alone grants NO endpoint access")
    void roleAloneDenies() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();

        AuthorizationDecision products = decide(user, "GET", "/api/inventory/products");
        AuthorizationDecision dashboard = decide(user, "GET", "/api/inventory/dashboard");
        assertThat(products.isGranted()).isFalse();
        assertThat(dashboard.isGranted()).isFalse();
    }

    // ── Inactive / disallowed permissions ──────────────────────────────────

    @Test
    @DisplayName("Inactive permission grants nothing (fail closed)")
    void inactivePermissionDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("PRODUCTS", "READ", false, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Disallowed permission grants nothing (fail closed)")
    void disallowedPermissionDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("PRODUCTS", "READ", true, false)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Null flags are treated as inactive (fail closed)")
    void nullFlagsDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("PRODUCTS", "READ", null, null)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Case-insensitive module matching ───────────────────────────────────

    @Test
    @DisplayName("Lowercase SSO moduleName matches the uppercase YAML key (PRODUCTS)")
    void lowercaseModuleNameMatchesYamlKeyCaseInsensitively() {
        PermissionResponse lowerCase = permission("products", "read", true, true);
        lowerCase.setModuleName("products");
        lowerCase.setFeatureCode("product_mgmt");

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(lowerCase))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Permission scoped by featureCode alone (no moduleName) is honored")
    void featureCodeScopedPermissionIsHonored() {
        PermissionResponse featureScoped = permission("PRODUCTS", "READ", true, true);
        featureScoped.setModuleName(null);
        featureScoped.setFeatureCode("PRODUCTS");

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(featureScoped))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── SYSTEM_ADMIN only when the SSO role is active ──────────────────────

    @Test
    @DisplayName("Active SYSTEM_ADMIN role bypasses module checks")
    void activeSystemAdminBypasses() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("admin")
                .companyCode(null)
                .roles(List.of("SYSTEM_ADMIN"))
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();

        AuthorizationDecision decision = decide(user, "DELETE", "/api/inventory/anything-unmapped");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SYSTEM_ADMIN role present but inactive does NOT bypass")
    void inactiveSystemAdminDoesNotBypass() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("admin")
                .roles(List.of())          // SSO returned SYSTEM_ADMIN with status=false, so it is absent here
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Organization: Vishal, Default Company: VISHAL, User: OWNER ────────

    @Test
    @DisplayName("Vishal Org OWNER with full Inventory permissions has full authorized functionality")
    void vishalOwner_withFullInventoryPermissions_hasFullAuthorizedInventoryFunctionality() {
        UUID vishalOwnerId = UUID.randomUUID();
        AuthenticatedUser vishalOwner = AuthenticatedUser.builder()
                .userId(vishalOwnerId)
                .username("vishal_owner")
                .companyCode("VISHAL")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("PRODUCTS", "STOCK", "DASHBOARD"))
                .permissions(List.of(
                        permission("PRODUCTS", "READ", true, true),
                        permission("PRODUCTS", "WRITE", true, true),
                        permission("PRODUCTS", "DELETE", true, true),
                        permission("STOCK", "READ", true, true),
                        permission("STOCK", "WRITE", true, true),
                        permission("STOCK", "DELETE", true, true),
                        permission("DASHBOARD", "READ", true, true)
                ))
                .build();

        try {
            CurrentUserContext.setOrganizationCode("vishal");
            CurrentUserContext.setAccessMode("NORMAL");
            CurrentUserContext.setUserId(vishalOwnerId);
            CurrentUserContext.setUsername("vishal_owner");
            CurrentUserContext.setUserRole("OWNER");

            // 1. Dashboard read
            assertThat(decide(vishalOwner, "GET", "/api/inventory/dashboard")).matches(AuthorizationDecision::isGranted);

            // 2. Products full CRUD
            assertThat(decide(vishalOwner, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(vishalOwner, "POST", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(vishalOwner, "PUT", "/api/inventory/products/101")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(vishalOwner, "DELETE", "/api/inventory/products/101")).matches(AuthorizationDecision::isGranted);

            // 3. Stock full CRUD
            assertThat(decide(vishalOwner, "GET", "/api/inventory/inventory-stocks")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(vishalOwner, "POST", "/api/inventory/inventory-stocks")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(vishalOwner, "DELETE", "/api/inventory/inventory-stocks/202")).matches(AuthorizationDecision::isGranted);
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("Vishal Org OWNER in READ_ONLY mode is denied Inventory mutations but granted reads")
    void vishalOwner_readOnlyMode_deniesMutations() {
        UUID vishalOwnerId = UUID.randomUUID();
        AuthenticatedUser vishalOwner = AuthenticatedUser.builder()
                .userId(vishalOwnerId)
                .username("vishal_owner")
                .companyCode("VISHAL")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("PRODUCTS"))
                .permissions(List.of(
                        permission("PRODUCTS", "READ", true, true),
                        permission("PRODUCTS", "WRITE", true, true)
                ))
                .build();

        try {
            CurrentUserContext.setOrganizationCode("vishal");
            CurrentUserContext.setAccessMode("READ_ONLY");

            // READ allowed
            assertThat(decide(vishalOwner, "GET", "/api/inventory/products")).matches(AuthorizationDecision::isGranted);

            // Mutation denied despite having WRITE permission
            assertThat(decide(vishalOwner, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
            assertThat(decide(vishalOwner, "DELETE", "/api/inventory/products/101")).matches(d -> !d.isGranted());
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("Vishal Org OWNER in BLOCKED mode is denied all Inventory access")
    void vishalOwner_blockedMode_deniesAllAccess() {
        UUID vishalOwnerId = UUID.randomUUID();
        AuthenticatedUser vishalOwner = AuthenticatedUser.builder()
                .userId(vishalOwnerId)
                .username("vishal_owner")
                .companyCode("VISHAL")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("PRODUCTS"))
                .permissions(List.of(
                        permission("PRODUCTS", "READ", true, true),
                        permission("PRODUCTS", "WRITE", true, true)
                ))
                .build();

        try {
            CurrentUserContext.setOrganizationCode("vishal");
            CurrentUserContext.setAccessMode("BLOCKED");

            assertThat(decide(vishalOwner, "GET", "/api/inventory/products")).matches(d -> !d.isGranted());
            assertThat(decide(vishalOwner, "POST", "/api/inventory/products")).matches(d -> !d.isGranted());
        } finally {
            CurrentUserContext.clear();
        }
    }
}