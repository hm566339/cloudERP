package com.erp.workflow.security.authorization;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SSO authorization routing configuration.
 * <p>
 * Contains no local roles or local permission grants. Defines how incoming
 * HTTP requests map to the SSO authorization namespace:
 * <ul>
 *   <li>{@code modules} - maps SSO module codes to Ant URL patterns</li>
 *   <li>{@code method-actions} - maps HTTP methods to expected SSO action(s)</li>
 *   <li>{@code custom-action-suffixes} - maps URL suffixes to explicit action(s)</li>
 *   <li>{@code write-implies-create-update} - explicit opt-in escalation</li>
 *   <li>{@code feature-groups} - group-based permission mapping</li>
 * </ul>
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "sso.authorization")
public class SsoAuthorizationProperties {

    /** SSO module code -> list of Ant URL patterns. */
    private Map<String, List<String>> modules = new LinkedHashMap<>();

    /** HTTP method -> candidate SSO actions. */
    private Map<String, List<String>> methodActions = defaultMethodActions();

    /** URL suffix -> SSO action. */
    private Map<String, String> customActionSuffixes = defaultCustomActionSuffixes();

    /** SSO feature code (group) -> module -> actions. */
    private Map<String, Map<String, List<String>>> featureGroups = new LinkedHashMap<>();

    /** Explicit opt-in for WRITE satisfying CREATE/UPDATE. Default false. */
    private boolean writeImpliesCreateUpdate = false;

    private static Map<String, List<String>> defaultMethodActions() {
        Map<String, List<String>> map = new LinkedHashMap<>();
        map.put("GET", List.of("READ"));
        map.put("POST", List.of("CREATE", "WRITE"));
        map.put("PUT", List.of("UPDATE", "WRITE"));
        map.put("PATCH", List.of("UPDATE", "WRITE"));
        map.put("DELETE", List.of("DELETE"));
        return map;
    }

    private static Map<String, String> defaultCustomActionSuffixes() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("/approve", "APPROVE");
        map.put("/reject", "REJECT");
        map.put("/return", "RETURN");
        map.put("/delegate", "DELEGATE");
        map.put("/cancel", "CANCEL");
        map.put("/activate", "ACTIVATE");
        map.put("/deactivate", "DEACTIVATE");
        map.put("/read-all", "UPDATE");
        map.put("/read", "UPDATE");
        map.put("/upload", "CREATE");
        map.put("/export", "EXPORT");
        map.put("/retry", "UPDATE");
        return map;
    }

    public List<String> actionsForMethod(String method) {
        if (method == null) {
            return List.of();
        }
        List<String> actions = methodActions.get(method.toUpperCase());
        return actions != null ? actions : List.of();
    }

    public String actionForSuffix(String uri) {
        if (uri == null) {
            return null;
        }
        String lower = uri.toLowerCase();
        // Sort entries by key length descending to prevent shorter suffixes from matching earlier
        List<Map.Entry<String, String>> entries = new ArrayList<>(customActionSuffixes.entrySet());
        entries.sort((e1, e2) -> Integer.compare(e2.getKey().length(), e1.getKey().length()));

        for (Map.Entry<String, String> entry : entries) {
            String suffix = entry.getKey().toLowerCase();
            boolean matched = "/export".equals(suffix)
                    ? lower.contains(suffix)
                    : (lower.endsWith(suffix) || lower.endsWith(suffix + "/"));
            if (matched) {
                return entry.getValue();
            }
        }
        return null;
    }

    public boolean hasFeatureGroup(String featureCode) {
        if (featureGroups == null || !hasText(featureCode)) {
            return false;
        }
        String target = normalize(featureCode);
        for (String key : featureGroups.keySet()) {
            if (target.equals(normalize(key))) {
                return true;
            }
        }
        return false;
    }

    public List<String> groupActionsFor(String featureCode, String module) {
        if (featureGroups == null || !hasText(featureCode) || !hasText(module)) {
            return List.of();
        }
        String targetGroup = normalize(featureCode);
        String targetModule = normalize(module);
        for (Map.Entry<String, Map<String, List<String>>> groupEntry : featureGroups.entrySet()) {
            if (!targetGroup.equals(normalize(groupEntry.getKey()))) {
                continue;
            }
            Map<String, List<String>> mods = groupEntry.getValue();
            if (mods == null) {
                return List.of();
            }
            for (Map.Entry<String, List<String>> moduleEntry : mods.entrySet()) {
                if (targetModule.equals(normalize(moduleEntry.getKey()))) {
                    List<String> actions = moduleEntry.getValue();
                    return actions != null ? actions : List.of();
                }
            }
            return List.of();
        }
        return List.of();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
