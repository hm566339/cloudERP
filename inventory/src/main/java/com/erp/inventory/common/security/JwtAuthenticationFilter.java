package com.erp.inventory.common.security;

import com.erp.inventory.common.exception.UnauthorizedException;
import com.erp.inventory.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.inventory.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.inventory.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.inventory.modules.auth.service.SsoService;
import com.erp.inventory.common.security.authorization.AuthenticatedUser;
import com.erp.inventory.common.security.authorization.SsoAuthorities;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * SSO authentication filter.
 *
 * <p>SSO is the single source of truth for authorization:
 * <ol>
 *   <li>Extract access token from Authorization header or cookie.</li>
 *   <li>Verify via SSO ({@code POST /api/sso/token/verify}).</li>
 *   <li>Validate the SSO response, that the user exists, and that the account is ACTIVE.</li>
 *   <li>Convert active roles, active features and active+allowed permissions from the
 *       verified response into Spring Security authorities (fail closed otherwise).</li>
 *   <li>Store authentication in {@link SecurityContextHolder} and populate
 *       {@link CurrentUserContext} (user identity, company/tenant isolation, SYSTEM_ADMIN).</li>
 * </ol>
 *
 * <p>Fail-closed rules:
 * <ul>
 *   <li>Invalid/expired token -> 401 via the entry point (context left empty).</li>
 *   <li>Missing user or non-ACTIVE account -> denied (context left empty).</li>
 *   <li>Permissions that are inactive or disallowed -> never converted to authorities.</li>
 *   <li>Malformed/incomplete SSO authorization data -> no authorities granted.</li>
 * </ul>
 *
 * <p>Safe logging only: user id, username, roles, feature/permission counts, request
 * method and URI. Never logs access/refresh tokens, passwords, client secrets,
 * authorization headers or service tokens.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SsoService ssoService;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Completely bypass the filter for Swagger, OpenAPI, and explicitly auth endpoints
        return path != null && (
                path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api-docs") ||
                path.startsWith("/swagger-resources") ||
                path.startsWith("/webjars") ||
                path.equals("/swagger-ui.html") ||
                path.startsWith("/api/inventory/auth")
        );
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
        String path = request.getRequestURI();

        String accessToken = extractAccessToken(request);

        if (accessToken != null && !accessToken.isBlank()) {
            try {
                log.debug("Verifying access token for path [{}]", path);
                TokenVerifyResponse verifyResponse = ssoService.verifyToken(accessToken);

                if (isVerificationResponseUsable(verifyResponse)) {
                    authenticateUser(verifyResponse, request);
                } else {
                    // Fail closed: invalid, incomplete or unsafe authorization data.
                    log.warn("SSO verification response rejected for path [{}] (invalid/empty/inactive account).", path);
                }
            } catch (UnauthorizedException ex) {
                log.warn("Access token expired or invalid for path [{}]. Returning 401 to let frontend handle refresh.", path);
            } catch (Exception ex) {
                log.warn("Authentication failed for path [{}]: {}", path, ex.getMessage());
            }
        } else {
            log.debug("No access token found for path [{}]", path);
        }

        // IMPORTANT: NEVER return 401 manually from the filter.
        // Always continue the chain. If SecurityContext is empty, Spring Security will return 401
        // ONLY for protected endpoints (via JwtAuthenticationEntryPoint), and allow permitAll() endpoints!
        filterChain.doFilter(request, response);
    }

    private boolean isVerificationResponseUsable(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null || !verifyResponse.isValid()) {
            return false;
        }
        UserResponse user = verifyResponse.getUser();
        if (user == null || user.getId() == null || !hasText(user.getUsername())) {
            log.warn("SSO verification response has no valid user identity for token.");
            return false;
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            log.warn("SSO verification rejected: account is not ACTIVE (status={}) for user [{}].",
                    user.getAccountStatus(), user.getUsername());
            return false;
        }
        return true;
    }

    private void authenticateUser(TokenVerifyResponse verifyResponse, HttpServletRequest request) {

        UserResponse user = verifyResponse.getUser();
        String username = user.getUsername();

        // Convert active roles, active features and active+allowed permissions from
        // the VERIFIED SSO response into a structured principal AND a flat set of
        // authorities. Nothing is read from the frontend.
        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(verifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(verifyResponse);

        int roles = authenticatedUser == null ? 0 : authenticatedUser.getRoles().size();
        int activeFeatures = authenticatedUser == null ? 0 : authenticatedUser.getActiveFeatures().size();
        int permissionCount = authenticatedUser == null ? 0 : authenticatedUser.getPermissions().size();
        int activeAndAllowed = authenticatedUser == null ? 0 : authenticatedUser.activeAndAllowedPermissionCount();

        // Safe DEBUG log - never contains tokens or headers.
        log.debug("authenticatedUser=" +
                "userId={} username={} roles={} activeFeatureCount={} permissionCount={} " +
                "activeAndAllowedPermissionCount={} requestMethod={} requestUri={}",
                authenticatedUser == null ? null : authenticatedUser.getUserId(),
                username,
                roles,
                activeFeatures,
                permissionCount,
                activeAndAllowed,
                request.getMethod(),
                request.getRequestURI());

        boolean isSystemAdmin = SsoAuthorities.isSystemAdmin(authorities);
        log.debug("Authenticated user [{}] with {} active role(s), {} feature(s) and {} active+allowed SSO permission(s). systemAdmin={}",
                username, roles, activeFeatures, activeAndAllowed, isSystemAdmin);

        // Populate thread-local user context.
        if (user.getOrganizationId() != null) {
            CurrentUserContext.setOrganizationId(user.getOrganizationId());
            CurrentUserContext.setOrganizationCode(user.getOrganizationCode());
            CurrentUserContext.setAccessMode(user.getAccessMode());
        }
        if (authenticatedUser != null && authenticatedUser.getUserId() != null) {
            CurrentUserContext.setUserId(authenticatedUser.getUserId());
        }
        CurrentUserContext.setUsername(username);
        if (user.getFullName() != null) {
            CurrentUserContext.setUserFullName(user.getFullName());
        }
        if (user.getRole() != null && !user.getRole().isEmpty() && user.getRole().get(0) != null) {
            String firstRole = user.getRole().get(0).getName();
            if (firstRole != null && !firstRole.isBlank()) {
                CurrentUserContext.setUserRole(firstRole);
            }
        }

        // Resolve company only for non-system-admin users (tenant isolation).
        if (!isSystemAdmin) {
            if (user.getCompanyId() != null) {
                CurrentUserContext.setCompanyId(user.getCompanyId());
            }
        } else {
            CurrentUserContext.clearCompanyId();
            log.debug("SYSTEM_ADMIN detected for user [{}]; skipping tenant resolution", username);
        }

        // Populate SecurityContext (always overwrite — stateless session).
        // The principal carries the structured SSO permissions so authorization
        // managers can decide directly from the verified permission objects.
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(authenticatedUser, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Authenticated user=[{}] authorities={}", username, authorities);
    }

    private String extractAccessToken(HttpServletRequest request) {
        // 1. Authorization header takes priority
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        // 2. Fall back to cookie
        String token = extractCookieValue(request, cookieName);
        if (token == null || token.isBlank()) {
            token = extractCookieValue(request, "ACCESS_TOKEN");
        }
        return token;
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}