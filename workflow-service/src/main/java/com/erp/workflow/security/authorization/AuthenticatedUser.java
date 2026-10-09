package com.erp.workflow.security.authorization;

import com.erp.workflow.security.dto.sso.FeatureResponse;
import com.erp.workflow.security.dto.sso.PermissionResponse;
import com.erp.workflow.security.dto.sso.RoleResponse;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import lombok.Builder;
import lombok.Getter;

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Structured authentication principal built from the VERIFIED SSO response.
 * <p>
 * Retains raw SSO permission objects (permissionCode, action, featureCode,
 * moduleName, active, allowed) so authorization decisions are evaluated directly
 * from SSO verification data.
 */
@Getter
@Builder
public class AuthenticatedUser implements Principal {

    private final UUID userId;
    private final String username;
    private final String companyCode;
    private final UUID organizationId;
    private final String organizationCode;
    private final String accessMode;
    private final String fullName;

    /** Active role names only (SSO status == true). */
    private final List<String> roles;
    /** Active feature codes. */
    private final Set<String> activeFeatures;
    /** Raw verified SSO permissions. */
    private final List<PermissionResponse> permissions;

    /**
     * Builds a principal from a verified SSO response.
     */
    public static AuthenticatedUser from(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null) {
            return null;
        }
        UserResponse user = verifyResponse.getUser();
        if (user == null) {
            return null;
        }

        List<String> roles = new ArrayList<>();
        if (user.getRole() != null) {
            for (RoleResponse role : user.getRole()) {
                if (role != null && Boolean.TRUE.equals(role.isStatus()) && hasText(role.getName())) {
                    roles.add(role.getName().trim());
                }
            }
        }

        Set<String> features = new LinkedHashSet<>();
        addFeatures(features, user.getFeatures());
        addFeatures(features, verifyResponse.getFeatures());

        List<PermissionResponse> permissions = new ArrayList<>();
        if (user.getPermissions() != null) {
            permissions.addAll(user.getPermissions());
        }
        if (verifyResponse.getPermissions() != null) {
            permissions.addAll(verifyResponse.getPermissions());
        }

        return AuthenticatedUser.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .companyCode(user.getCompanyCode())
                .organizationId(user.getOrganizationId())
                .organizationCode(user.getOrganizationCode())
                .accessMode(user.getAccessMode())
                .fullName(user.getFullName())
                .roles(roles)
                .activeFeatures(features)
                .permissions(permissions)
                .build();
    }

    @Override
    public String getName() {
        return username;
    }

    /**
     * SYSTEM_ADMIN role is recognized when active in the authenticated user context.
     */
    public boolean isSystemAdmin() {
        return hasActiveRole("SYSTEM_ADMIN")
                || hasActiveRole("ROLE_SYSTEM_ADMIN")
                || (roles != null && roles.stream().anyMatch(r -> {
                    String n = normalize(r);
                    return "SYSTEM_ADMIN".equals(n) || "ROLE_SYSTEM_ADMIN".equals(n);
                }));
    }

    public boolean hasActiveRole(String roleName) {
        if (roles == null || !hasText(roleName)) {
            return false;
        }
        String target = normalize(roleName);
        String targetWithoutPrefix = target.startsWith("ROLE_") ? target.substring(5) : target;
        return roles.stream().anyMatch(r -> {
            String n = normalize(r);
            if (n == null) return false;
            String nWithoutPrefix = n.startsWith("ROLE_") ? n.substring(5) : n;
            return target.equals(n) || targetWithoutPrefix.equals(nWithoutPrefix);
        });
    }

    public boolean hasActiveFeature(String featureCode) {
        return activeFeatures != null && hasText(featureCode)
                && activeFeatures.stream().anyMatch(f -> normalize(featureCode).equals(normalize(f)));
    }

    /**
     * Permissions where active == true AND allowed == true.
     */
    public List<PermissionResponse> activeAndAllowedPermissions() {
        if (permissions == null || permissions.isEmpty()) {
            return Collections.emptyList();
        }
        return permissions.stream()
                .filter(p -> p != null && SsoAuthorities.isActiveAndAllowed(p))
                .toList();
    }

    /**
     * Evaluates whether an active+allowed permission covers the given module and action.
     * Normalized and case-insensitive comparison.
     */
    public boolean hasPermission(String module, String action) {
        if (!hasText(module) || !hasText(action)) {
            return false;
        }
        String targetScope = normalize(module);
        String canonicalScope = SsoAuthorities.normalizeModuleName(module);
        String targetAction = normalize(action);
        for (PermissionResponse permission : activeAndAllowedPermissions()) {
            if (targetAction.equals(normalize(permission.getAction()))) {
                String permModule = normalize(permission.getModuleName());
                String permCanonicalModule = SsoAuthorities.normalizeModuleName(permission.getModuleName());
                String permFeature = normalize(permission.getFeatureCode());
                if (targetScope.equals(permModule) || targetScope.equals(permFeature)
                        || (canonicalScope != null && (canonicalScope.equals(permCanonicalModule) || canonicalScope.equals(permFeature)))
                        || ("WORKFLOW".equals(permModule) || "WORKFLOW".equals(permCanonicalModule))) {
                    return true;
                }
            }
        }
        return false;
    }

    public int activeAndAllowedPermissionCount() {
        return activeAndAllowedPermissions().size();
    }

    private static void addFeatures(Set<String> target, Collection<FeatureResponse> source) {
        if (source != null) {
            for (FeatureResponse feature : source) {
                if (feature != null && hasText(feature.getFeatureCode())) {
                    target.add(feature.getFeatureCode().trim());
                }
            }
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
