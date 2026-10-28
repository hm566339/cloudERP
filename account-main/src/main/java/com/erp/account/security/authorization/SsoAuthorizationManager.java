package com.erp.account.security.authorization;

import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import com.erp.account.security.CurrentUserContext;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

/**
 * SSO-only authorization manager.
 * <p>
 * Every decision is derived exclusively from the <b>verified</b> SSO response that
 * {@link com.erp.account.security.AuthenticationFilter} stores in the
 * {@code SecurityContext}:
 * <ul>
 *   <li>When the principal is an {@link AuthenticatedUser}, decisions come from the
 *       raw SSO {@code PermissionResponse} objects (moduleName/featureCode + action,
 *       evaluated only when {@code active == true} AND {@code allowed == true})
 *       plus group-derived permissions resolved by {@link FeatureGroupPermissionResolver}.</li>
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
 *   <li>Group-based automatic API access via {@code feature-groups} (additive only)</li>
 * </ul>
 * <p>
 * Granting requires an active+allowed SSO permission for the matched module/feature AND
 * the required action - direct or group-derived. Merely having a role or having a feature
 * grants nothing.
 */
@Slf4j
@Component
public class SsoAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {

    private final SsoAuthorizationProperties properties;
    private final FeatureGroupPermissionResolver groupPermissionResolver;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public SsoAuthorizationManager(SsoAuthorizationProperties properties) {
        this(properties, new FeatureGroupPermissionResolver(properties));
    }

    @Autowired
    public SsoAuthorizationManager(SsoAuthorizationProperties properties,
                                   FeatureGroupPermissionResolver groupPermissionResolver) {
        this.properties = properties;
        this.groupPermissionResolver = groupPermissionResolver;
    }

    @Override
    public AuthorizationDecision authorize(Supplier<? extends Authentication> authenticationSupplier, RequestAuthorizationContext context) {
        HttpServletRequest request = context.getRequest();

        // Internal dispatches were already authorized on the primary REQUEST dispatch.
        if (request.getDispatcherType() == DispatcherType.ASYNC || request.getDispatcherType() == DispatcherType.ERROR) {
            return new AuthorizationDecision(true);
        }

        Authentication authentication = authenticationSupplier.get();
        if (authentication == null || !authentication.isAuthenticated()) {
            return new AuthorizationDecision(false);
        }

        String uri = normalizeUri(request);
        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase();
        if ("HEAD".equals(method)) {
            // Spring Security treats HEAD like GET for most setups.
            method = "GET";
        }

        if ("OPTIONS".equals(method)) {
            return new AuthorizationDecision(true);
        }

        if ("BLOCKED".equalsIgnoreCase(CurrentUserContext.getAccessMode())) {
            log.warn("BLOCKED organization access denied for URI: {}", uri);
            return new AuthorizationDecision(false);
        }

        if ("READ_ONLY".equalsIgnoreCase(CurrentUserContext.getAccessMode())
                && isBusinessMutation(method, uri)) {
            log.warn("READ_ONLY organization mutation denied for URI: {}", uri);
            return new AuthorizationDecision(false);
        }

        Object principal = authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        // SYSTEM_ADMIN is preserved ONLY as an explicit SSO policy: the principal
        // carries the role only when SSO returned it with status == true.
        boolean systemAdmin = (principal instanceof AuthenticatedUser authenticatedUser && authenticatedUser.isSystemAdmin())
                || SsoAuthorities.isSystemAdmin(authorities);
        if (systemAdmin) {
            log.debug("SYSTEM_ADMIN access granted for URI: {}", uri);
            return new AuthorizationDecision(true);
        }

        if (isAuthenticatedProfileEndpoint(uri)) {
            log.debug("Allowing authenticated profile endpoint without module routing: {}", uri);
            return new AuthorizationDecision(true);
        }

        // Route the request onto the SSO module namespace. Routing grants nothing;
        // it only decides which module's permissions apply.
        String requestedModule = getRequestedModule(uri);
        if (requestedModule == null) {
            log.warn("No SSO authorization module mapped for URI: {}. Denying access (fail closed).", uri);
            return new AuthorizationDecision(false);
        }

        List<String> requiredActions = getRequiredActions(request, uri, method);
        if (requiredActions.isEmpty()) {
            log.warn("No authorization action could be derived for [{}] {} {}. Denying access (fail closed).", method, uri, requestedModule);
            return new AuthorizationDecision(false);
        }

        int activeAndAllowed = (principal instanceof AuthenticatedUser authenticatedUser)
                ? authenticatedUser.activeAndAllowedPermissionCount()
                : 0;
        log.debug("Authorization for {} {} -> module [{}], required actions [{}], SSO permissions (active+allowed) available: {}",
                method, uri, requestedModule, requiredActions, activeAndAllowed);

        // Effective permission set = direct active+allowed SSO permissions + flat-authority
        // fallback + group-derived permissions from every configured feature group the user
        // holds. Computed once per decision (fail closed: only active+allowed data counts).
        AuthenticatedUser authenticatedUser = (principal instanceof AuthenticatedUser user) ? user : null;
        Set<FeatureGroupPermissionResolver.ModuleAction> effectivePermissions =
                groupPermissionResolver.effectivePermissions(authenticatedUser, authorities);

        // Grant ONLY when the user holds an active+allowed SSO permission scoped to the
        // matched module/feature for one of the required actions. Module and action
        // matching is case-insensitive (YAML key == SSO moduleName/featureCode). The
        // flat-authority check is a fallback for principals that are not AuthenticatedUser.
        for (String action : requiredActions) {
            boolean granted = false;
            if (authenticatedUser != null) {
                granted = authenticatedUser.hasPermission(requestedModule, action);
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action);
                }
            } else {
                granted = SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                        || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action);
            }

            // Group-derived permission (additive only: never removes a direct right).
            if (!granted) {
                granted = effectivePermissions.contains(new FeatureGroupPermissionResolver.ModuleAction(
                        SsoAuthorities.normalize(requestedModule), SsoAuthorities.normalize(action)));
            }

            // Fallback for report exports: if uri is under /reports/, also accept REPORTS:EXPORT or REPORT_EXPORT
            if (!granted && "EXPORT".equalsIgnoreCase(action) && uri.contains("/reports/")) {
                if (authenticatedUser != null) {
                    granted = authenticatedUser.hasPermission("REPORTS", "EXPORT");
                }
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, "REPORTS", "EXPORT")
                            || SsoAuthorities.hasFeatureAction(authorities, "REPORTS", "EXPORT")
                            || authorities.stream().anyMatch(a -> "REPORT_EXPORT".equalsIgnoreCase(a.getAuthority())
                                    || "MODULE_REPORTS_ACTION_EXPORT".equalsIgnoreCase(a.getAuthority())
                                    || "FEATURE_REPORTS_ACTION_EXPORT".equalsIgnoreCase(a.getAuthority()));
                }
            }

            // Suffix action fallback: sending a document mutates state, so WRITE or UPDATE on the module satisfies SEND
            if (!granted && "SEND".equalsIgnoreCase(action)) {
                if (authenticatedUser != null) {
                    granted = authenticatedUser.hasPermission(requestedModule, "WRITE")
                            || authenticatedUser.hasPermission(requestedModule, "UPDATE");
                }
                if (!granted) {
                    granted = SsoAuthorities.hasModuleAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "WRITE")
                            || SsoAuthorities.hasModuleAction(authorities, requestedModule, "UPDATE")
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, "UPDATE");
                }
            }

            log.debug("Matching SSO permission for module [{}] action [{}]: {}", requestedModule, action, granted);
            if (granted) {
                log.debug("Access granted for URI: {} to module: {} with action: {}", uri, requestedModule, action);
                return new AuthorizationDecision(true);
            }
        }

        log.warn("AUTHORIZATION DENIED. URI: {} module: {} required actions: {} (no active+allowed SSO permission matched)",
                uri, requestedModule, requiredActions);
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

        Comparator<String> patternComparator = pathMatcher.getPatternComparator(uri);
        String bestPattern = null;
        String bestModule = null;

        for (Map.Entry<String, List<String>> entry : properties.getModules().entrySet()) {
            String moduleName = entry.getKey();
            if ("ALL_MODULES".equals(moduleName)) {
                continue;
            }
            for (String pattern : entry.getValue()) {
                if (pathMatcher.match(pattern, uri)) {
                    if (bestPattern == null || patternComparator.compare(pattern, bestPattern) < 0) {
                        bestPattern = pattern;
                        bestModule = moduleName;
                    }
                }
            }
        }

        return bestModule;
    }

    private boolean isAuthenticatedProfileEndpoint(String uri) {
        return "/api/account/auth/me".equals(uri) || "/api/account/auth/profile".equals(uri);
    }

    private boolean isBusinessMutation(String method, String uri) {
        if (uri.startsWith("/api/account/auth/") || uri.startsWith("/api/account/public/")
                || uri.contains("/billing") || uri.contains("/subscription")
                || uri.contains("/renewal") || uri.contains("/payment")) {
            return false;
        }
        return "POST".equals(method) || "PUT".equals(method)
                || "PATCH".equals(method) || "DELETE".equals(method);
    }
}