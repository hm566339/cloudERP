package com.erp.manufacturing.security.authorization;

import com.erp.manufacturing.util.CurrentUserContext;
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

import java.util.*;
import java.util.function.Supplier;

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

        boolean systemAdmin = (principal instanceof AuthenticatedUser authenticatedUser && authenticatedUser.isSystemAdmin())
                || SsoAuthorities.isSystemAdmin(authorities);
        if (systemAdmin) {
            log.debug("SYSTEM_ADMIN access granted for URI: {}", uri);
            return new AuthorizationDecision(true);
        }

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

            if (!granted) {
                granted = effectivePermissions.contains(new FeatureGroupPermissionResolver.ModuleAction(
                        SsoAuthorities.normalize(requestedModule), SsoAuthorities.normalize(action)));
            }

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

        while (uri.contains("//")) {
            uri = uri.replace("//", "/");
        }
        return uri;
    }

    private String getRequestedModule(String uri) {
        for (Map.Entry<String, List<String>> entry : properties.getModules().entrySet()) {
            String moduleCode = entry.getKey();
            List<String> patterns = entry.getValue();
            if (patterns == null) continue;
            for (String pattern : patterns) {
                if (pathMatcher.match(pattern, uri)) {
                    return moduleCode;
                }
            }
        }
        return null;
    }

    private List<String> getRequiredActions(HttpServletRequest request, String uri, String method) {
        String suffixAction = properties.actionForSuffix(uri);
        if (suffixAction != null) {
            return List.of(suffixAction);
        }

        List<String> methodActions = properties.actionsForMethod(method);
        if (methodActions == null || methodActions.isEmpty()) {
            return List.of();
        }

        if (properties.isWriteImpliesCreateUpdate()) {
            List<String> expanded = new ArrayList<>(methodActions);
            if (("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method))
                    && !expanded.contains("WRITE")) {
                expanded.add("WRITE");
            }
            return expanded;
        }

        return methodActions;
    }

    private boolean isBusinessMutation(String method, String uri) {
        return "POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method);
    }
}
