package com.erp.auth_service.security.authorization;

import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.repository.FeaturePermissionRepository;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.PlatformAdminPrincipal;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.PermissionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.util.AntPathMatcher;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SsoAuthorizationService {

    private final AuthorizationProperties authorizationProperties;
    private final PermissionService permissionService;
    private final FeaturePermissionRepository featurePermissionRepository;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * Determines whether the given authentication possesses SYSTEM_ADMIN
     * privileges.
     * SYSTEM_ADMIN and ROLE_SYSTEM_ADMIN are the only unconditional full-access
     * bypass roles.
     */
    public boolean isSystemAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities != null) {
            return authorities.stream().anyMatch(a -> {
                String authStr = a.getAuthority();
                return "SYSTEM_ADMIN".equalsIgnoreCase(authStr)
                        || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(authStr);
            });
        }
        return false;
    }

    /**
     * Evaluates authorization for the incoming HTTP request against YAML rules and
     * DB permissions.
     */
    public AuthorizationDecision authorize(Authentication authentication, HttpServletRequest request) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return AuthorizationDecision.deny("AUTHENTICATION_REQUIRED");
        }

        // 1. SYSTEM_ADMIN bypass MUST happen before YAML feature resolution
        if (isSystemAdmin(authentication)) {
            return AuthorizationDecision.allow(null, null, null, "SYSTEM_ADMIN_FULL_ACCESS");
        }

        String requestPath = request.getRequestURI();
        String contextPath = request.getContextPath();
        if (contextPath != null && !contextPath.isEmpty() && requestPath.startsWith(contextPath)) {
            requestPath = requestPath.substring(contextPath.length());
        }

        // 2. Resolve module / feature from YAML
        String featureCode = resolveFeatureCode(requestPath);
        if (featureCode == null) {
            log.warn("Access denied: No YAML module/feature mapping found for path [{}]", requestPath);
            return AuthorizationDecision.deny(null, null, null, "FEATURE_NOT_FOUND");
        }

        // 3. Resolve action (custom suffix first, then HTTP method)
        String httpMethod = request.getMethod() != null ? request.getMethod().toUpperCase(Locale.ROOT) : "GET";
        List<String> candidateActions = resolveCandidateActions(requestPath, httpMethod);
        if (candidateActions.isEmpty()) {
            log.warn("Access denied: No action mapping for path [{}] method [{}]", requestPath, httpMethod);
            return AuthorizationDecision.deny(featureCode, null, null, "PERMISSION_NOT_FOUND");
        }

        String primaryAction = candidateActions.get(0);
        String primaryPermissionCode = featureCode + ":" + primaryAction;

        // 4. Check DB permissions
        return evaluateDbAuthorization(authentication, featureCode, candidateActions, primaryAction,
                primaryPermissionCode);
    }

    /**
     * Resolves the module/feature code from the request path using configured URL
     * patterns.
     */
    public String resolveFeatureCode(String path) {
        if (path == null) {
            return null;
        }

        String cleanPath = path;
        int qIdx = cleanPath.indexOf('?');
        if (qIdx >= 0) {
            cleanPath = cleanPath.substring(0, qIdx);
        }

        for (AuthorizationProperties.CompiledModulePattern entry : authorizationProperties
                .getCompiledModulePatterns()) {
            if (pathMatcher.match(entry.pattern(), cleanPath)) {
                return entry.module();
            }
        }
        return null;
    }

    /**
     * Resolves candidate actions for the request path and HTTP method.
     * Custom action suffixes take precedence over generic HTTP methods.
     */
    public List<String> resolveCandidateActions(String path, String httpMethod) {
        String cleanPath = path != null ? path : "";
        int qIdx = cleanPath.indexOf('?');
        if (qIdx >= 0) {
            cleanPath = cleanPath.substring(0, qIdx);
        }

        // 1. Custom action suffixes matching happens BEFORE generic HTTP method
        // matching
        if (authorizationProperties.getCustomActionSuffixes() != null) {
            for (Map.Entry<String, String> entry : authorizationProperties.getCustomActionSuffixes().entrySet()) {
                String suffix = entry.getKey();
                if (cleanPath.endsWith(suffix) || cleanPath.endsWith(suffix + "/")) {
                    String action = entry.getValue().toUpperCase(Locale.ROOT);
                    List<String> actions = new ArrayList<>();
                    actions.add(action);
                    if ("CONFIRM".equals(action)) {
                        actions.add("WRITE");
                        actions.add("UPDATE");
                        actions.add("APPROVE");
                    }
                    if ("SEND".equals(action) || "POST".equals(action) || "REVERSE".equals(action)) {
                        actions.add("WRITE");
                        actions.add("UPDATE");
                    }
                    if ("CANCEL".equals(action)) {
                        actions.add("WRITE");
                        actions.add("DELETE");
                    }
                    if (authorizationProperties.isWriteImpliesCreateUpdate()
                            && ("CREATE".equals(action) || "UPDATE".equals(action))) {
                        actions.add("WRITE");
                    }
                    return actions;
                }
            }
        }

        // 2. Generic HTTP method actions
        if (authorizationProperties.getMethodActions() != null) {
            List<String> methodActions = authorizationProperties.getMethodActions().get(httpMethod);
            if (methodActions != null && !methodActions.isEmpty()) {
                List<String> actions = new ArrayList<>(methodActions);
                if (authorizationProperties.isWriteImpliesCreateUpdate()) {
                    if ((actions.contains("CREATE") || actions.contains("UPDATE")) && !actions.contains("WRITE")) {
                        actions.add("WRITE");
                    }
                }
                return actions;
            }
        }
        return Collections.emptyList();
    }

    private AuthorizationDecision evaluateDbAuthorization(
            Authentication authentication,
            String featureCode,
            List<String> candidateActions,
            String primaryAction,
            String primaryPermissionCode) {

        List<String> candidatePermissionCodes = candidateActions.stream()
                .map(act -> featureCode + ":" + act)
                .toList();
        // 1. Regular database user (CustomUserDetails)
        if (authentication.getPrincipal() instanceof CustomUserDetails cud && cud.getUser() != null) {
            UUID userId = cud.getUser().getId();
            UUID companyId = null;
            RequestContext.Context ctx = RequestContext.get();
            if (ctx != null && ctx.companyId() != null) {
                companyId = ctx.companyId();
            }

            EffectivePermissionsResponse effective = (companyId != null)
                    ? permissionService.getEffectivePermissions(userId, companyId)
                    : permissionService.getEffectivePermissions(userId);

            if (effective != null && effective.getPermissions() != null) {
                boolean disabledFound = false;
                boolean deniedFound = false;

                for (String candidateCode : candidatePermissionCodes) {
                    for (UserPermissionDetailDto p : effective.getPermissions()) {
                        if (p.getPermissionCode() != null && p.getPermissionCode().equalsIgnoreCase(candidateCode)) {
                            if (p.isAllowed() && p.isActive()) {
                                return AuthorizationDecision.allow(featureCode, primaryAction, candidateCode,
                                        "DB_PERMISSION");
                            } else if (!p.isActive()) {
                                disabledFound = true;
                            } else if (!p.isAllowed()) {
                                deniedFound = true;
                            }
                        }
                    }
                }

                if (disabledFound) {
                    return AuthorizationDecision.deny(featureCode, primaryAction, primaryPermissionCode,
                            "PERMISSION_DISABLED");
                }
                if (deniedFound) {
                    return AuthorizationDecision.deny(featureCode, primaryAction, primaryPermissionCode,
                            "PERMISSION_DENIED");
                }
            }

            // Check if feature permission exists in catalog to differentiate
            // PERMISSION_NOT_FOUND vs PERMISSION_DENIED
            boolean existsInCatalog = false;
            for (String candidateCode : candidatePermissionCodes) {
                if (featurePermissionRepository.findByPermissionCodeIgnoreCase(candidateCode).isPresent()) {
                    existsInCatalog = true;
                    break;
                }
            }

            if (existsInCatalog) {
                return AuthorizationDecision.deny(featureCode, primaryAction, primaryPermissionCode,
                        "PERMISSION_DENIED");
            } else {
                return AuthorizationDecision.deny(featureCode, primaryAction, primaryPermissionCode,
                        "PERMISSION_NOT_FOUND");
            }
        }

        // 2. PlatformAdminPrincipal or granted authorities
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities != null) {
            for (GrantedAuthority ga : authorities) {
                String authStr = ga.getAuthority();
                if (authStr == null)
                    continue;

                for (String candidateCode : candidatePermissionCodes) {
                    if (authStr.equalsIgnoreCase(candidateCode)
                            || authStr.equalsIgnoreCase("PERM_" + candidateCode)
                            || authStr.equalsIgnoreCase("ROLE_" + candidateCode)) {
                        return AuthorizationDecision.allow(featureCode, primaryAction, candidateCode, "DB_PERMISSION");
                    }
                }

                // Support platform admin authorities for PLATFORM_ADMIN module
                if ("PLATFORM_ADMIN".equalsIgnoreCase(featureCode)) {
                    if ("PERM_PLATFORM_ADMIN_MANAGE".equalsIgnoreCase(authStr)
                            || "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_DASHBOARD_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_ORGANIZATION_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_SUPPORT_ACCESS".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_AUDIT_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_SUBSCRIPTION_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_PAYMENT_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_USER_READ".equalsIgnoreCase(authStr)
                            || "PERM_PLATFORM_COMPANY_READ".equalsIgnoreCase(authStr)) {
                        return AuthorizationDecision.allow(featureCode, primaryAction, primaryPermissionCode,
                                "DB_PERMISSION");
                    }
                }
            }
        }

        return AuthorizationDecision.deny(featureCode, primaryAction, primaryPermissionCode, "PERMISSION_DENIED");
    }
}
