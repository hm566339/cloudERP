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
import java.util.UUID;
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
            log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, reason: 'Unauthenticated or missing authentication token'",
                    request.getMethod(), request.getRequestURI());
            return new AuthorizationDecision(false);
        }

        String uri = normalizeUri(request);
        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase();
        if ("HEAD".equals(method)) {
            method = "GET";
        }

        if ("OPTIONS".equals(method)) {
            log.debug("SSO Authorization [GRANTED] -> method: {}, uri: {}, reason: 'CORS preflight OPTIONS permitted'",
                    method, uri);
            return new AuthorizationDecision(true);
        }

        Object principal = authentication.getPrincipal();
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

        AuthenticatedUser authenticatedUser = (principal instanceof AuthenticatedUser user) ? user : null;
        UUID userId = authenticatedUser != null ? authenticatedUser.getUserId() : CurrentUserContext.getUserId();
        String username = authenticatedUser != null ? authenticatedUser.getUsername() : "anonymous";
        List<String> roles = authenticatedUser != null ? authenticatedUser.getRoles() : Collections.emptyList();

        UUID companyContext = CurrentUserContext.getCompanyId();
        if (companyContext == null) {
            String cp = request.getParameter("companyId");
            String ch = request.getHeader("X-Company-Id");
            String cStr = StringUtils.hasText(ch) ? ch : cp;
            if (StringUtils.hasText(cStr)) {
                try {
                    companyContext = UUID.fromString(cStr.trim());
                } catch (IllegalArgumentException ignored) {
                }
            }
        }
        UUID organizationContext = CurrentUserContext.getOrganizationId();
        if (organizationContext == null && authenticatedUser != null) {
            organizationContext = authenticatedUser.getOrganizationId();
        }

        String accessMode = CurrentUserContext.getAccessMode();
        if (accessMode == null && authenticatedUser != null) {
            accessMode = authenticatedUser.getAccessMode();
        }

        if ("BLOCKED".equalsIgnoreCase(accessMode)) {
            log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, reason: 'User access mode is BLOCKED', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                    method, uri, username, userId, roles, companyContext, organizationContext);
            return new AuthorizationDecision(false);
        }

        if ("READ_ONLY".equalsIgnoreCase(accessMode) && isMutationMethod(method)) {
            log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, reason: 'User access mode is READ_ONLY for mutation method', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                    method, uri, username, userId, roles, companyContext, organizationContext);
            return new AuthorizationDecision(false);
        }

        // Active SYSTEM_ADMIN bypass
        boolean systemAdmin = (authenticatedUser != null && authenticatedUser.isSystemAdmin())
                || (principal instanceof com.erp.workflow.security.UserPrincipal userPrincipal && userPrincipal.isSystemAdmin())
                || SsoAuthorities.isSystemAdmin(authorities);
        if (systemAdmin) {
            log.info("SSO Authorization [GRANTED] -> method: {}, uri: {}, module: WORKFLOW, feature: ALL, action: ALL, reason: 'Active SYSTEM_ADMIN bypass', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                    method, uri, username, userId, roles, companyContext, organizationContext);
            return new AuthorizationDecision(true);
        }

        // Module routing
        String requestedModule = getRequestedModule(uri);
        if (requestedModule == null) {
            log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, reason: 'No SSO authorization module mapped for URI (fail closed)', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                    method, uri, username, userId, roles, companyContext, organizationContext);
            return new AuthorizationDecision(false);
        }

        List<String> requiredActions = getRequiredActions(uri, method);
        if (requiredActions.isEmpty()) {
            log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, module: WORKFLOW, feature: {}, reason: 'No authorization action could be derived for method/suffix (fail closed)', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                    method, uri, requestedModule, username, userId, roles, companyContext, organizationContext);
            return new AuthorizationDecision(false);
        }

        Set<FeatureGroupPermissionResolver.ModuleAction> effectivePermissions =
                groupPermissionResolver.effectivePermissions(authenticatedUser, authorities);

        for (String action : requiredActions) {
            boolean directGranted = false;
            boolean authorityGranted = false;
            boolean groupGranted = false;

            if (authenticatedUser != null) {
                directGranted = authenticatedUser.hasPermission(requestedModule, action);
                if (!directGranted) {
                    authorityGranted = SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                            || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action);
                }
            } else {
                authorityGranted = SsoAuthorities.hasModuleAction(authorities, requestedModule, action)
                        || SsoAuthorities.hasFeatureAction(authorities, requestedModule, action);
            }

            if (!directGranted && !authorityGranted) {
                groupGranted = effectivePermissions.contains(new FeatureGroupPermissionResolver.ModuleAction(
                        SsoAuthorities.normalize(requestedModule), SsoAuthorities.normalize(action)));
            }

            boolean granted = directGranted || authorityGranted || groupGranted;
            if (granted) {
                log.info("SSO Authorization [GRANTED] -> method: {}, uri: {}, module: WORKFLOW, feature: {}, action: {}, lookupResult: [direct={}, authority={}, group={}], user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                        method, uri, requestedModule, action, directGranted, authorityGranted, groupGranted, username, userId, roles, companyContext, organizationContext);
                return new AuthorizationDecision(true);
            }
        }

        log.warn("SSO Authorization [DENIED] -> method: {}, uri: {}, module: WORKFLOW, feature: {}, requiredActions: {}, reason: 'User lacks required permission/role for action(s)', user: {}, userId: {}, roles: {}, companyId: {}, organizationId: {}",
                method, uri, requestedModule, requiredActions, username, userId, roles, companyContext, organizationContext);
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
            log.debug("Action resolution for [{}] {}: matched custom suffix action '{}'", method, uri, suffixAction);
        } else {
            actions.addAll(properties.actionsForMethod(method));
            log.debug("Action resolution for [{}] {}: using default method actions {}", method, uri, actions);
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
