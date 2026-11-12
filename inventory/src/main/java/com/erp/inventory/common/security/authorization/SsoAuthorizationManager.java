package com.erp.inventory.common.security.authorization;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import com.erp.inventory.common.security.CurrentUserContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

/**
 * SSO-only authorization manager.
 * <p>
 * Every decision is derived exclusively from the <b>verified</b> SSO response that
 * {@link com.erp.inventory.common.security.JwtAuthenticationFilter} stores in the
 * {@code SecurityContext}:
 * <ul>
 *   <li>When the principal is an {@link AuthenticatedUser}, decisions come from the
 *       raw SSO {@code PermissionResponse} objects (moduleName/featureCode + action,
 *       evaluated only when {@code active == true} AND {@code allowed == true}).</li>
 *   <li>Otherwise the flat SSO-derived authorities are consulted as a fallback.</li>
 * </ul>
 * There is no local YAML role/permission table and no hardcoded role granting anywhere.
 * <p>
 * Rules preserved:
 * <ul>
 *   <li>Authentication checks (unauthenticated -> denied -> 401 entry point)</li>
 *   <li>SYSTEM_ADMIN handling (only when SSO returns the active SYSTEM_ADMIN role)</li>
 *   <li>Case-insensitive module matching (YAML key vs SSO moduleName/featureCode)</li>
 *   <li>HTTP method handling via the explicit, configurable {@code method-actions} map</li>
 *   <li>Custom action URL suffix handling via {@code custom-action-suffixes}</li>
 *   <li>Existing 401 / 403 handlers (left untouched in {@code SecurityConfig})</li>
 *   <li>Tenant isolation and stateless security (unchanged)</li>
 * </ul>
 * <p>
 * Granting requires an active+allowed SSO permission for the matched module/feature AND
 * the required action. Merely having a role or merely having a feature grants nothing.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SsoAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final SsoAuthorizationProperties properties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    public AuthorizationDecision authorize(Supplier<? extends Authentication> authenticationSupplier, RequestAuthorizationContext context) {
        HttpServletRequest request = context.getRequest();

        // Internal dispatches were already authorized on the primary REQUEST dispatch.
        if (request.getDispatcherType() == DispatcherType.ASYNC || request.getDispatcherType() == DispatcherType.ERROR) {
            return new AuthorizationDecision(true);
        }

        Authentication authentication = authenticationSupplier.get();
        if (authentication == null || !authentication.isAuthenticated()) {
            debugDecision(null, request.getMethod(), normalizeUri(request), null, null,
                    null, false, "unauthenticated");
            return new AuthorizationDecision(false);
        }

        String uri = normalizeUri(request);
        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase();
        if ("HEAD".equals(method)) {
            // Spring Security treats HEAD like GET for most setups.
            method = "GET";
        }

        if ("OPTIONS".equals(method)) {
            debugDecision(authentication, method, uri, null, null, null, true, "OPTIONS always allowed");
            return new AuthorizationDecision(true);
        }

        if ("BLOCKED".equalsIgnoreCase(CurrentUserContext.getAccessMode())) {
            log.warn("BLOCKED organization access denied for URI: {}", uri);
            debugDecision(authentication, method, uri, null, null, null, false, "BLOCKED organization access denied");
            return new AuthorizationDecision(false);
        }

        if ("READ_ONLY".equalsIgnoreCase(CurrentUserContext.getAccessMode())
                && isBusinessMutation(method, uri)) {
            log.warn("READ_ONLY organization mutation denied for URI: {}", uri);
            debugDecision(authentication, method, uri, null, null, null, false, "READ_ONLY organization mutation denied");
            return new AuthorizationDecision(false);
        }

        Object principal = authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        // SYSTEM_ADMIN is preserved ONLY as an explicit SSO policy: the principal
        // carries the role only when SSO returned it with status == true.
        boolean systemAdmin = (principal instanceof AuthenticatedUser authenticatedUser && authenticatedUser.isSystemAdmin())
                || SsoAuthorities.isSystemAdmin(authorities);
        if (systemAdmin) {
            debugDecision(authentication, method, uri, null, null, null, true, "SYSTEM_ADMIN bypass");
            return new AuthorizationDecision(true);
        }

        if (isAuthenticatedProfileEndpoint(uri)) {
            debugDecision(authentication, method, uri, null, null, null, true, "authenticated profile endpoint");
            return new AuthorizationDecision(true);
        }

        // Route the request onto the SSO module namespace. Routing grants nothing;
        // it only decides which module's permissions apply.
        String requestedModule = getRequestedModule(uri);
        if (requestedModule == null) {
            log.warn("No SSO authorization module mapped for URI: {}. Denying access (fail closed).", uri);
            debugDecision(authentication, method, uri, null, null, null, false, "no matching module");
            return new AuthorizationDecision(false);
        }

        List<String> requiredActions = getRequiredActions(request, uri, method);
        if (requiredActions.isEmpty()) {
            log.warn("No authorization action could be derived for [{}] {} {}. Denying access (fail closed).", method, uri, requestedModule);
            debugDecision(authentication, method, uri, requestedModule, null, null, false, "no authorization action derived");
            return new AuthorizationDecision(false);
        }

        // Grant ONLY when the user holds an active+allowed SSO permission scoped to the
        // matched module/feature for one of the required actions. Module and action
        // matching is case-insensitive (YAML key == SSO moduleName/featureCode). The
        // flat-authority check is a fallback for principals that are not AuthenticatedUser.
        for (String action : requiredActions) {
            boolean granted = false;
            String source = "NONE";
            String matched = null;
            if (principal instanceof AuthenticatedUser authenticatedUser) {
                granted = authenticatedUser.hasPermission(requestedModule, action);
                if (granted) {
                    source = "PRINCIPAL";
                    matched = matchedPermissionCode(authenticatedUser, requestedModule, action);
                } else if (SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                        || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action)) {
                    granted = true;
                    source = "AUTHORITY";
                    matched = "MODULE/FEATURE_" + requestedModule + "_ACTION_" + action;
                }
            } else {
                if (SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                        || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action)) {
                    granted = true;
                    source = "AUTHORITY";
                    matched = "MODULE/FEATURE_" + requestedModule + "_ACTION_" + action;
                }
            }

            if (!granted && "CONFIRM".equalsIgnoreCase(action)) {
                if (principal instanceof AuthenticatedUser authenticatedUser) {
                    granted = authenticatedUser.hasPermission(requestedModule, "CONFIRM")
                            || authenticatedUser.hasPermission(requestedModule, "WRITE")
                            || authenticatedUser.hasPermission(requestedModule, "UPDATE")
                            || authenticatedUser.hasPermission(requestedModule, "APPROVE");
                }
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, requestedModule, "CONFIRM")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "CONFIRM")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "UPDATE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "UPDATE")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "APPROVE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "APPROVE");
                }
            }

            if (!granted && "REVERSE".equalsIgnoreCase(action)) {
                if (principal instanceof AuthenticatedUser authenticatedUser) {
                    granted = authenticatedUser.hasPermission(requestedModule, "REVERSE")
                            || authenticatedUser.hasPermission(requestedModule, "WRITE")
                            || authenticatedUser.hasPermission(requestedModule, "UPDATE");
                }
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, requestedModule, "REVERSE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "REVERSE")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "UPDATE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "UPDATE");
                }
            }

            if (!granted && uri.contains("/dashboard")) {
                if (principal instanceof AuthenticatedUser authenticatedUser) {
                    granted = authenticatedUser.hasPermission("DASHBOARD", action)
                            || authenticatedUser.hasPermission("INVENTORY_REPORTS", action);
                }
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, "DASHBOARD", action)
                            || SsoAuthorities.hasFeatureAction(authorities, "DASHBOARD", action)
                            || SsoAuthorities.hasModuleAction(authorities, "INVENTORY_REPORTS", action)
                            || SsoAuthorities.hasFeatureAction(authorities, "INVENTORY_REPORTS", action);
                }
            }

            log.debug("Matching SSO permission for module [{}] action [{}]: {}", requestedModule, action, granted);
            if (granted) {
                log.debug("Access granted for URI: {} to module: {} with action: {}", uri, requestedModule, action);
                debugDecision(authentication, method, uri, requestedModule, action, source,
                        true, "granted via " + matched);
                return new AuthorizationDecision(true);
            }
        }

        log.warn("AUTHORIZATION DENIED. URI: {} module: {} required actions: {} (no active+allowed SSO permission matched)",
                uri, requestedModule, requiredActions);
        debugDecision(authentication, method, uri, requestedModule, null, null,
                false, "no active+allowed SSO permission matched for required actions " + requiredActions);
        return new AuthorizationDecision(false);
    }

    private String normalizeUri(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String contextPath = request.getContextPath();

        if (StringUtils.hasText(contextPath) && !"/".equals(contextPath) && uri != null && uri.startsWith(contextPath)) {
            uri = uri.substring(contextPath.length());
        }

        if (!StringUtils.hasText(uri)) {
            return "/";
        }

        int queryIndex = uri.indexOf('?');
        if (queryIndex >= 0) {
            uri = uri.substring(0, queryIndex);
        }
        int fragmentIndex = uri.indexOf('#');
        if (fragmentIndex >= 0) {
            uri = uri.substring(0, fragmentIndex);
        }

        if (uri.length() > 1 && uri.endsWith("/")) {
            uri = uri.substring(0, uri.length() - 1);
        }

        return uri;
    }

    /**
     * HTTP method and custom URL suffix mapping to required SSO actions.
     * Custom action suffixes take precedence over the plain method mapping.
     */
    private List<String> getRequiredActions(HttpServletRequest request, String uri, String method) {
        List<String> actions = new ArrayList<>();

        String suffixAction = properties.actionForSuffix(uri);
        if (suffixAction != null && !suffixAction.isBlank()) {
            actions.add(suffixAction.toUpperCase());
            if ("SEND".equalsIgnoreCase(suffixAction)) {
                actions.add("WRITE");
                actions.add("UPDATE");
            }
            if ("CONFIRM".equalsIgnoreCase(suffixAction)) {
                actions.add("WRITE");
                actions.add("UPDATE");
                actions.add("APPROVE");
            }
            if ("POST".equalsIgnoreCase(suffixAction)) {
                actions.add("WRITE");
                actions.add("UPDATE");
            }
            if ("CANCEL".equalsIgnoreCase(suffixAction)) {
                actions.add("WRITE");
                actions.add("DELETE");
            }
            if ("REVERSE".equalsIgnoreCase(suffixAction)) {
                actions.add("WRITE");
                actions.add("UPDATE");
            }
        } else {
            actions.addAll(properties.actionsForMethod(method));
        }

        // Explicit, documented opt-in escalation: WRITE satisfies CREATE/UPDATE.
        if (properties.isWriteImpliesCreateUpdate() && !actions.contains("WRITE")) {
            for (String action : actions) {
                if ("CREATE".equals(action) || "UPDATE".equals(action)) {
                    actions.add("WRITE");
                    break;
                }
            }
        }

        return actions.stream().distinct().toList();
    }

    private String getRequestedModule(String uri) {
        if (properties.getModules() == null) {
            return null;
        }

        for (Map.Entry<String, List<String>> entry : properties.getModules().entrySet()) {
            String moduleName = entry.getKey();
            if ("ALL_MODULES".equals(moduleName)) {
                continue;
            }
            for (String pattern : entry.getValue()) {
                if (pathMatcher.match(pattern, uri)) {
                    return moduleName;
                }
            }
        }

        return null;
    }

    private boolean isAuthenticatedProfileEndpoint(String uri) {
        return "/api/inventory/auth/me".equals(uri) || "/api/inventory/auth/profile".equals(uri);
    }

    private boolean isBusinessMutation(String method, String uri) {
        if (uri.startsWith("/api/inventory/auth/") || uri.startsWith("/api/inventory/public/")
                || uri.contains("/billing") || uri.contains("/subscription")
                || uri.contains("/renewal") || uri.contains("/payment")) {
            return false;
        }
        return "POST".equals(method) || "PUT".equals(method)
                || "PATCH".equals(method) || "DELETE".equals(method);
    }

    private String matchedPermissionCode(AuthenticatedUser user, String module, String action) {
        if (user == null) {
            return null;
        }
        String targetScope = SsoAuthorities.normalize(module);
        String targetAction = SsoAuthorities.normalize(action);
        for (var permission : user.activeAndAllowedPermissions()) {
            if (targetAction.equals(SsoAuthorities.normalize(permission.getAction()))
                    && (targetScope.equals(SsoAuthorities.normalize(permission.getModuleName()))
                            || targetScope.equals(SsoAuthorities.normalize(permission.getFeatureCode())))) {
                return permission.getPermissionCode() != null ? permission.getPermissionCode() : module + ":" + action;
            }
        }
        return module + ":" + action;
    }

    /**
     * Safe DEBUG logging for one authorization decision.
     * <p>
     * Never logs tokens, cookies, passwords, client secrets, authorization
     * headers or service tokens.
     */
    private void debugDecision(Authentication authentication, String method, String uri, String module,
                               String action, String source, boolean allow, String reason) {
        if (!log.isDebugEnabled()) {
            return;
        }
        String userId = "null";
        String username = "null";
        String roles = "[]";
        int activeFeatureCount = 0;
        int permissionCount = 0;
        int activeAndAllowedPermissionCount = 0;

        Object principal = authentication != null ? authentication.getPrincipal() : null;
        if (principal instanceof AuthenticatedUser authenticatedUser) {
            userId = String.valueOf(authenticatedUser.getUserId());
            username = authenticatedUser.getUsername();
            roles = String.valueOf(authenticatedUser.getRoles());
            activeFeatureCount = authenticatedUser.getActiveFeatures() == null ? 0 : authenticatedUser.getActiveFeatures().size();
            permissionCount = authenticatedUser.getPermissions() == null ? 0 : authenticatedUser.getPermissions().size();
            activeAndAllowedPermissionCount = authenticatedUser.activeAndAllowedPermissionCount();
        } else if (principal != null) {
            username = String.valueOf(principal);
            roles = String.valueOf(authentication.getAuthorities());
        }

        log.debug("authorizationDecision=" +
                "userId={} username={} roles={} activeFeatureCount={} permissionCount={} " +
                "activeAndAllowedPermissionCount={} requestMethod={} requestUri={} resolvedModule={} " +
                "requiredAction={} matchedPermission={} authorizationSource={} decision={} reason={}",
                userId, username, roles, activeFeatureCount, permissionCount,
                activeAndAllowedPermissionCount, method, uri, module, action, source, allow ? "ALLOW" : "DENY", reason);
    }
}