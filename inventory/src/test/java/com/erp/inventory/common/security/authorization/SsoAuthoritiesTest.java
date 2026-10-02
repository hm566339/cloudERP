package com.erp.inventory.common.security.authorization;

import com.erp.inventory.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.inventory.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class SsoAuthoritiesTest {

    private TokenVerifyResponse buildVerifyResponse(
            List<RoleResponse> roles,
            List<FeatureResponse> features,
            List<PermissionResponse> permissions) {
        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("johndoe")
                .companyCode("ACME")
                .fullName("John Doe")
                .accountStatus(AccountStatus.ACTIVE)
                .role(roles)
                .features(features)
                .permissions(permissions)
                .build();
        return TokenVerifyResponse.builder().valid(true).user(user).build();
    }

    private Set<String> authorityStrings(TokenVerifyResponse response) {
        return SsoAuthorities.from(response).stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
    }

    @Test
    @DisplayName("Active role becomes ROLE_ authority")
    void activeRoleConverted() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(true).build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(role), List.of(), List.of()));
        assertThat(auth).contains("ROLE_INVENTORY_MANAGER");
    }

    @Test
    @DisplayName("Inactive role is NOT converted")
    void inactiveRoleNotConverted() {
        RoleResponse role = RoleResponse.builder().name("INVENTORY_MANAGER").status(false).build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(role), List.of(), List.of()));
        assertThat(auth).doesNotContain("ROLE_INVENTORY_MANAGER");
    }

    @Test
    @DisplayName("SSO READ permission is converted to module+feature authorities")
    void ssoReadPermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .permissionCode("PRODUCTS:READ")
                .action("READ")
                .moduleName("PRODUCTS")
                .featureCode("PRODUCT_MGMT")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));

        assertThat(auth).contains("MODULE_PRODUCTS_ACTION_READ");
        assertThat(auth).contains("FEATURE_PRODUCT_MGMT_ACTION_READ");
        assertThat(auth).contains("FEATURE_PRODUCT_MGMT");
        assertThat(auth).contains("PERMISSION_PRODUCTS:READ");
    }

    @Test
    @DisplayName("SSO WRITE permission is converted to a scoped WRITE authority")
    void ssoWritePermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("WRITE")
                .moduleName("STOCK")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).contains("MODULE_STOCK_ACTION_WRITE");
    }

    @Test
    @DisplayName("SSO DELETE permission is converted to a scoped DELETE authority")
    void ssoDeletePermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("PRODUCTS")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).contains("MODULE_PRODUCTS_ACTION_DELETE");
    }

    @Test
    @DisplayName("Inactive permission grants nothing")
    void inactivePermissionGrantsNothing() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("READ")
                .moduleName("PRODUCTS")
                .active(false)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_PRODUCTS_ACTION_READ", "FEATURE_PRODUCTS");
    }

    @Test
    @DisplayName("Disallowed permission grants nothing")
    void disallowedPermissionGrantsNothing() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("PRODUCTS")
                .active(true)
                .allowed(false)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_PRODUCTS_ACTION_DELETE");
    }

    private FeatureResponse feature(String code) {
        return FeatureResponse.builder().featureCode(code).build();
    }

    @Test
    @DisplayName("Missing permission (null permission list) grants only roles/features")
    void missingPermissionsGrantOnlyRolesAndFeatures() {
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(feature("STOCK")), List.of()));
        assertThat(auth).contains("FEATURE_STOCK");
        assertThat(auth).noneMatch(a -> a.startsWith("MODULE_") || a.startsWith("PERMISSION_"));
    }

    @Test
    @DisplayName("Permission without an action is skipped (cannot be scoped)")
    void permissionWithoutActionSkipped() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("PRODUCTS")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_PRODUCTS_ACTION_");
    }

    @Test
    @DisplayName("Active features list becomes FEATURE_ authorities")
    void activeFeaturesConverted() {
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(),
                List.of(feature("STOCK"), feature("reports")), List.of()));
        assertThat(auth).contains("FEATURE_STOCK", "FEATURE_REPORTS");
    }

    @Test
    @DisplayName("System admin is detected only via the SSO role authority")
    void systemAdminDetection() {
        TokenVerifyResponse sysAdmin = buildVerifyResponse(
                List.of(RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build()),
                List.of(), List.of());
        TokenVerifyResponse regular = buildVerifyResponse(List.of(), List.of(), List.of());

        assertThat(SsoAuthorities.isSystemAdmin(SsoAuthorities.from(sysAdmin))).isTrue();
        assertThat(SsoAuthorities.isSystemAdmin(SsoAuthorities.from(regular))).isFalse();
    }
}