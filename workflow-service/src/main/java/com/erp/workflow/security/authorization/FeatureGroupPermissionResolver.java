package com.erp.workflow.security.authorization;

import com.erp.workflow.security.dto.sso.PermissionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Resolves the effective API permission set for a user by merging direct SSO permissions,
 * flat authorities fallback, and configured feature group permissions.
 */
@Component
@RequiredArgsConstructor
public class FeatureGroupPermissionResolver {

    private final SsoAuthorizationProperties properties;

    public record ModuleAction(String module, String action) {
    }

    public Set<ModuleAction> effectivePermissions(
            AuthenticatedUser user,
            Collection<? extends GrantedAuthority> authorities) {
        Set<ModuleAction> effective = new LinkedHashSet<>();

        addDirectPermissions(effective, user);
        addAuthorityPermissions(effective, authorities);
        addGroupDerivedPermissions(effective, user, authorities);

        return effective;
    }

    public boolean hasEffectivePermission(
            AuthenticatedUser user,
            Collection<? extends GrantedAuthority> authorities,
            String module,
            String action) {
        String normalizedModule = SsoAuthorities.normalize(module);
        String normalizedAction = SsoAuthorities.normalize(action);
        if (normalizedModule == null || normalizedModule.isBlank()
                || normalizedAction == null || normalizedAction.isBlank()) {
            return false;
        }
        Set<ModuleAction> effective = effectivePermissions(user, authorities);
        return effective.contains(new ModuleAction(normalizedModule, normalizedAction));
    }

    Set<String> activeGroupFeatures(AuthenticatedUser user, Collection<? extends GrantedAuthority> authorities) {
        Set<String> active = new LinkedHashSet<>();

        if (user != null) {
            if (user.isSystemAdmin()) {
                active.add("WORKFLOW_ADMIN");
                active.add("SYSTEM_ADMIN");
            }
            if (user.getActiveFeatures() != null) {
                for (String featureCode : user.getActiveFeatures()) {
                    if (hasText(featureCode)) {
                        active.add(SsoAuthorities.normalize(featureCode));
                    }
                }
            }
            for (PermissionResponse permission : user.activeAndAllowedPermissions()) {
                if (permission != null && hasText(permission.getFeatureCode())) {
                    active.add(SsoAuthorities.normalize(permission.getFeatureCode()));
                }
            }
        }

        if (authorities != null) {
            if (SsoAuthorities.isSystemAdmin(authorities)) {
                active.add("WORKFLOW_ADMIN");
                active.add("SYSTEM_ADMIN");
            }
            for (GrantedAuthority authority : authorities) {
                if (authority == null) {
                    continue;
                }
                String value = authority.getAuthority();
                if (value != null && value.startsWith("FEATURE_") && !value.contains("_ACTION_")) {
                    active.add(SsoAuthorities.normalize(value.substring("FEATURE_".length())));
                }
            }
        }

        active.retainAll(configuredGroupKeys());
        return active;
    }

    private void addDirectPermissions(Set<ModuleAction> effective, AuthenticatedUser user) {
        if (user == null) {
            return;
        }
        for (PermissionResponse permission : user.activeAndAllowedPermissions()) {
            addScoped(effective, permission.getModuleName(), permission.getAction());
            addScoped(effective, permission.getFeatureCode(), permission.getAction());
        }
    }

    private void addAuthorityPermissions(Set<ModuleAction> effective, Collection<? extends GrantedAuthority> authorities) {
        if (authorities == null) {
            return;
        }
        for (GrantedAuthority authority : authorities) {
            if (authority == null || authority.getAuthority() == null) {
                continue;
            }
            String value = authority.getAuthority();
            int actionIndex = value.indexOf("_ACTION_");
            if (value.startsWith("MODULE_") && actionIndex > 0) {
                addScoped(effective,
                        value.substring("MODULE_".length(), actionIndex),
                        value.substring(actionIndex + "_ACTION_".length()));
            } else if (value.startsWith("FEATURE_") && actionIndex > 0) {
                addScoped(effective,
                        value.substring("FEATURE_".length(), actionIndex),
                        value.substring(actionIndex + "_ACTION_".length()));
            }
        }
    }

    private void addGroupDerivedPermissions(
            Set<ModuleAction> effective,
            AuthenticatedUser user,
            Collection<? extends GrantedAuthority> authorities) {
        for (String group : activeGroupFeatures(user, authorities)) {
            Map<String, List<String>> mods = groupModules(group);
            if (mods == null) {
                continue;
            }
            for (Map.Entry<String, List<String>> moduleEntry : mods.entrySet()) {
                String module = SsoAuthorities.normalize(moduleEntry.getKey());
                if (module == null || module.isBlank()) {
                    continue;
                }
                for (String action : moduleEntry.getValue()) {
                    String normalizedAction = SsoAuthorities.normalize(action);
                    if (normalizedAction == null || normalizedAction.isBlank()) {
                        continue;
                    }
                    effective.add(new ModuleAction(module, normalizedAction));
                }
            }
        }
    }

    private void addScoped(Set<ModuleAction> effective, String scope, String action) {
        String normalizedScope = SsoAuthorities.normalize(scope);
        String normalizedAction = SsoAuthorities.normalize(action);
        if (normalizedScope == null || normalizedScope.isBlank()
                || normalizedAction == null || normalizedAction.isBlank()) {
            return;
        }
        effective.add(new ModuleAction(normalizedScope, normalizedAction));
    }

    private Map<String, List<String>> groupModules(String normalizedGroup) {
        if (properties.getFeatureGroups() == null) {
            return null;
        }
        for (Map.Entry<String, Map<String, List<String>>> entry : properties.getFeatureGroups().entrySet()) {
            if (normalizedGroup.equals(SsoAuthorities.normalize(entry.getKey()))) {
                return entry.getValue();
            }
        }
        return null;
    }

    private Set<String> configuredGroupKeys() {
        Set<String> keys = new LinkedHashSet<>();
        if (properties.getFeatureGroups() == null) {
            return keys;
        }
        for (String key : properties.getFeatureGroups().keySet()) {
            if (hasText(key)) {
                keys.add(SsoAuthorities.normalize(key));
            }
        }
        return keys;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
