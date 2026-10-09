package com.erp.workflow.security.authorization;

import com.erp.workflow.security.dto.sso.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SsoAuthoritiesTest {

    @Test
    @DisplayName("Active roles are included only when role status is true")
    void testActiveRolesOnlyIncluded() {
        RoleResponse activeRole = RoleResponse.builder().name("WORKFLOW_ADMIN").status(true).build();
        RoleResponse inactiveRole = RoleResponse.builder().name("INACTIVE_ROLE").status(false).build();

        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .role(List.of(activeRole, inactiveRole))
                .build();
        TokenVerifyResponse verify = TokenVerifyResponse.builder().valid(true).user(user).build();

        List<GrantedAuthority> authorities = SsoAuthorities.from(verify);
        List<String> authNames = authorities.stream().map(GrantedAuthority::getAuthority).toList();

        assertThat(authNames).contains("ROLE_WORKFLOW_ADMIN");
        assertThat(authNames).doesNotContain("ROLE_INACTIVE_ROLE");
    }

    @Test
    @DisplayName("Permissions are valid only when active == true AND allowed == true")
    void testPermissionActiveAndAllowedRules() {
        PermissionResponse valid = PermissionResponse.builder()
                .moduleName("WORKFLOW")
                .action("READ")
                .active(true)
                .allowed(true)
                .build();

        PermissionResponse inactive = PermissionResponse.builder()
                .moduleName("WORKFLOW")
                .action("CREATE")
                .active(false)
                .allowed(true)
                .build();

        PermissionResponse disallowed = PermissionResponse.builder()
                .moduleName("WORKFLOW")
                .action("DELETE")
                .active(true)
                .allowed(false)
                .build();

        PermissionResponse nullFlags = PermissionResponse.builder()
                .moduleName("WORKFLOW")
                .action("UPDATE")
                .active(null)
                .allowed(null)
                .build();

        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("testuser")
                .permissions(List.of(valid, inactive, disallowed, nullFlags))
                .build();
        TokenVerifyResponse verify = TokenVerifyResponse.builder().valid(true).user(user).build();

        List<GrantedAuthority> authorities = SsoAuthorities.from(verify);
        List<String> authNames = authorities.stream().map(GrantedAuthority::getAuthority).toList();

        assertThat(authNames).contains("MODULE_WORKFLOW_ACTION_READ");
        assertThat(authNames).doesNotContain("MODULE_WORKFLOW_ACTION_CREATE");
        assertThat(authNames).doesNotContain("MODULE_WORKFLOW_ACTION_DELETE");
        assertThat(authNames).doesNotContain("MODULE_WORKFLOW_ACTION_UPDATE");
    }

    @Test
    @DisplayName("Module name normalization is consistent and case-insensitive")
    void testModuleNameNormalization() {
        assertThat(SsoAuthorities.normalizeModuleName("workflow")).isEqualTo("WORKFLOW");
        assertThat(SsoAuthorities.normalizeModuleName("workflowDev")).isEqualTo("WORKFLOW");
        assertThat(SsoAuthorities.normalizeModuleName("workflow_definitions")).isEqualTo("WORKFLOW_DEFINITIONS");
        assertThat(SsoAuthorities.normalizeModuleName("workflowDefinitions")).isEqualTo("WORKFLOW_DEFINITIONS");
        assertThat(SsoAuthorities.normalizeModuleName("WORKFLOW_TASKS")).isEqualTo("WORKFLOW_TASKS");
    }

    @Test
    @DisplayName("Active SYSTEM_ADMIN role is recognized")
    void testSystemAdminRecognition() {
        RoleResponse adminRole = RoleResponse.builder().name("SYSTEM_ADMIN").status(true).build();
        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("admin")
                .role(List.of(adminRole))
                .build();
        TokenVerifyResponse verify = TokenVerifyResponse.builder().valid(true).user(user).build();

        List<GrantedAuthority> authorities = SsoAuthorities.from(verify);
        assertThat(SsoAuthorities.isSystemAdmin(authorities)).isTrue();
    }

    @Test
    @DisplayName("Inactive SYSTEM_ADMIN role does not grant system admin authority")
    void testInactiveSystemAdminNotRecognized() {
        RoleResponse adminRole = RoleResponse.builder().name("SYSTEM_ADMIN").status(false).build();
        UserResponse user = UserResponse.builder()
                .id(UUID.randomUUID())
                .username("admin")
                .role(List.of(adminRole))
                .build();
        TokenVerifyResponse verify = TokenVerifyResponse.builder().valid(true).user(user).build();

        List<GrantedAuthority> authorities = SsoAuthorities.from(verify);
        assertThat(SsoAuthorities.isSystemAdmin(authorities)).isFalse();
    }
}
