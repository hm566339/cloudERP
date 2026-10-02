package com.erp.inventory.common.security.authorization;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class SsoAuthorizationManagerTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "PRODUCTS", List.of("/api/inventory/products/**"),
                "STOCK", List.of("/api/inventory/inventory-stocks/**"),
                "WAREHOUSES", List.of("/api/inventory/warehouses/**")
        ));
        manager = new SsoAuthorizationManager(properties);
    }

    private AuthorizationDecision decide(List<String> authorities, String method, String uri) {
        TestingAuthenticationToken auth = new TestingAuthenticationToken(
                "user", "password",
                authorities.stream().map(SimpleGrantedAuthority::new).toList()
        );
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        return manager.authorize(() -> auth, new RequestAuthorizationContext(request, null));
    }

    // ── SSO READ permission ────────────────────────────────────────────────

    @Test
    @DisplayName("SSO READ permission grants GET on the matched module")
    void ssoReadPermissionGrantsGet() {
        String authority = "MODULE_PRODUCTS_ACTION_READ";
        AuthorizationDecision decision = decide(List.of(authority), "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SSO READ permission grants GET when module keyed as a feature")
    void ssoReadPermissionGrantsGetWhenScopedAsFeature() {
        String authority = "FEATURE_PRODUCTS_ACTION_READ";
        AuthorizationDecision decision = decide(List.of(authority), "GET", "/api/inventory/products/123");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── SSO WRITE permission ───────────────────────────────────────────────

    @Test
    @DisplayName("SSO WRITE permission grants POST (explicit documented method mapping)")
    void ssoWritePermissionGrantsPost() {
        String authority = "MODULE_PRODUCTS_ACTION_WRITE";
        AuthorizationDecision decision = decide(List.of(authority), "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SSO CREATE permission grants POST")
    void ssoCreatePermissionGrantsPost() {
        String authority = "MODULE_PRODUCTS_ACTION_CREATE";
        AuthorizationDecision decision = decide(List.of(authority), "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── SSO DELETE permission ──────────────────────────────────────────────

    @Test
    @DisplayName("SSO DELETE permission grants DELETE")
    void ssoDeletePermissionGrantsDelete() {
        String authority = "MODULE_PRODUCTS_ACTION_DELETE";
        AuthorizationDecision decision = decide(List.of(authority), "DELETE", "/api/inventory/products/123");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("DELETE is NOT granted by READ or WRITE alone")
    void deleteNotGrantedByReadOrWrite() {
        AuthorizationDecision withRead = decide(List.of("MODULE_PRODUCTS_ACTION_READ"), "DELETE", "/api/inventory/products/123");
        AuthorizationDecision withWrite = decide(List.of("MODULE_PRODUCTS_ACTION_WRITE"), "DELETE", "/api/inventory/products/123");
        assertThat(withRead.isGranted()).isFalse();
        assertThat(withWrite.isGranted()).isFalse();
    }

    // ── Missing permission ─────────────────────────────────────────────────

    @Test
    @DisplayName("Missing permission grants no access")
    void missingPermissionDenied() {
        AuthorizationDecision decision = decide(List.of("MODULE_PRODUCTS_ACTION_READ"), "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Role alone never grants access")
    void roleAloneNeverGrants() {
        AuthorizationDecision decision = decide(List.of("ROLE_INVENTORY_MANAGER"), "GET", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Feature alone never grants endpoint access without an action")
    void featureAloneNeverGrants() {
        AuthorizationDecision decision = decide(List.of("FEATURE_PRODUCTS"), "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Module routing / fail closed ───────────────────────────────────────

    @Test
    @DisplayName("Unmapped endpoint is denied (fail closed)")
    void unmappedEndpointDenied() {
        AuthorizationDecision decision = decide(List.of("MODULE_PRODUCTS_ACTION_READ"), "GET", "/api/inventory/unknown");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Unauthenticated request is denied")
    void unauthenticatedDenied() {
        AuthorizationDecision decision = manager.authorize(() -> null,
                new RequestAuthorizationContext(new MockHttpServletRequest("GET", "/api/inventory/products"), null));
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("OPTIONS is always allowed")
    void optionsAllowed() {
        AuthorizationDecision decision = decide(List.of(), "OPTIONS", "/api/inventory/products");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── Custom action URL suffixes ─────────────────────────────────────────

    @Test
    @DisplayName("Custom approve suffix requires the APPROVE action (not create/write)")
    void approveSuffixRequiresApprove() {
        AuthorizationDecision withWrite = decide(List.of("MODULE_STOCK_ACTION_WRITE"), "POST", "/api/inventory/inventory-stocks/123/approve");
        AuthorizationDecision withApprove = decide(List.of("MODULE_STOCK_ACTION_APPROVE"), "POST", "/api/inventory/inventory-stocks/123/approve");
        assertThat(withWrite.isGranted()).isFalse();
        assertThat(withApprove.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Export suffix requires the EXPORT action")
    void exportSuffixRequiresExport() {
        AuthorizationDecision withRead = decide(List.of("MODULE_PRODUCTS_ACTION_READ"), "GET", "/api/inventory/products/export");
        AuthorizationDecision withExport = decide(List.of("MODULE_PRODUCTS_ACTION_EXPORT"), "GET", "/api/inventory/products/123/export");
        assertThat(withRead.isGranted()).isFalse();
        assertThat(withExport.isGranted()).isTrue();
    }

    // ── write-implies-create-update opt-in ─────────────────────────────────

    @Test
    @DisplayName("Without the opt-in flag WRITE does not satisfy a custom CREATE requirement")
    void writeDoesNotImplyCreateByDefault() {
        properties.setMethodActions(Map.of("POST", List.of("CREATE")));
        AuthorizationDecision decision = decide(List.of("MODULE_PRODUCTS_ACTION_WRITE"), "POST", "/api/inventory/products");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("With write-implies-create-update enabled, WRITE satisfies CREATE and UPDATE")
    void writeImpliesCreateUpdateWhenConfigured() {
        properties.setMethodActions(Map.of("POST", List.of("CREATE"), "PUT", List.of("UPDATE")));
        properties.setWriteImpliesCreateUpdate(true);

        AuthorizationDecision post = decide(List.of("MODULE_PRODUCTS_ACTION_WRITE"), "POST", "/api/inventory/products");
        AuthorizationDecision put = decide(List.of("MODULE_PRODUCTS_ACTION_WRITE"), "PUT", "/api/inventory/products/123");

        assertThat(post.isGranted()).isTrue();
        assertThat(put.isGranted()).isTrue();
    }

    // ── System administrator & profile ─────────────────────────────────────

    @Test
    @DisplayName("SYSTEM_ADMIN role from SSO bypasses module checks")
    void systemAdminBypasses() {
        AuthorizationDecision decision = decide(List.of("ROLE_SYSTEM_ADMIN"), "DELETE", "/api/inventory/anything-at-all");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Authenticated profile endpoint is allowed without module routing")
    void authenticatedProfileAllowed() {
        AuthorizationDecision decision = decide(List.of("ROLE_INVENTORY_MANAGER"), "GET", "/api/inventory/auth/me");
        assertThat(decision.isGranted()).isTrue();
    }
}