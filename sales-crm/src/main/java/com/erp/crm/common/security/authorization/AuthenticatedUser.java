package com.erp.crm.common.security.authorization;

import com.erp.crm.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.crm.modules.auth.dto.ssoresponse.UserResponse;
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
    private final UUID companyId;
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
                .companyId(user.getCompanyId())
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
     * True when user holds any variant of SYSTEM_ADMIN role, or belongs to root
     * system company 000000.
     */
    public boolean isSystemAdmin() {
        if ("000000".equals(companyCode) || "System001".equalsIgnoreCase(username)) {
            return true;
        }
        if (roles != null && roles.stream().anyMatch(SsoAuthorities::isSystemAdminRole)) {
            return true;
        }
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
     * (via {@code moduleName}, {@code featureCode}, or {@code permissionCode}) for the required action.
     * Evaluates module hierarchy (e.g. CRM parent module access covers CRM features),
     * singular/plural variants (CRM_INTEGRATIONS vs CRM_INTEGRATION), and action hierarchies (MANAGE/ALL implies READ/WRITE).
     */
    public boolean hasPermission(String module, String action) {
        if (!hasText(module) || !hasText(action)) {
            return false;
        }
        String targetScope = normalize(module);
        String canonicalScope = SsoAuthorities.normalizeModuleName(module);
        String targetAction = normalize(action);

        for (PermissionResponse permission : activeAndAllowedPermissions()) {
            if (isActionMatching(targetAction, normalize(permission.getAction()))) {
                String permModule = normalize(permission.getModuleName());
                String permCanonicalModule = SsoAuthorities.normalizeModuleName(permission.getModuleName());
                String permFeature = normalize(permission.getFeatureCode());
                String permCode = normalize(permission.getPermissionCode());

                // 1. Direct scope match (featureCode or moduleName)
                if (isScopeMatching(targetScope, canonicalScope, permModule, permCanonicalModule, permFeature)) {
                    return true;
                }

                // 2. Permission code match (e.g. CRM_INTEGRATIONS:READ or CRM:READ)
                if (permCode != null && isPermissionCodeMatching(targetScope, targetAction, permCode)) {
                    return true;
                }

                // 3. Parent CRM module access (e.g. CRM:READ or moduleName CRM grants CRM feature access)
                if (isCrmModuleParentMatching(targetScope, permModule, permFeature)) {
                    return true;
                }
            }
        }
        return false;
    }

    private static boolean isActionMatching(String targetAction, String permAction) {
        if (targetAction == null || permAction == null) return false;
        if (targetAction.equals(permAction)) return true;
        if ("MANAGE".equals(permAction) || "ALL".equals(permAction)) return true;
        if ("READ".equals(targetAction) && ("WRITE".equals(permAction) || "UPDATE".equals(permAction))) return true;
        return false;
    }

    private static boolean isScopeMatching(String targetScope, String canonicalScope,
                                          String permModule, String permCanonicalModule, String permFeature) {
        if (targetScope.equals(permModule) || targetScope.equals(permFeature)) return true;
        if (canonicalScope != null && (canonicalScope.equals(permCanonicalModule) || canonicalScope.equals(permFeature))) return true;
        // Singular vs plural matching (e.g. CRM_INTEGRATIONS vs CRM_INTEGRATION)
        String targetSingular = trimTrailingS(targetScope);
        if (targetSingular.equals(trimTrailingS(permFeature)) || targetSingular.equals(trimTrailingS(permModule))) return true;
        return false;
    }

    private static boolean isPermissionCodeMatching(String targetScope, String targetAction, String permCode) {
        if (permCode.equals(targetScope + ":" + targetAction)) return true;
        if (permCode.equals(trimTrailingS(targetScope) + ":" + targetAction)) return true;
        if (permCode.equals(targetScope + ":MANAGE") || permCode.equals(targetScope + ":ALL")) return true;
        if (targetScope.startsWith("CRM") && (permCode.equals("CRM:" + targetAction) || permCode.equals("CRM:MANAGE") || permCode.equals("CRM:ALL"))) {
            return true;
        }
        return false;
    }

    private static boolean isCrmModuleParentMatching(String targetScope, String permModule, String permFeature) {
        if (!targetScope.startsWith("CRM")) return false;
        return "CRM".equals(permModule) && (permFeature == null || "CRM".equals(permFeature));
    }

    private static String trimTrailingS(String val) {
        if (val != null && val.endsWith("S") && val.length() > 1) {
            return val.substring(0, val.length() - 1);
        }
        return val != null ? val : "";
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