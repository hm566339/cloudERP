package com.erp.manufacturing.security.authorization;

import com.erp.manufacturing.security.dto.sso.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.*;
import java.util.stream.Collectors;

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

        // Active roles
        if (user.getRole() != null) {
            for (RoleResponse role : user.getRole()) {
                if (role != null && role.isStatus() && hasText(role.getName())) {
                    authorities.add("ROLE_" + normalize(role.getName()));
                }
            }
        }

        // Active features
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

        // Active AND allowed permissions
        List<PermissionResponse> permissions = new ArrayList<>();
        if (user.getPermissions() != null) {
            permissions.addAll(user.getPermissions());
        }
        if (verifyResponse.getPermissions() != null) {
            permissions.addAll(verifyResponse.getPermissions());
        }
        for (PermissionResponse permission : permissions) {
            if (permission == null) continue;
            if (!isActiveAndAllowed(permission)) continue;

            String action = normalize(permission.getAction());
            if (action == null) continue;

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

    public static String normalizeModuleName(String module) {
        if (module == null) return null;
        String trimmed = module.trim();
        if (trimmed.equalsIgnoreCase("manufacturing") || trimmed.equalsIgnoreCase("mfg")) {
            return "MANUFACTURING";
        }
        return trimmed.toUpperCase();
    }

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

    public static boolean hasFeatureAction(Collection<? extends GrantedAuthority> authorities, String feature, String action) {
        return hasExact(authorities, feature, action, "FEATURE");
    }

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
