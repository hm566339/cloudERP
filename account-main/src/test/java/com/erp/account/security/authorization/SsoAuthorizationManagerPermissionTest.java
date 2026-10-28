package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.security.CurrentUserContext;
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
                "CUSTOMERS", List.of("/api/account/customers/**"),
                "DASHBOARD", List.of("/api/account/dashboard", "/api/account/dashboard/**"),
                "PURCHASE_ORDERS", List.of("/api/account/purchase-orders/**"),
                "QUOTATIONS", List.of("/api/account/sales/quotations/**", "/api/account/v1/quotations/**")
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

    // ── FINANCE_MANAGER with CUSTOMERS READ ────────────────────────────────

    @Test
    @DisplayName("FINANCE_MANAGER with an active+allowed CUSTOMERS READ permission is granted READ")
    void financeManagerWithCustomersReadGetsCustomersRead() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of("CUSTOMER_MGMT"))
                .permissions(List.of(permission("CUSTOMERS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("FINANCE_MANAGER with CUSTOMERS READ is NOT granted WRITE")
    void financeManagerWithCustomersReadDeniedWriteAction() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("CUSTOMERS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── FINANCE_MANAGER with DASHBOARD READ ────────────────────────────────

    @Test
    @DisplayName("FINANCE_MANAGER with an active+allowed DASHBOARD READ permission is granted READ")
    void financeManagerWithDashboardReadGetsDashboardRead() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of("DASHBOARD"))
                .permissions(List.of(permission("DASHBOARD", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/dashboard");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── Role alone is never enough (requirement 10) ────────────────────────

    @Test
    @DisplayName("FINANCE_MANAGER role alone grants NO endpoint access")
    void roleAloneDenies() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();

        AuthorizationDecision customers = decide(user, "GET", "/api/account/customers");
        AuthorizationDecision dashboard = decide(user, "GET", "/api/account/dashboard");
        assertThat(customers.isGranted()).isFalse();
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
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("CUSTOMERS", "READ", false, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Disallowed permission grants nothing (fail closed)")
    void disallowedPermissionDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("CUSTOMERS", "READ", true, false)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Null flags are treated as inactive (fail closed)")
    void nullFlagsDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(permission("CUSTOMERS", "READ", null, null)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Case-insensitive module matching ───────────────────────────────────

    @Test
    @DisplayName("Lowercase SSO moduleName matches the uppercase YAML key (CUSTOMERS)")
    void lowercaseModuleNameMatchesYamlKeyCaseInsensitively() {
        PermissionResponse lowerCase = permission("customers", "read", true, true);
        lowerCase.setModuleName("customers");
        lowerCase.setFeatureCode("customer_mgmt");

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(lowerCase))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Mixed-case YAML key DASHBOARD matches SSO dashboard permission")
    void mixedCaseYamlKeyMatchesSsoPermission() {
        PermissionResponse mixed = permission("Dashboard", "READ", true, true);

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(mixed))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/dashboard");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Permission scoped by featureCode alone (no moduleName) is honored")
    void featureCodeScopedPermissionIsHonored() {
        PermissionResponse featureScoped = permission("CUSTOMERS", "READ", true, true);
        featureScoped.setModuleName(null);
        featureScoped.setFeatureCode("CUSTOMERS");

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of("FINANCE_MANAGER"))
                .activeFeatures(Set.of())
                .permissions(List.of(featureScoped))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
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

        AuthorizationDecision decision = decide(user, "DELETE", "/api/account/anything-unmapped");
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

        AuthorizationDecision decision = decide(user, "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── STEP 8 Regression Matrix Tests ────────────────────────────────────

    @Test
    @DisplayName("OWNER with Account DASHBOARD:READ permission is granted access to /api/account/dashboard/cards")
    void ownerWithDashboardRead_isGrantedDashboardCards() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("trial.owner")
                .companyCode("ACME")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("DASHBOARD"))
                .permissions(List.of(permission("DASHBOARD", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/dashboard/cards");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("User with Account module but missing DASHBOARD:READ is denied /api/account/dashboard/cards")
    void userWithAccountModule_withoutDashboardRead_isDeniedDashboardCards() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("accountant")
                .companyCode("ACME")
                .roles(List.of("ACCOUNTANT"))
                .activeFeatures(Set.of("CUSTOMERS"))
                .permissions(List.of(permission("CUSTOMERS", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/dashboard/cards");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Inventory-only user (no DASHBOARD/ACCOUNT permission) is denied /api/account/dashboard/cards")
    void inventoryOnlyUser_isDeniedDashboardCards() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("inventory.user")
                .companyCode("ACME")
                .roles(List.of("INVENTORY_MANAGER"))
                .activeFeatures(Set.of("INVENTORY"))
                .permissions(List.of(permission("INVENTORY", "READ", true, true)))
                .build();

        AuthorizationDecision decision = decide(user, "GET", "/api/account/dashboard/cards");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("READ_ONLY access mode allows dashboard read but blocks business mutation")
    void readOnlyAccessMode_allowsDashboardRead_blocksBusinessWrite() {
        try {
            CurrentUserContext.setAccessMode("READ_ONLY");
            AuthenticatedUser user = AuthenticatedUser.builder()
                    .userId(UUID.randomUUID())
                    .username("expired.trial.user")
                    .companyCode("ACME")
                    .roles(List.of("OWNER"))
                    .activeFeatures(Set.of("DASHBOARD", "CUSTOMERS"))
                    .permissions(List.of(
                            permission("DASHBOARD", "READ", true, true),
                            permission("CUSTOMERS", "WRITE", true, true)
                    ))
                    .build();

            // GET dashboard cards -> allowed
            AuthorizationDecision readDecision = decide(user, "GET", "/api/account/dashboard/cards");
            assertThat(readDecision.isGranted()).isTrue();

            // POST business mutation -> denied by READ_ONLY policy
            AuthorizationDecision writeDecision = decide(user, "POST", "/api/account/customers");
            assertThat(writeDecision.isGranted()).isFalse();
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("Unauthenticated request is denied")
    void unauthenticatedRequest_isDenied() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/account/dashboard/cards");
        AuthorizationDecision decision = manager.authorize(() -> null, new RequestAuthorizationContext(request, null));
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Prompt Required Tests ───────────────────────────────────────────────

    @Test
    @DisplayName("1. OWNER + Account + FULL -> Account READ, WRITE, DELETE allowed")
    void ownerWithAccountFullGetsReadWriteDelete() {
        try {
            CurrentUserContext.setAccessMode("FULL");
            AuthenticatedUser user = AuthenticatedUser.builder()
                    .userId(UUID.randomUUID())
                    .username("owner@company.com")
                    .companyCode("ACME")
                    .accessMode("FULL")
                    .roles(List.of("OWNER"))
                    .activeFeatures(Set.of("CUSTOMERS"))
                    .permissions(List.of(
                            permission("CUSTOMERS", "READ", true, true),
                            permission("CUSTOMERS", "WRITE", true, true),
                            permission("CUSTOMERS", "DELETE", true, true)
                    ))
                    .build();

            assertThat(decide(user, "GET", "/api/account/customers")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(user, "POST", "/api/account/customers")).matches(AuthorizationDecision::isGranted);
            assertThat(decide(user, "DELETE", "/api/account/customers/123")).matches(AuthorizationDecision::isGranted);
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("2. OWNER + Account module disabled -> Account request denied")
    void ownerWithAccountModuleDisabledDenied() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@company.com")
                .companyCode("ACME")
                .accessMode("FULL")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();

        assertThat(decide(user, "GET", "/api/account/customers")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("3. Normal USER + only READ permission -> READ allowed, WRITE denied, DELETE denied")
    void normalUserWithOnlyReadPermissionAllowedReadDeniedWriteDelete() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("user@company.com")
                .companyCode("ACME")
                .roles(List.of("USER"))
                .activeFeatures(Set.of("CUSTOMERS"))
                .permissions(List.of(permission("CUSTOMERS", "READ", true, true)))
                .build();

        assertThat(decide(user, "GET", "/api/account/customers")).matches(AuthorizationDecision::isGranted);
        assertThat(decide(user, "POST", "/api/account/customers")).matches(d -> !d.isGranted());
        assertThat(decide(user, "DELETE", "/api/account/customers/123")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("4. OWNER + BLOCKED organization -> all requests denied")
    void ownerWithBlockedOrganizationDenied() {
        try {
            CurrentUserContext.setAccessMode("BLOCKED");
            AuthenticatedUser user = AuthenticatedUser.builder()
                    .userId(UUID.randomUUID())
                    .username("owner@company.com")
                    .companyCode("ACME")
                    .accessMode("BLOCKED")
                    .roles(List.of("OWNER"))
                    .activeFeatures(Set.of("CUSTOMERS"))
                    .permissions(List.of(
                            permission("CUSTOMERS", "READ", true, true),
                            permission("CUSTOMERS", "WRITE", true, true)
                    ))
                    .build();

            assertThat(decide(user, "GET", "/api/account/customers")).matches(d -> !d.isGranted());
            assertThat(decide(user, "POST", "/api/account/customers")).matches(d -> !d.isGranted());
        } finally {
            CurrentUserContext.clear();
        }
    }

    @Test
    @DisplayName("5. Inventory OWNER permissions must not accidentally authorize Account endpoints")
    void inventoryOwnerPermissionsDoNotAuthorizeAccountEndpoints() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@company.com")
                .companyCode("ACME")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("PRODUCTS", "STOCK"))
                .permissions(List.of(
                        permission("PRODUCTS", "READ", true, true),
                        permission("PRODUCTS", "WRITE", true, true),
                        permission("STOCK", "READ", true, true)
                ))
                .build();

        assertThat(decide(user, "GET", "/api/account/customers")).matches(d -> !d.isGranted());
        assertThat(decide(user, "GET", "/api/account/dashboard/cards")).matches(d -> !d.isGranted());
    }

    @Test
    @DisplayName("6. Canonical module name normalization: accountDev -> ACCOUNT")
    void moduleNameNormalizationAccountDev() {
        PermissionResponse perm = permission("CUSTOMERS", "READ", true, true);
        perm.setModuleName("accountDev");

        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@company.com")
                .companyCode("ACME")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of())
                .permissions(List.of(perm))
                .build();

        assertThat(decide(user, "GET", "/api/account/customers")).matches(AuthorizationDecision::isGranted);
    }

    @Test
    @DisplayName("7. Quotation send endpoint (/send suffix) with QUOTATIONS:WRITE is granted, READ is denied")
    void quotationSendAuthorizationWithWriteAndRead() {
        String sendUrl = "/api/account/v1/quotations/58994921-5f9e-47d7-a0bc-261d05472b4e/send";

        // Owner with active+allowed QUOTATIONS:WRITE
        AuthenticatedUser ownerWithWrite = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("owner@company.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("OWNER"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(
                        permission("QUOTATIONS", "READ", true, true),
                        permission("QUOTATIONS", "WRITE", true, true)
                ))
                .build();
        assertThat(decide(ownerWithWrite, "POST", sendUrl)).matches(AuthorizationDecision::isGranted);

        // User with active+allowed QUOTATIONS:UPDATE
        AuthenticatedUser userWithUpdate = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("user@company.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(
                        permission("QUOTATIONS", "READ", true, true),
                        permission("QUOTATIONS", "UPDATE", true, true)
                ))
                .build();
        assertThat(decide(userWithUpdate, "POST", sendUrl)).matches(AuthorizationDecision::isGranted);

        // User with only active+allowed QUOTATIONS:READ
        AuthenticatedUser userWithOnlyRead = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("readonly@company.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(permission("QUOTATIONS", "READ", true, true)))
                .build();
        assertThat(decide(userWithOnlyRead, "POST", sendUrl)).matches(d -> !d.isGranted());

        // User with inactive QUOTATIONS:WRITE
        AuthenticatedUser userWithInactiveWrite = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("inactive@company.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(permission("QUOTATIONS", "WRITE", false, true)))
                .build();
        assertThat(decide(userWithInactiveWrite, "POST", sendUrl)).matches(d -> !d.isGranted());

        // User with allowed=false QUOTATIONS:WRITE
        AuthenticatedUser userWithDisallowedWrite = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("disallowed@company.com")
                .companyCode("ea811382-0afc-4908-a209-9bedcc63c445")
                .roles(List.of("USER"))
                .activeFeatures(Set.of("QUOTATIONS"))
                .permissions(List.of(permission("QUOTATIONS", "WRITE", true, false)))
                .build();
        assertThat(decide(userWithDisallowedWrite, "POST", sendUrl)).matches(d -> !d.isGranted());
    }
}