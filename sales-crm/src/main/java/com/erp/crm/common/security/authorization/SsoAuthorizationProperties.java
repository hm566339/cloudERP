package com.erp.crm.common.security.authorization;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * SSO-only authorization routing configuration.
 * <p>
 * This configuration intentionally contains NO roles, NO role-to-module mappings and NO
 * role-level permissions. Those are exclusively managed by the SSO service.
 * <p>
 * It only describes how an incoming request is mapped onto the SSO authorization namespace:
 * <ul>
 *   <li>{@code modules} - maps SSO module codes to URL (Ant) patterns. Purely a routing aid:
 *       which SSO module does this request belong to? It grants nothing by itself.</li>
 *   <li>{@code method-actions} - explicit HTTP method to SSO action(s) mapping.
 *       Defaults: GET->READ, POST->[CREATE, WRITE], PUT/PATCH->[UPDATE, WRITE], DELETE->DELETE.
 *       The default POST/PUT/PATCH accepting WRITE is documented behavior driven by SSO
 *       permission data ({@code action}-field), it is NOT an automatic cross-inference.</li>
 *   <li>{@code custom-action-suffixes} - maps URL suffixes to SSO actions (e.g. {@code /approve}).
 *       Extend this list for any other action that SSO dynamically supports.</li>
 *   <li>{@code write-implies-create-update} - when {@code true}, an active+allowed WRITE
 *       permission also satisfies CREATE and UPDATE requirements. Default {@code false}.
 *       This is the ONLY explicit, opt-in switch for that escalation. Nothing is ever
 *       inferred silently.</li>
 * </ul>
 */
@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "sso.authorization")
public class SsoAuthorizationProperties {

    /** SSO module code -> list of Ant URL patterns (routing only, grants nothing). */
    private Map<String, List<String>> modules = new LinkedHashMap<>();

    /** HTTP method -> candidate SSO actions that satisfy the request. */
    private Map<String, List<String>> methodActions = defaultMethodActions();

    /** URL suffix -> SSO action (custom/state-transition endpoints). */
    private Map<String, String> customActionSuffixes = defaultCustomActionSuffixes();

    /**
     * Explicit opt-in for treating an active+allowed WRITE permission as CREATE/UPDATE.
     * Never silently inferred. See class Javadoc.
     */
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
        map.put("/award", "AWARD");
        map.put("/reject", "REJECT");
        map.put("/cancel", "CANCEL");
        map.put("/send", "SEND");
        map.put("/reverse", "REVERSE");
        map.put("/close", "CLOSE");
        map.put("/post", "POST");
        map.put("/confirm", "CONFIRM");
        map.put("/verify", "UPDATE");
        map.put("/export", "EXPORT");
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
        String cleanUri = uri;
        int queryIndex = cleanUri.indexOf('?');
        if (queryIndex >= 0) {
            cleanUri = cleanUri.substring(0, queryIndex);
        }
        int fragmentIndex = cleanUri.indexOf('#');
        if (fragmentIndex >= 0) {
            cleanUri = cleanUri.substring(0, fragmentIndex);
        }
        while (cleanUri.length() > 1 && cleanUri.endsWith("/")) {
            cleanUri = cleanUri.substring(0, cleanUri.length() - 1);
        }
        String lower = cleanUri.toLowerCase();
        for (Map.Entry<String, String> entry : customActionSuffixes.entrySet()) {
            String suffix = entry.getKey().toLowerCase();
            boolean matched = "/export".equals(suffix)
                    ? lower.contains(suffix)
                    : lower.endsWith(suffix);
            if (matched) {
                return entry.getValue();
            }
        }
        return null;
    }
}