package com.erp.auth_service.security.authorization;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.*;

@Data
@Component
@ConfigurationProperties(prefix = "sso.authorization")
public class AuthorizationProperties {

    private Map<String, List<String>> modules = new LinkedHashMap<>();
    private Map<String, List<String>> methodActions = new LinkedHashMap<>();
    private Map<String, String> customActionSuffixes = new LinkedHashMap<>();
    private Map<String, Map<String, List<String>>> featureGroups = new LinkedHashMap<>();
    private boolean writeImpliesCreateUpdate = false;

    public record CompiledModulePattern(String pattern, String module) {}

    @Getter
    private final List<CompiledModulePattern> compiledModulePatterns = new ArrayList<>();

    private static final Set<String> ALLOWED_HTTP_METHODS = Set.of(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
    );

    @PostConstruct
    public void validate() {
        if (modules == null || modules.isEmpty()) {
            throw new IllegalStateException("Invalid authorization configuration: 'modules' mapping must not be empty");
        }

        Set<String> seenPatterns = new HashSet<>();
        List<CompiledModulePattern> compiledList = new ArrayList<>();

        for (Map.Entry<String, List<String>> entry : modules.entrySet()) {
            String moduleName = entry.getKey();
            if (moduleName == null || moduleName.trim().isEmpty()) {
                throw new IllegalStateException("Invalid authorization configuration: module name must not be blank");
            }

            List<String> patterns = entry.getValue();
            if (patterns == null || patterns.isEmpty()) {
                throw new IllegalStateException("Invalid authorization configuration: module '" + moduleName + "' has no URL patterns");
            }

            for (String pattern : patterns) {
                if (pattern == null || pattern.trim().isEmpty()) {
                    throw new IllegalStateException("Invalid authorization configuration: module '" + moduleName + "' has an empty URL pattern");
                }
                String normalizedPattern = pattern.trim();
                if (!seenPatterns.add(normalizedPattern)) {
                    throw new IllegalStateException("Duplicate URL pattern detected in authorization configuration: " + normalizedPattern);
                }
                compiledList.add(new CompiledModulePattern(normalizedPattern, moduleName.trim().toUpperCase(Locale.ROOT)));
            }
        }

        // Sort patterns: longer/more specific patterns first
        compiledList.sort((a, b) -> Integer.compare(b.pattern().length(), a.pattern().length()));
        compiledModulePatterns.clear();
        compiledModulePatterns.addAll(compiledList);

        // Validate methodActions
        if (methodActions != null) {
            for (Map.Entry<String, List<String>> entry : methodActions.entrySet()) {
                String method = entry.getKey();
                if (method == null || !ALLOWED_HTTP_METHODS.contains(method.trim().toUpperCase(Locale.ROOT))) {
                    throw new IllegalStateException("Invalid authorization configuration: invalid HTTP method '" + method + "'");
                }
                List<String> actions = entry.getValue();
                if (actions == null || actions.isEmpty()) {
                    throw new IllegalStateException("Invalid authorization configuration: HTTP method '" + method + "' has no actions defined");
                }
                for (String action : actions) {
                    if (action == null || action.trim().isEmpty()) {
                        throw new IllegalStateException("Invalid authorization configuration: HTTP method '" + method + "' has an empty action defined");
                    }
                }
            }
        }

        // Validate and normalize customActionSuffixes
        if (customActionSuffixes != null) {
            Map<String, String> normalizedSuffixes = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : customActionSuffixes.entrySet()) {
                String suffix = entry.getKey();
                if (suffix == null || suffix.trim().isEmpty()) {
                    throw new IllegalStateException("Invalid authorization configuration: custom suffix must not be empty");
                }
                String cleanSuffix = suffix.trim();
                if (cleanSuffix.startsWith("[") && cleanSuffix.endsWith("]")) {
                    cleanSuffix = cleanSuffix.substring(1, cleanSuffix.length() - 1).trim();
                }
                if (!cleanSuffix.startsWith("/")) {
                    cleanSuffix = "/" + cleanSuffix;
                }
                if (cleanSuffix.length() <= 1) {
                    throw new IllegalStateException("Invalid authorization configuration: custom suffix '" + suffix + "' is invalid");
                }
                String action = entry.getValue();
                if (action == null || action.trim().isEmpty()) {
                    throw new IllegalStateException("Invalid authorization configuration: custom suffix '" + suffix + "' has an empty action");
                }
                normalizedSuffixes.put(cleanSuffix, action.trim());
            }
            this.customActionSuffixes = normalizedSuffixes;
        }
    }
}
