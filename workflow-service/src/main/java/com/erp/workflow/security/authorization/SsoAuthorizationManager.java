package com.erp.workflow.security.authorization;

import com.erp.workflow.security.CurrentUserContext;
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

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Supplier;

/**
 * SSO-based authorization manager for workflow-service.
 * <p>
 * Evaluates decisions exclusively from verified SSO identity, roles, features and permissions:
 * <ul>
 *   <li>When the principal is {@link AuthenticatedUser}, evaluates verified SSO permissions directly.</li>
 *   <li>SYSTEM_ADMIN role grants bypass ONLY when active in the verified SSO response.</li>
 *   <li>Missing module mapping, missing action, or missing permission fails closed.</li>
 *   <li>No local role grants or hardcoded permissions.</li>
 * </ul>
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
            method = "GET";
        }

        if ("OPTIONS".equals(method)) {
            return new AuthorizationDecision(true);
        }

        Object principal = authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        String accessMode = CurrentUserContext.getAccessMode();
        if (accessMode == null && principal instanceof AuthenticatedUser user) {
            accessMode = user.getAccessMode();
        }

        if ("BLOCKED".equalsIgnoreCase(accessMode)) {
            log.warn("BLOCKED access mode denied for URI: {}", uri);
            return new AuthorizationDecision(false);
        }

        if ("READ_ONLY".equalsIgnoreCase(accessMode) && isMutationMethod(method)) {
            log.warn("READ_ONLY access mode denied for mutation URI: {}", uri);
            return new AuthorizationDecision(false);
        }

        // Active SYSTEM_ADMIN bypass
        boolean systemAdmin = (principal instanceof AuthenticatedUser authenticatedUser && authenticatedUser.isSystemAdmin())
                || (principal instanceof com.erp.workflow.security.UserPrincipal userPrincipal && userPrincipal.isSystemAdmin())
                || SsoAuthorities.isSystemAdmin(authorities);
        if (systemAdmin) {
            log.debug("Active SYSTEM_ADMIN access granted for URI: {}", uri);
            return new AuthorizationDecision(true);
        }

        // Module routing
        String requestedModule = getRequestedModule(uri);
        if (requestedModule == null) {
            log.warn("No SSO authorization module mapped for URI: {}. Denying access (fail closed).", uri);
            return new AuthorizationDecision(false);
        }

        List<String> requiredActions = getRequiredActions(uri, method);
        if (requiredActions.isEmpty()) {
            log.warn("No authorization action could be derived for [{}] {} {}. Denying access (fail closed).", method, uri, requestedModule);
            return new AuthorizationDecision(false);
        }

        AuthenticatedUser authenticatedUser = (principal instanceof AuthenticatedUser user) ? user : null;
        Set<FeatureGroupPermissionResolver.ModuleAction> effectivePermissions =
                groupPermissionResolver.effectivePermissions(authenticatedUser, authorities);

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

            // Group-derived permission
            if (!granted) {
                granted = effectivePermissions.contains(new FeatureGroupPermissionResolver.ModuleAction(
                        SsoAuthorities.normalize(requestedModule), SsoAuthorities.normalize(action)));
            }

            if (granted) {
                log.debug("Access granted for URI: {} to module: {} with action: {}", uri, requestedModule, action);
                return new AuthorizationDecision(true);
            }
        }

        String username = authenticatedUser != null ? authenticatedUser.getUsername() : "anonymous";
        List<String> roles = authenticatedUser != null ? authenticatedUser.getRoles() : Collections.emptyList();
        log.warn("AUTHORIZATION DENIED. User: {} Roles: {} Method: {} URI: {} Module: {} Required Actions: {} (no active+allowed SSO permission matched)",
                username, roles, method, uri, requestedModule, requiredActions);
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

    private List<String> getRequiredActions(String uri, String method) {
        List<String> actions = new ArrayList<>();

        String suffixAction = properties.actionForSuffix(uri);
        if (suffixAction != null && !suffixAction.isBlank()) {
            actions.add(suffixAction.toUpperCase());
        } else {
            actions.addAll(properties.actionsForMethod(method));
        }

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

    private boolean isMutationMethod(String method) {
        return "POST".equals(method) || "PUT".equals(method)
                || "PATCH".equals(method) || "DELETE".equals(method);
    }
}
