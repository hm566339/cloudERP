package com.erp.account.security.authorization;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
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
import com.erp.account.security.CurrentUserContext;

class SsoAuthorizationManagerTest {

    private SsoAuthorizationProperties properties;
    private SsoAuthorizationManager manager;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setModules(Map.of(
                "CUSTOMERS", List.of("/api/account/customers/**"),
                "PURCHASE_ORDERS", List.of("/api/account/purchase-orders/**"),
                "GOODS_RECEIPTS", List.of("/api/account/goods-receipts/**")
        ));
        manager = new SsoAuthorizationManager(properties);
    }

    @AfterEach
    void clearRequestContext() {
        CurrentUserContext.clear();
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
        String authority = "MODULE_CUSTOMERS_ACTION_READ";
        AuthorizationDecision decision = decide(List.of(authority), "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SSO READ permission grants GET when module keyed as a feature")
    void ssoReadPermissionGrantsGetWhenScopedAsFeature() {
        String authority = "FEATURE_CUSTOMERS_ACTION_READ";
        AuthorizationDecision decision = decide(List.of(authority), "GET", "/api/account/customers/123");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── SSO WRITE permission ───────────────────────────────────────────────

    @Test
    @DisplayName("SSO WRITE permission grants POST (explicit documented method mapping)")
    void ssoWritePermissionGrantsPost() {
        String authority = "MODULE_CUSTOMERS_ACTION_WRITE";
        AuthorizationDecision decision = decide(List.of(authority), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("SSO CREATE permission grants POST")
    void ssoCreatePermissionGrantsPost() {
        String authority = "MODULE_CUSTOMERS_ACTION_CREATE";
        AuthorizationDecision decision = decide(List.of(authority), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── SSO DELETE permission ──────────────────────────────────────────────

    @Test
    @DisplayName("SSO DELETE permission grants DELETE")
    void ssoDeletePermissionGrantsDelete() {
        String authority = "MODULE_CUSTOMERS_ACTION_DELETE";
        AuthorizationDecision decision = decide(List.of(authority), "DELETE", "/api/account/customers/123");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("DELETE is NOT granted by READ or WRITE alone")
    void deleteNotGrantedByReadOrWrite() {
        AuthorizationDecision withRead = decide(List.of("MODULE_CUSTOMERS_ACTION_READ"), "DELETE", "/api/account/customers/123");
        AuthorizationDecision withWrite = decide(List.of("MODULE_CUSTOMERS_ACTION_WRITE"), "DELETE", "/api/account/customers/123");
        assertThat(withRead.isGranted()).isFalse();
        assertThat(withWrite.isGranted()).isFalse();
    }

    // ── Missing permission ─────────────────────────────────────────────────

    @Test
    @DisplayName("Missing permission grants no access")
    void missingPermissionDenied() {
        AuthorizationDecision decision = decide(List.of("MODULE_CUSTOMERS_ACTION_READ"), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Role alone never grants access")
    void roleAloneNeverGrants() {
        AuthorizationDecision decision = decide(List.of("ROLE_FINANCE_MANAGER"), "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Feature alone never grants endpoint access without an action")
    void featureAloneNeverGrants() {
        AuthorizationDecision decision = decide(List.of("FEATURE_CUSTOMERS"), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    // ── Module routing / fail closed ───────────────────────────────────────

    @Test
    @DisplayName("Unmapped endpoint is denied (fail closed)")
    void unmappedEndpointDenied() {
        AuthorizationDecision decision = decide(List.of("MODULE_CUSTOMERS_ACTION_READ"), "GET", "/api/account/unknown");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("Unauthenticated request is denied")
    void unauthenticatedDenied() {
        AuthorizationDecision decision = manager.authorize(() -> null,
                new RequestAuthorizationContext(new MockHttpServletRequest("GET", "/api/account/customers"), null));
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("OPTIONS is always allowed")
    void optionsAllowed() {
        AuthorizationDecision decision = decide(List.of(), "OPTIONS", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    // ── Custom action URL suffixes ─────────────────────────────────────────

    @Test
    @DisplayName("Custom approve suffix requires the APPROVE action (not create/write)")
    void approveSuffixRequiresApprove() {
        AuthorizationDecision withWrite = decide(List.of("MODULE_PURCHASE_ORDERS_ACTION_WRITE"), "POST", "/api/account/purchase-orders/123/approve");
        AuthorizationDecision withApprove = decide(List.of("MODULE_PURCHASE_ORDERS_ACTION_APPROVE"), "POST", "/api/account/purchase-orders/123/approve");
        assertThat(withWrite.isGranted()).isFalse();
        assertThat(withApprove.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Export suffix requires the EXPORT action")
    void exportSuffixRequiresExport() {
        AuthorizationDecision withRead = decide(List.of("MODULE_CUSTOMERS_ACTION_READ"), "GET", "/api/account/customers/export");
        AuthorizationDecision withExport = decide(List.of("MODULE_CUSTOMERS_ACTION_EXPORT"), "GET", "/api/account/customers/123/export");
        assertThat(withRead.isGranted()).isFalse();
        assertThat(withExport.isGranted()).isTrue();
    }

    // ── write-implies-create-update opt-in ─────────────────────────────────

    @Test
    @DisplayName("Without the opt-in flag WRITE does not satisfy a custom CREATE requirement")
    void writeDoesNotImplyCreateByDefault() {
        properties.setMethodActions(Map.of("POST", List.of("CREATE")));
        AuthorizationDecision decision = decide(List.of("MODULE_CUSTOMERS_ACTION_WRITE"), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }

    @Test
    @DisplayName("With write-implies-create-update enabled, WRITE satisfies CREATE and UPDATE")
    void writeImpliesCreateUpdateWhenConfigured() {
        properties.setMethodActions(Map.of("POST", List.of("CREATE"), "PUT", List.of("UPDATE")));
        properties.setWriteImpliesCreateUpdate(true);

        AuthorizationDecision post = decide(List.of("MODULE_CUSTOMERS_ACTION_WRITE"), "POST", "/api/account/customers");
        AuthorizationDecision put = decide(List.of("MODULE_CUSTOMERS_ACTION_WRITE"), "PUT", "/api/account/customers/123");

        assertThat(post.isGranted()).isTrue();
        assertThat(put.isGranted()).isTrue();
    }

    // ── System administrator & profile ─────────────────────────────────────

    @Test
    @DisplayName("SYSTEM_ADMIN role from SSO bypasses module checks")
    void systemAdminBypasses() {
        AuthorizationDecision decision = decide(List.of("ROLE_SYSTEM_ADMIN"), "DELETE", "/api/account/anything-at-all");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("Authenticated profile endpoint is allowed without module routing")
    void authenticatedProfileAllowed() {
        AuthorizationDecision decision = decide(List.of("ROLE_ACCOUNTANT"), "GET", "/api/account/auth/me");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("READ_ONLY allows authorized reads")
    void readOnlyAllowsRead() {
        CurrentUserContext.setAccessMode("READ_ONLY");
        AuthorizationDecision decision = decide(List.of("MODULE_CUSTOMERS_ACTION_READ"), "GET", "/api/account/customers");
        assertThat(decision.isGranted()).isTrue();
    }

    @Test
    @DisplayName("READ_ONLY denies business mutations even with a write permission")
    void readOnlyDeniesMutation() {
        CurrentUserContext.setAccessMode("READ_ONLY");
        AuthorizationDecision decision = decide(List.of("MODULE_CUSTOMERS_ACTION_WRITE"), "POST", "/api/account/customers");
        assertThat(decision.isGranted()).isFalse();
    }
}