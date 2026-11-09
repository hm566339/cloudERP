package com.erp.auth_service.security.authorization;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class YamlAuthorizationFilter extends OncePerRequestFilter {

    private final SsoAuthorizationService ssoAuthorizationService;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Skip public user registration (POST /api/sso/user)
        if (SsoPublicEndpoints.isPublicRegistration(method, path)) {
            return true;
        }

        // 2. Skip configured public endpoints
        for (String publicPattern : SsoPublicEndpoints.PUBLIC_ENDPOINTS) {
            if (pathMatcher.match(publicPattern, path)) {
                return true;
            }
        }

        // 3. Skip public organization lookup (GET /api/sso/organization/{orgCode})
        if (SsoPublicEndpoints.isPublicOrganizationLookup(method, path)) {
            return true;
        }

        return false;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 1. Read SecurityContext
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // 2. If not authenticated -> 401
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication != null ? authentication.getPrincipal() : null;
            log.warn("YAML authorization rejected unauthenticated request method={} path={} authenticationType={} principalType={}",
                    request.getMethod(), request.getRequestURI(),
                    authentication != null ? authentication.getClass().getSimpleName() : "none",
                    principal != null ? principal.getClass().getSimpleName() : "none");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Authentication required\"}");
            return;
        }

        // 3. Authorize via SsoAuthorizationService (handles SYSTEM_ADMIN, YAML URL
        // match, action, DB permissions)
        AuthorizationDecision decision = ssoAuthorizationService.authorize(authentication, request);

        // 4. If allowed -> continue filter chain
        if (decision.isAllowed()) {
            filterChain.doFilter(request, response);
            return;
        }

        // 5. If denied -> 403 Forbidden
        log.warn("Access denied for request [{}] [{}] - Reason: {}",
                request.getMethod(), request.getRequestURI(), decision.getReason());

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Access denied: " + decision.getReason() + "\"}");
    }
}
