package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.account.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
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
        RoleResponse role = RoleResponse.builder().name("FINANCE_MANAGER").status(true).build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(role), List.of(), List.of()));
        assertThat(auth).contains("ROLE_FINANCE_MANAGER");
    }

    @Test
    @DisplayName("Inactive role is NOT converted")
    void inactiveRoleNotConverted() {
        RoleResponse role = RoleResponse.builder().name("FINANCE_MANAGER").status(false).build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(role), List.of(), List.of()));
        assertThat(auth).doesNotContain("ROLE_FINANCE_MANAGER");
    }

    @Test
    @DisplayName("SSO READ permission is converted to module+feature authorities")
    void ssoReadPermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .permissionCode("CUSTOMERS:READ")
                .action("READ")
                .moduleName("CUSTOMERS")
                .featureCode("CUSTOMER_MGMT")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));

        assertThat(auth).contains("MODULE_CUSTOMERS_ACTION_READ");
        assertThat(auth).contains("FEATURE_CUSTOMER_MGMT_ACTION_READ");
        assertThat(auth).contains("FEATURE_CUSTOMER_MGMT");
        assertThat(auth).contains("PERMISSION_CUSTOMERS:READ");
    }

    @Test
    @DisplayName("SSO WRITE permission is converted to a scoped WRITE authority")
    void ssoWritePermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("WRITE")
                .moduleName("PURCHASE_ORDERS")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).contains("MODULE_PURCHASE_ORDERS_ACTION_WRITE");
    }

    @Test
    @DisplayName("SSO DELETE permission is converted to a scoped DELETE authority")
    void ssoDeletePermissionConverted() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("CUSTOMERS")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).contains("MODULE_CUSTOMERS_ACTION_DELETE");
    }

    @Test
    @DisplayName("Inactive permission grants nothing")
    void inactivePermissionGrantsNothing() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("READ")
                .moduleName("CUSTOMERS")
                .active(false)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_CUSTOMERS_ACTION_READ", "FEATURE_CUSTOMERS");
    }

    @Test
    @DisplayName("Disallowed permission grants nothing")
    void disallowedPermissionGrantsNothing() {
        PermissionResponse perm = PermissionResponse.builder()
                .action("DELETE")
                .moduleName("CUSTOMERS")
                .active(true)
                .allowed(false)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_CUSTOMERS_ACTION_DELETE");
    }

    private FeatureResponse feature(String code) {
        return FeatureResponse.builder().featureCode(code).build();
    }

    @Test
    @DisplayName("Missing permission (null permission list) grants only roles/features")
    void missingPermissionsGrantOnlyRolesAndFeatures() {
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(feature("PAYMENTS")), List.of()));
        assertThat(auth).contains("FEATURE_PAYMENTS");
        assertThat(auth).noneMatch(a -> a.startsWith("MODULE_") || a.startsWith("PERMISSION_"));
    }

    @Test
    @DisplayName("Permission without an action is skipped (cannot be scoped)")
    void permissionWithoutActionSkipped() {
        PermissionResponse perm = PermissionResponse.builder()
                .moduleName("CUSTOMERS")
                .active(true)
                .allowed(true)
                .build();
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(), List.of(), List.of(perm)));
        assertThat(auth).doesNotContain("MODULE_CUSTOMERS_ACTION_");
    }

    @Test
    @DisplayName("Active features list becomes FEATURE_ authorities")
    void activeFeaturesConverted() {
        Set<String> auth = authorityStrings(buildVerifyResponse(List.of(),
                List.of(feature("PAYMENTS"), feature("reports")), List.of()));
        assertThat(auth).contains("FEATURE_PAYMENTS", "FEATURE_REPORTS");
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