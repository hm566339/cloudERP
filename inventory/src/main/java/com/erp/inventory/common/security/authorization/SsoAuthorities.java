package com.erp.inventory.common.security.authorization;

import com.erp.inventory.modules.auth.dto.ssoresponse.FeatureResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.PermissionResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Converts the verified SSO response into Spring Security authorities.
 * <p>
 * Authority formats (all upper-case, trimmed):
 * <ul>
 *   <li>{@code ROLE_<name>}                  - for every active role returned by SSO</li>
 *   <li>{@code FEATURE_<code>}               - for every active feature returned by SSO
 *                                              (from the features list and from permission entries)</li>
 *   <li>{@code MODULE_<module>_ACTION_<a>}   - for every permission with active AND allowed,
 *                                              keyed by SSO {@code moduleName} + {@code action}</li>
 *   <li>{@code FEATURE_<feature>_ACTION_<a>} - same, keyed by SSO {@code featureCode} + {@code action}</li>
 *   <li>{@code PERMISSION_<code>}            - informational only, never used to grant endpoint access</li>
 * </ul>
 * Roles never grant business access by themselves (except the SSO-provided SYSTEM_ADMIN role,
 * which is preserved as an explicit SSO policy). A permission is only honored when
 * {@code active == true} AND {@code allowed == true}.
 */
public final class SsoAuthorities {

    public static final String SYSTEM_ADMIN_ROLE = "ROLE_SYSTEM_ADMIN";

    private SsoAuthorities() {
        throw new AssertionError("Cannot instantiate SsoAuthorities");
    }

    public static List<GrantedAuthority> from(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null || verifyResponse.getUser() == null) {
            return Collections.emptyList();
        }
        UserResponse user = verifyResponse.getUser();

        Set<String> authorities = new LinkedHashSet<>();

        // Active roles (authority only; grants nothing by itself).
        if (user.getRole() != null) {
            for (RoleResponse role : user.getRole()) {
                if (role != null && Boolean.TRUE.equals(role.isStatus()) && hasText(role.getName())) {
                    authorities.add("ROLE_" + normalize(role.getName()));
                }
            }
        }

        // Active features, from both the user object and a response-root key.
        List<FeatureResponse> features = new ArrayList<>();
        if (user.getFeatures() != null) {
            features.addAll(user.getFeatures());
        }
        if (verifyResponse.getFeatures() != null) {
            features.addAll(verifyResponse.getFeatures());
        }
        for (FeatureResponse feature : features) {
            if (feature != null && hasText(feature.getFeatureCode())) {
                authorities.add("FEATURE_" + normalize(feature.getFeatureCode()));
            }
        }

        // Active AND allowed permissions, from both the user object and a response-root key.
        List<PermissionResponse> permissions = new ArrayList<>();
        if (user.getPermissions() != null) {
            permissions.addAll(user.getPermissions());
        }
        if (verifyResponse.getPermissions() != null) {
            permissions.addAll(verifyResponse.getPermissions());
        }
        for (PermissionResponse permission : permissions) {
                if (permission == null) {
                    continue;
                }
                if (!isActiveAndAllowed(permission)) {
                    // Fail closed: inactive or disallowed permissions grant nothing.
                    continue;
                }
                String action = normalize(permission.getAction());
                if (action == null) {
                    // Without an action the permission cannot be scoped to a request decision.
                    continue;
                }
                String module = normalize(permission.getModuleName());
                if (module != null) {
                    authorities.add("MODULE_" + module + "_ACTION_" + action);
                    String canonicalModule = normalizeModuleName(module);
                    if (canonicalModule != null && !canonicalModule.equals(module)) {
                        authorities.add("MODULE_" + canonicalModule + "_ACTION_" + action);
                    }
                }
                String feature = normalize(permission.getFeatureCode());
                if (feature != null) {
                    authorities.add("FEATURE_" + feature + "_ACTION_" + action);
                    // An active, allowed permission makes the feature itself active for the user.
                    authorities.add("FEATURE_" + feature);
                }
                String code = normalize(permission.getPermissionCode());
                if (code != null) {
                    authorities.add("PERMISSION_" + code);
                }
            }

        return authorities.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList());
    }

    public static boolean isActiveAndAllowed(PermissionResponse permission) {
        return Boolean.TRUE.equals(permission.getActive()) && Boolean.TRUE.equals(permission.getAllowed());
    }

    public static boolean isSystemAdmin(Collection<? extends GrantedAuthority> authorities) {
        return hasRole(authorities, SYSTEM_ADMIN_ROLE);
    }

    public static boolean hasRole(Collection<? extends GrantedAuthority> authorities, String role) {
        if (authorities == null || role == null) {
            return false;
        }
        String target = normalize(role);
        return authorities.stream().anyMatch(a -> target.equals(normalize(a.getAuthority())));
    }

    /**
     * Canonical module normalization:
     * accountDev / accountPro / account -> ACCOUNT
     * inventory -> INVENTORY
     * crm -> CRM
     */
    public static String normalizeModuleName(String module) {
        if (module == null) {
            return null;
        }
        String trimmed = module.trim();
        if (trimmed.equalsIgnoreCase("accountDev") || trimmed.equalsIgnoreCase("accountPro") || trimmed.equalsIgnoreCase("account")) {
            return "ACCOUNT";
        }
        if (trimmed.equalsIgnoreCase("inventory")) {
            return "INVENTORY";
        }
        if (trimmed.equalsIgnoreCase("crm")) {
            return "CRM";
        }
        return trimmed.toUpperCase();
    }

    /**
     * Grants module-scoped action access, e.g. {@code MODULE_<module>_ACTION_READ}.
     */
    public static boolean hasModuleAction(Collection<? extends GrantedAuthority> authorities, String module, String action) {
        if (hasExact(authorities, module, action, "MODULE")) {
            return true;
        }
        String canonical = normalizeModuleName(module);
        if (canonical != null && !canonical.equalsIgnoreCase(module)) {
            return hasExact(authorities, canonical, action, "MODULE");
        }
        return false;
    }

    /**
     * Grants feature-scoped action access, e.g. {@code FEATURE_<feature>_ACTION_READ}.
     */
    public static boolean hasFeatureAction(Collection<? extends GrantedAuthority> authorities, String feature, String action) {
        return hasExact(authorities, feature, action, "FEATURE");
    }

    /**
     * True when the user holds an active feature, e.g. {@code FEATURE_<code>}.
     */
    public static boolean hasFeature(Collection<? extends GrantedAuthority> authorities, String featureCode) {
        if (authorities == null || !hasText(featureCode)) {
            return false;
        }
        String target = "FEATURE_" + normalize(featureCode);
        return authorities.stream().anyMatch(a -> target.equals(normalize(a.getAuthority())));
    }

    private static boolean hasExact(Collection<? extends GrantedAuthority> authorities, String scope, String action, String prefix) {
        if (authorities == null || !hasText(scope) || !hasText(action)) {
            return false;
        }
        String target = prefix + "_" + normalize(scope) + "_ACTION_" + normalize(action);
        return authorities.stream().anyMatch(a -> target.equals(normalize(a.getAuthority())));
    }

    public static String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}