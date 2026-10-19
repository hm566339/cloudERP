package com.erp.manufacturing.security.authorization;

import com.erp.manufacturing.security.dto.sso.PermissionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class FeatureGroupPermissionResolver {

    private final SsoAuthorizationProperties properties;

    public record ModuleAction(String module, String action) {
    }

    public Set<ModuleAction> effectivePermissions(
            AuthenticatedUser user,
            Collection<? extends GrantedAuthority> authorities) {

        Set<ModuleAction> result = new LinkedHashSet<>();

        // 1. Direct active+allowed SSO permissions
        if (user != null && user.getPermissions() != null) {
            for (PermissionResponse p : user.getPermissions()) {
                if (p == null) continue;
                if (!Boolean.TRUE.equals(p.getActive()) || !Boolean.TRUE.equals(p.getAllowed())) {
                    continue;
                }
                String action = SsoAuthorities.normalize(p.getAction());
                if (action == null) continue;

                String module = SsoAuthorities.normalize(p.getModuleName());
                if (module != null) {
                    result.add(new ModuleAction(module, action));
                    String canonical = SsoAuthorities.normalizeModuleName(module);
                    if (canonical != null && !canonical.equals(module)) {
                        result.add(new ModuleAction(canonical, action));
                    }
                }
                String feature = SsoAuthorities.normalize(p.getFeatureCode());
                if (feature != null) {
                    result.add(new ModuleAction(feature, action));
                }
            }
        }

        // 2. Flat authorities fallback
        if (authorities != null) {
            for (GrantedAuthority ga : authorities) {
                if (ga == null || ga.getAuthority() == null) continue;
                String auth = ga.getAuthority().trim().toUpperCase();
                if (auth.startsWith("MODULE_") && auth.contains("_ACTION_")) {
                    int actionIdx = auth.indexOf("_ACTION_");
                    String module = auth.substring("MODULE_".length(), actionIdx);
                    String action = auth.substring(actionIdx + "_ACTION_".length());
                    result.add(new ModuleAction(module, action));
                } else if (auth.startsWith("FEATURE_") && auth.contains("_ACTION_")) {
                    int actionIdx = auth.indexOf("_ACTION_");
                    String feature = auth.substring("FEATURE_".length(), actionIdx);
                    String action = auth.substring(actionIdx + "_ACTION_".length());
                    result.add(new ModuleAction(feature, action));
                }
            }
        }

        // 3. Group-derived permissions
        Map<String, Map<String, List<String>>> featureGroups = properties.getFeatureGroups();
        if (featureGroups != null && !featureGroups.isEmpty()) {
            for (Map.Entry<String, Map<String, List<String>>> groupEntry : featureGroups.entrySet()) {
                String groupFeatureCode = SsoAuthorities.normalize(groupEntry.getKey());
                if (groupFeatureCode == null) continue;

                boolean groupHeld = (user != null && user.getActiveFeatures() != null
                        && user.getActiveFeatures().contains(groupFeatureCode))
                        || SsoAuthorities.hasFeature(authorities, groupFeatureCode);

                if (groupHeld) {
                    Map<String, List<String>> moduleActions = groupEntry.getValue();
                    if (moduleActions != null) {
                        for (Map.Entry<String, List<String>> maEntry : moduleActions.entrySet()) {
                            String mod = SsoAuthorities.normalize(maEntry.getKey());
                            List<String> actions = maEntry.getValue();
                            if (mod != null && actions != null) {
                                for (String act : actions) {
                                    String normAct = SsoAuthorities.normalize(act);
                                    if (normAct != null) {
                                        result.add(new ModuleAction(mod, normAct));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return result;
    }
}
