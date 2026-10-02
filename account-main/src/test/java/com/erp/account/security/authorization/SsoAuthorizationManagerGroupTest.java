package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
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
 * Group-based automatic API access through {@link SsoAuthorizationManager}.
 * <p>
 * A user holding the SALES_INVOICE group feature gets SALES_INVOICES READ/CREATE/UPDATE
 * plus READ on the supporting CUSTOMERS/HSN_SAC/SALES_TAXES/GST_SLABS modules - all
 * derived from the group alone. Everything outside the configured scope is denied, WRITE
 * is never silently converted, SYSTEM_ADMIN still bypasses, and access fails closed when
 * the group is not held (or held only via inactive/disallowed permission data).
 */
class SsoAuthorizationManagerGroupTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "SALES_INVOICES", List.of("/api/account/sales/invoices/**"),
                "CUSTOMERS", List.of("/api/account/customers/**"),
                "HSN_SAC", List.of("/api/account/hsn-sac/**"),
                "SALES_TAXES", List.of("/api/account/sales-taxes/**"),
                "GST_SLABS", List.of("/api/account/gst-slabs/**"),
                "VENDORS", List.of("/api/account/vendors/**")));
        properties.setFeatureGroups(Map.of(
                "SALES_INVOICE", Map.of(
                        "SALES_INVOICES", List.of("READ", "CREATE", "UPDATE"),
                        "CUSTOMERS", List.of("READ"),
                        "HSN_SAC", List.of("READ"),
                        "SALES_TAXES", List.of("READ"),
                        "GST_SLABS", List.of("READ"))));
        manager = new SsoAuthorizationManager(properties);
    }

    private AuthenticatedUser user(Set<String> features, List<PermissionResponse> permissions) {
        return AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of())
                .activeFeatures(features)
                .permissions(permissions)
                .build();
    }

    private AuthorizationDecision decide(AuthenticatedUser user, String method, String uri) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user, null,
                user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).toList());
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    private PermissionResponse permission(String featureCode, String action, Boolean active, Boolean allowed) {
        PermissionResponse p = PermissionResponse.builder()
                .permissionCode(featureCode + ":" + action)
                .action(action)
                .active(active)
                .allowed(allowed)
                .build();
        p.setModuleName(null);
        p.setFeatureCode(featureCode);
        return p;
    }

    private static final String SALES_INVOICE = "SALES_INVOICE";

    // ── Sales Invoice group access ────────────────────────────────────────

    @Test
    @DisplayName("SALES_INVOICE group grants CREATE and UPDATE on sales invoices")
    void salesInvoiceGroupGrantsSalesInvoiceCreateAndUpdate() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isTrue();
        assertThat(decide(user, "PUT", "/api/account/sales/invoices/123").isGranted()).isTrue();
        assertThat(decide(user, "GET", "/api/account/sales/invoices").isGranted()).isTrue();
    }

    @Test
    @DisplayName("SALES_INVOICE group does NOT grant DELETE on sales invoices")
    void salesInvoiceGroupDoesNotGrantDeleteOnSalesInvoices() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "DELETE", "/api/account/sales/invoices/123").isGranted()).isFalse();
    }

    // ── Customer READ dependency ──────────────────────────────────────────

    @Test
    @DisplayName("SALES_INVOICE group grants GET on customers (READ dependency)")
    void groupGrantsCustomerReadDependency() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isTrue();
        assertThat(decide(user, "GET", "/api/account/customers/123").isGranted()).isTrue();
    }

    @Test
    @DisplayName("SALES_INVOICE group does NOT grant POST/CREATE on customers")
    void groupDoesNotGrantCustomerWrite() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "POST", "/api/account/customers").isGranted()).isFalse();
        assertThat(decide(user, "PUT", "/api/account/customers/123").isGranted()).isFalse();
    }

    // ── Other configured dependencies ─────────────────────────────────────

    @Test
    @DisplayName("SALES_INVOICE group grants READ on HSN_SAC, SALES_TAXES and GST_SLABS")
    void groupGrantsTaxDependencies() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "GET", "/api/account/hsn-sac").isGranted()).isTrue();
        assertThat(decide(user, "GET", "/api/account/sales-taxes").isGranted()).isTrue();
        assertThat(decide(user, "GET", "/api/account/gst-slabs").isGranted()).isTrue();
    }

    // ── Missing / unrelated dependency ────────────────────────────────────

    @Test
    @DisplayName("Unrelated module (VENDORS) is NOT granted by the group")
    void groupDoesNotGrantUnrelatedModule() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "GET", "/api/account/vendors").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Unmapped module is denied (fail closed) even with a group")
    void unmappedModuleDeniedWithGroup() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        assertThat(decide(user, "GET", "/api/account/unknown").isGranted()).isFalse();
    }

    // ── No group → no derived access ──────────────────────────────────────

    @Test
    @DisplayName("User without the group gets no derived access on supporting APIs")
    void userWithoutGroupDeniedOnDependencies() {
        AuthenticatedUser user = user(Set.of("PAYMENTS"), List.of());
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isFalse();
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Direct permission is still honored without any group (no behavior change)")
    void directPermissionStillHonored() {
        List<PermissionResponse> permissions = List.of(
                PermissionResponse.builder()
                        .permissionCode("CUSTOMERS:READ")
                        .action("READ")
                        .moduleName("CUSTOMERS")
                        .active(true)
                        .allowed(true)
                        .build());
        AuthenticatedUser user = user(Set.of(), permissions);
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isTrue();
    }

    // ── Inactive / disallowed permission → group not held ────────────────

    @Test
    @DisplayName("Inactive permission carrying the group featureCode grants nothing (fail closed)")
    void inactiveGroupPermissionDenied() {
        AuthenticatedUser user = user(Set.of(), List.of(permission(SALES_INVOICE, "READ", false, true)));
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isFalse();
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Disallowed permission carrying the group featureCode grants nothing (fail closed)")
    void disallowedGroupPermissionDenied() {
        AuthenticatedUser user = user(Set.of(), List.of(permission(SALES_INVOICE, "READ", true, false)));
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isFalse();
    }

    @Test
    @DisplayName("Active+allowed permission carrying the group featureCode activates the group")
    void activeAllowedGroupPermissionGrants() {
        AuthenticatedUser user = user(Set.of(), List.of(permission(SALES_INVOICE, "READ", true, true)));
        assertThat(decide(user, "GET", "/api/account/customers").isGranted()).isTrue();
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isTrue();
    }

    // ── WRITE is not silently converted ───────────────────────────────────

    @Test
    @DisplayName("read-only group dependency never satisfies a WRITE requirement")
    void readDependencyNeverSatisfiesWrite() {
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());
        // /customers requires CREATE/WRITE on POST - the group has only CUSTOMERS READ.
        assertThat(decide(user, "POST", "/api/account/customers").isGranted()).isFalse();
    }

    @Test
    @DisplayName("write-implies-create-update stays off: group WRITE does not satisfy a CREATE-only requirement")
    void writeDoesNotImplyCreateEvenWithGroup() {
        properties.setFeatureGroups(Map.of(
                "SALES_INVOICE", Map.of("SALES_INVOICES", List.of("WRITE"))));
        properties.setMethodActions(Map.of("POST", List.of("CREATE")));
        AuthenticatedUser user = user(Set.of(SALES_INVOICE), List.of());

        // POST resolves to CREATE only; the group grants WRITE, and since the explicit
        // write-implies-create-update opt-in is false, WRITE is NOT converted to CREATE.
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isFalse();

        // With the explicit opt-in the same group WRITE now satisfies CREATE.
        properties.setWriteImpliesCreateUpdate(true);
        assertThat(decide(user, "POST", "/api/account/sales/invoices").isGranted()).isTrue();
    }

    // ── SYSTEM_ADMIN bypass ───────────────────────────────────────────────

    @Test
    @DisplayName("SYSTEM_ADMIN bypasses module/group checks entirely")
    void systemAdminBypasses() {
        AuthenticatedUser admin = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("admin")
                .roles(List.of("SYSTEM_ADMIN"))
                .activeFeatures(Set.of())
                .permissions(List.of())
                .build();
        assertThat(decide(admin, "DELETE", "/api/account/sales/invoices/123").isGranted()).isTrue();
        assertThat(decide(admin, "GET", "/api/account/vendors").isGranted()).isTrue();
    }
}