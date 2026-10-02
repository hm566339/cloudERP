package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link FeatureGroupPermissionResolver}.
 * <p>
 * Group access is identified from ACTIVE feature codes only (features list OR active+
 * allowed permission featureCode). Group-derived permissions are additive, de-duplicated
 * and strictly scoped to the configured module/action pairs.
 */
class FeatureGroupPermissionResolverTest {

    private SsoAuthorizationProperties properties;
    private FeatureGroupPermissionResolver resolver;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setFeatureGroups(Map.of(
                "SALES_INVOICE", Map.of(
                        "SALES_INVOICES", List.of("READ", "CREATE", "UPDATE"),
                        "CUSTOMERS", List.of("READ"),
                        "HSN_SAC", List.of("READ"),
                        "SALES_TAXES", List.of("READ"),
                        "GST_SLABS", List.of("READ"))));
        resolver = new FeatureGroupPermissionResolver(properties);
    }

    private AuthenticatedUser user(Set<String> features, List<PermissionResponse> permissions) {
        return AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .roles(List.of())
                .activeFeatures(features == null ? new LinkedHashSet<>() : new LinkedHashSet<>(features))
                .permissions(permissions == null ? List.of() : permissions)
                .build();
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

    private Set<String> modules(Set<FeatureGroupPermissionResolver.ModuleAction> effective) {
        Set<String> keys = new LinkedHashSet<>();
        for (FeatureGroupPermissionResolver.ModuleAction p : effective) {
            keys.add(p.module() + ":" + p.action());
        }
        return keys;
    }

    // ── Sales Invoice group access ────────────────────────────────────────

    @Test
    @DisplayName("Active SALES_INVOICE feature derives every configured group permission")
    void salesInvoiceGroupDerivesAllConfiguredPermissions() {
        AuthenticatedUser user = user(Set.of("SALES_INVOICE"), List.of());
        Set<String> effective = modules(resolver.effectivePermissions(user, List.of()));

        assertThat(effective).contains(
                "SALES_INVOICES:READ", "SALES_INVOICES:CREATE", "SALES_INVOICES:UPDATE",
                "CUSTOMERS:READ", "HSN_SAC:READ", "SALES_TAXES:READ", "GST_SLABS:READ");
    }

    @Test
    @DisplayName("Active group feature activates only via its feature code, not arbitrary permissions")
    void unrelatedActiveFeatureDoesNotDeriveGroup() {
        AuthenticatedUser user = user(Set.of("PAYMENTS"), List.of());
        Set<FeatureGroupPermissionResolver.ModuleAction> effective = resolver.effectivePermissions(user, List.of());
        assertThat(modules(effective)).isEmpty();
    }

    // ── Customer READ dependency (no WRITE/CREATE/UPDATE on CUSTOMERS) ────

    @Test
    @DisplayName("Group grants CUSTOMERS READ only - never WRITE/CREATE/UPDATE on CUSTOMERS")
    void customerDependencyIsReadOnly() {
        AuthenticatedUser user = user(Set.of("SALES_INVOICE"), List.of());
        Set<String> effective = modules(resolver.effectivePermissions(user, List.of()));

        assertThat(effective).contains("CUSTOMERS:READ");
        assertThat(effective).doesNotContain("CUSTOMERS:WRITE", "CUSTOMERS:CREATE", "CUSTOMERS:UPDATE", "CUSTOMERS:DELETE");
    }

    // ── Missing dependency ────────────────────────────────────────────────

    @Test
    @DisplayName("Modules not configured under the group are NOT derived")
    void missingDependencyNotDerived() {
        AuthenticatedUser user = user(Set.of("SALES_INVOICE"), List.of());
        Set<String> effective = modules(resolver.effectivePermissions(user, List.of()));

        assertThat(effective).doesNotContain("VENDORS:READ", "PURCHASE_ORDERS:READ", "GENERAL_LEDGER:READ");
    }

    // ── Inactive / disallowed permission cannot activate a group ──────────

    @Test
    @DisplayName("Inactive permission carrying the group featureCode does NOT activate the group")
    void inactiveGroupPermissionDoesNotActivateGroup() {
        PermissionResponse inactive = permission("SALES_INVOICES", "READ", false, true);
        inactive.setModuleName(null);
        inactive.setFeatureCode("SALES_INVOICE");

        AuthenticatedUser user = user(Set.of(), List.of(inactive));
        assertThat(modules(resolver.effectivePermissions(user, List.of())))
                .doesNotContain("CUSTOMERS:READ", "SALES_INVOICES:CREATE");
    }

    @Test
    @DisplayName("Disallowed permission carrying the group featureCode does NOT activate the group")
    void disallowedGroupPermissionDoesNotActivateGroup() {
        PermissionResponse disallowed = permission("SALES_INVOICES", "READ", true, false);
        disallowed.setModuleName(null);
        disallowed.setFeatureCode("SALES_INVOICE");

        AuthenticatedUser user = user(Set.of(), List.of(disallowed));
        assertThat(modules(resolver.effectivePermissions(user, List.of())))
                .doesNotContain("CUSTOMERS:READ", "SALES_INVOICES:READ");
    }

    @Test
    @DisplayName("Active+allowed permission carrying the group featureCode DOES activate the group")
    void activeAllowedGroupPermissionActivatesGroup() {
        PermissionResponse active = permission("SALES_INVOICES", "READ", true, true);
        active.setModuleName(null);
        active.setFeatureCode("SALES_INVOICE");

        AuthenticatedUser user = user(Set.of(), List.of(active));
        assertThat(modules(resolver.effectivePermissions(user, List.of())))
                .contains("CUSTOMERS:READ", "SALES_INVOICES:CREATE", "SALES_INVOICES:READ");
    }

    // ── Direct permissions preserved + duplicates avoided ────────────────

    @Test
    @DisplayName("Direct active+allowed permissions are preserved next to group-derived ones")
    void directPermissionsPreserved() {
        AuthenticatedUser user = user(Set.of("SALES_INVOICE"),
                List.of(permission("SALES_INVOICES", "DELETE", true, true)));
        Set<String> effective = modules(resolver.effectivePermissions(user, List.of()));

        assertThat(effective).contains("SALES_INVOICES:DELETE", "SALES_INVOICES:CREATE", "CUSTOMERS:READ");
    }

    @Test
    @DisplayName("Group and direct permission for the same module/action are de-duplicated")
    void duplicatesRemoved() {
        AuthenticatedUser user = user(Set.of("SALES_INVOICE"),
                List.of(permission("CUSTOMERS", "READ", true, true)));
        Set<FeatureGroupPermissionResolver.ModuleAction> effective = resolver.effectivePermissions(user, List.of());

        assertThat(effective).containsOnlyOnce(
                new FeatureGroupPermissionResolver.ModuleAction("CUSTOMERS", "READ"));
    }

    // ── Group activation from flat FEATURE_ authority ─────────────────────

    @Test
    @DisplayName("Flat FEATURE_ authority also activates a configured group")
    void featureAuthorityActivatesGroup() {
        AuthenticatedUser user = user(Set.of(), List.of());
        Set<String> effective = modules(resolver.effectivePermissions(user,
                List.of(() -> "FEATURE_SALES_INVOICE")));

        assertThat(effective).contains("CUSTOMERS:READ", "SALES_INVOICES:CREATE");
    }

    // ── Case-insensitive lookups ──────────────────────────────────────────

    @Test
    @DisplayName("Group feature code lookup is case-insensitive")
    void caseInsensitiveGroupLookup() {
        AuthenticatedUser user = user(Set.of("sales_invoice"), List.of());
        Set<String> effective = modules(resolver.effectivePermissions(user, List.of()));
        assertThat(effective).contains("CUSTOMERS:READ");
    }
}