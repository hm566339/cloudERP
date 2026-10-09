package com.erp.workflow.security.authorization;

import com.erp.workflow.security.dto.sso.FeatureResponse;
import com.erp.workflow.security.dto.sso.PermissionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class FeatureGroupPermissionResolverTest {

    private SsoAuthorizationProperties properties;
    private FeatureGroupPermissionResolver resolver;

    @BeforeEach
    void setUp() {
        properties = new SsoAuthorizationProperties();
        properties.setFeatureGroups(Map.of(
                "WORKFLOW_ADMIN", Map.of(
                        "WORKFLOW_DEFINITIONS", List.of("READ", "CREATE", "UPDATE", "DELETE", "ACTIVATE", "DEACTIVATE"),
                        "WORKFLOW_TRANSACTIONS", List.of("READ", "CREATE", "UPDATE", "DELETE", "CANCEL")
                )
        ));
        resolver = new FeatureGroupPermissionResolver(properties);
    }

    @Test
    @DisplayName("Active group feature code grants configured module and actions")
    void testActiveGroupFeatureGrantsPermissions() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("admin.user")
                .activeFeatures(Set.of("WORKFLOW_ADMIN"))
                .build();

        Set<FeatureGroupPermissionResolver.ModuleAction> effective = resolver.effectivePermissions(user, List.of());

        assertThat(effective).contains(
                new FeatureGroupPermissionResolver.ModuleAction("WORKFLOW_DEFINITIONS", "READ"),
                new FeatureGroupPermissionResolver.ModuleAction("WORKFLOW_DEFINITIONS", "ACTIVATE"),
                new FeatureGroupPermissionResolver.ModuleAction("WORKFLOW_TRANSACTIONS", "CANCEL")
        );
        assertThat(resolver.hasEffectivePermission(user, List.of(), "WORKFLOW_DEFINITIONS", "READ")).isTrue();
    }

    @Test
    @DisplayName("Inactive group feature code does not grant group permissions")
    void testInactiveGroupFeatureNotGranted() {
        AuthenticatedUser user = AuthenticatedUser.builder()
                .userId(UUID.randomUUID())
                .username("regular.user")
                .activeFeatures(Set.of("OTHER_FEATURE"))
                .build();

        Set<FeatureGroupPermissionResolver.ModuleAction> effective = resolver.effectivePermissions(user, List.of());
        assertThat(effective).doesNotContain(
                new FeatureGroupPermissionResolver.ModuleAction("WORKFLOW_DEFINITIONS", "READ")
        );
        assertThat(resolver.hasEffectivePermission(user, List.of(), "WORKFLOW_DEFINITIONS", "READ")).isFalse();
    }
}
