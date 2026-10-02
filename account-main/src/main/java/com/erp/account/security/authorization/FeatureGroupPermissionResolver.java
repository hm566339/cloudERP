package com.erp.account.security.authorization;

import com.erp.account.modules.auth.dto.ssoresponse.PermissionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Resolves the user's full <b>effective</b> API permission set.
 * <p>
 * Authorization in this application is SSO-only: every decision is derived from the
 * verified SSO response. This resolver computes the effective set as the union of:
 * <ol>
 *   <li><b>Direct SSO permissions</b> - every active+allowed
 *       {@link PermissionResponse}, scoped by {@code moduleName} or {@code featureCode}
 *       (fail closed otherwise).</li>
 *   <li><b>Flat authorities fallback</b> - {@code MODULE_<m>_ACTION_<a>} and
 *       {@code FEATURE_<f>_ACTION_<a>} authorities, so decisions also work for principals
 *       that are not {@link AuthenticatedUser}.</li>
 *   <li><b>Group-derived permissions</b> - for every active group feature code
 *       (a configured {@code sso.authorization.feature-groups} key) the user holds, the
 *       configured module/action pairs become effective API permissions.</li>
 * </ol>
 * <p>
 * A group feature code is "held" when it is present in the {@link AuthenticatedUser}
 * active features OR is carried by an active+allowed permission as its
 * {@code featureCode} - the exact same signal {@link SsoAuthorities} already uses to emit
 * the {@code FEATURE_<code>} authority. Anything that is inactive or disallowed never
 * activates a group (fail closed). Results are de-duplicated.
 * <p>
 * This resolver only ever <b>adds</b> within an explicitly configured group scope. It never
 * removes an existing right and never converts one action into another (READ stays READ,
 * WRITE is not turned into CREATE/UPDATE).
 */
@Component
@RequiredArgsConstructor
public class FeatureGroupPermissionResolver {

    private final SsoAuthorizationProperties properties;

    /** A single module-scoped action, e.g. {@code (CUSTOMERS, READ)}. */
    public record ModuleAction(String module, String action) {
    }

    /**
     * Computes the full effective permission set for a principal.
     * <p>
     * The {@code authorities} are the flat Spring Security authorities from the
     * {@code SecurityContext} and are applied only as a fallback (they mirror the same
     * verified SSO response for {@code AuthenticatedUser} principals and are the only
     * source for other principal types).
     */
    public Set<ModuleAction> effectivePermissions(
            AuthenticatedUser user,
            Collection<? extends GrantedAuthority> authorities) {
        Set<ModuleAction> effective = new LinkedHashSet<>();

        addDirectPermissions(effective, user);
        addAuthorityPermissions(effective, authorities);
        addGroupDerivedPermissions(effective, user, authorities);

        return effective;
    }

    /**
     * True when the effective permission set contains an entry for the given module/action.
     * Always fails closed on blank input.
     */
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

    /**
     * The configured group feature codes this principal currently holds (normalized).
     * A group is held only through active features or active+allowed permission feature
     * codes. Inactive or disallowed data never activates a group.
     */
    Set<String> activeGroupFeatures(AuthenticatedUser user, Collection<? extends GrantedAuthority> authorities) {
        Set<String> active = new LinkedHashSet<>();

        if (user != null) {
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
            for (GrantedAuthority authority : authorities) {
                if (authority == null) {
                    continue;
                }
                String value = authority.getAuthority();
                // Plain FEATURE_<code> only; FEATURE_<code>_ACTION_<action> entries carry no
                // feature-activation meaning here.
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
            Map<String, List<String>> modules = groupModules(group);
            if (modules == null) {
                continue;
            }
            for (Map.Entry<String, List<String>> moduleEntry : modules.entrySet()) {
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