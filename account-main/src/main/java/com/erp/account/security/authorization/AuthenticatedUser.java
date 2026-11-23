package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.account.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
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
 * Keeps the raw permission objects (permissionCode, action, featureCode,
 * moduleName, active, allowed) so authorization decisions can be made directly
 * from the SSO data instead of a flattened string-authority namespace. The same
 * data is also exposed as authorities via {@link SsoAuthorities} for consumers
 * that rely on them (feature aspect, dashboard widget filtering).
 * <p>
 * Roles, features and permissions are accepted from both the verify-response
 * root and the nested {@code user} object, whichever the SSO service returns.
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

    /** Active role names only (SSO {@code status == true}). */
    private final List<String> roles;
    /** Active feature codes. */
    private final Set<String> activeFeatures;
    /** Raw verified SSO permissions (active/allowed flags are evaluated lazily). */
    private final List<PermissionResponse> permissions;

    /**
     * Builds a principal from a verified SSO response, merging any
     * response-root features/permissions with user-nested ones.
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
     * Only the SSO-provided SYSTEM_ADMIN role, and only when it is active.
     * An inactive SYSTEM_ADMIN role grants nothing.
     */
    public boolean isSystemAdmin() {
        return hasActiveRole(SsoAuthorities.SYSTEM_ADMIN_ROLE.substring("ROLE_".length()));
    }

    public boolean hasActiveRole(String roleName) {
        if (roles == null || !hasText(roleName)) {
            return false;
        }
        String target = normalize(roleName);
        return roles.stream().anyMatch(r -> target.equals(normalize(r)));
    }

    public boolean hasActiveFeature(String featureCode) {
        return activeFeatures != null && hasText(featureCode)
                && activeFeatures.stream().anyMatch(f -> normalize(featureCode).equals(normalize(f)));
    }

    /**
     * Permissions that are actively allowed ({@code active == true} AND
     * {@code allowed == true}). Anything else is treated as no permission.
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
     * True when an active+allowed SSO permission is scoped to the given module
     * (via {@code moduleName} or {@code featureCode}) for the required action.
     * Matching is case-insensitive on both module and action.
     */
    public boolean hasPermission(String module, String action) {
        if (!hasText(module) || !hasText(action)) {
            return false;
        }
        String targetScope = normalize(module);
        String canonicalScope = SsoAuthorities.normalizeModuleName(module);
        String targetAction = normalize(action);
        for (PermissionResponse permission : activeAndAllowedPermissions()) {
            String permCode = normalize(permission.getPermissionCode());
            String permAction = normalize(permission.getAction());

            // 1. Direct permissionCode check (e.g. CUSTOMERS:READ, CUSTOMER:READ, ACCOUNT:CUSTOMERS:READ)
            if (permCode != null) {
                if (permCode.equals(targetScope + ":" + targetAction)
                        || permCode.equals(targetScope + "_" + targetAction)
                        || (targetScope.endsWith("S") && permCode.equals(targetScope.substring(0, targetScope.length() - 1) + ":" + targetAction))
                        || permCode.equals(targetScope + "S:" + targetAction)
                        || permCode.endsWith(":" + targetScope + ":" + targetAction)) {
                    return true;
                }
            }

            // 2. Action + module/feature check
            if (targetAction.equals(permAction)) {
                String permModule = normalize(permission.getModuleName());
                String permCanonicalModule = SsoAuthorities.normalizeModuleName(permission.getModuleName());
                String permFeature = normalize(permission.getFeatureCode());

                boolean scopeMatches = targetScope.equals(permModule) || targetScope.equals(permFeature)
                        || (canonicalScope != null && (canonicalScope.equals(permCanonicalModule) || canonicalScope.equals(permFeature)));

                // Check singular/plural variants (e.g. CUSTOMERS vs CUSTOMER)
                if (!scopeMatches && permFeature != null) {
                    if (targetScope.endsWith("S") && targetScope.substring(0, targetScope.length() - 1).equals(permFeature)) {
                        scopeMatches = true;
                    } else if (permFeature.endsWith("S") && permFeature.substring(0, permFeature.length() - 1).equals(targetScope)) {
                        scopeMatches = true;
                    }
                }

                if (scopeMatches) {
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