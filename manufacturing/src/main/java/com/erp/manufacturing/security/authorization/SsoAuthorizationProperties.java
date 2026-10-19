package com.erp.manufacturing.security.authorization;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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

    /** Explicit opt-in for treating WRITE as CREATE/UPDATE. Default false. */
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
        map.put("/release", "RELEASE");
        map.put("/submit", "SUBMIT");
        map.put("/submit-for-approval", "SUBMIT");
        map.put("/cancel", "CANCEL");
        map.put("/complete", "COMPLETE");
        map.put("/consume-material", "CONSUME");
        map.put("/reserve", "RESERVE");
        map.put("/release-reservations", "RELEASE");
        return map;
    }

    public List<String> actionsForMethod(String method) {
        if (method == null) {
            return List.of();
        }
        List<String> actions = methodActions.get(method.toUpperCase());
        return actions == null ? List.of() : actions;
    }

    public String actionForSuffix(String uri) {
        if (uri == null || uri.isBlank()) {
            return null;
        }
        String clean = uri.endsWith("/") && uri.length() > 1 ? uri.substring(0, uri.length() - 1) : uri;
        for (Map.Entry<String, String> entry : customActionSuffixes.entrySet()) {
            String suffix = entry.getKey();
            if (clean.endsWith(suffix)) {
                return entry.getValue();
            }
        }
        return null;
    }
}
