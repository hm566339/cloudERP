package com.erp.account.security;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.erp.account.modules.auth.dto.ssoresponse.TokenVerifyResponse;
import com.erp.account.modules.auth.dto.ssoresponse.AccountStatus;
import com.erp.account.modules.auth.dto.ssoresponse.RoleResponse;
import com.erp.account.modules.auth.dto.ssoresponse.UserResponse;
import com.erp.account.modules.auth.service.SsoService;
import com.erp.account.modules.company.service.CompanyBootstrapService;
import com.erp.account.common.exception.UnauthorizedException;
import com.erp.account.security.authorization.AuthenticatedUser;
import com.erp.account.security.authorization.SsoAuthorities;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * SSO authentication filter.
 *
 * <p>
 * SSO is the single source of truth for authorization:
 * <ol>
 * <li>Extract access token from Authorization header or cookie.</li>
 * <li>Verify via SSO ({@code POST /api/sso/token/verify}).</li>
 * <li>Validate the SSO response, that the user exists, and that the account is
 * ACTIVE.</li>
 * <li>Convert active roles, active features and active+allowed permissions from
 * the
 * verified response into Spring Security authorities (fail closed
 * otherwise).</li>
 * <li>Store authentication in {@link SecurityContextHolder} and populate
 * {@link CurrentUserContext} (user identity, company/tenant isolation,
 * SYSTEM_ADMIN).</li>
 * </ol>
 *
 * <p>
 * Fail-closed rules:
 * <ul>
 * <li>Invalid/expired token -> 401 via the entry point (context left
 * empty).</li>
 * <li>Missing user or non-ACTIVE account -> denied (context left empty).</li>
 * <li>Permissions that are inactive or disallowed -> never converted to
 * authorities.</li>
 * <li>Malformed/incomplete SSO authorization data -> no authorities
 * granted.</li>
 * </ul>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationFilter extends OncePerRequestFilter {

    private final CompanyBootstrapService companyBootstrapService;
    private final SsoService ssoService;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Value("${sso.cookie-secure:false}")
    private boolean cookieSecure;

    @Value("${sso.cookie-path:/}")
    private String cookiePath;

    @Value("${sso.cookie-same-site:Lax}")
    private String cookieSameSite;

    // ───────────────────────────────────────────────────────────────────────
    // Bypass Logic
    // ───────────────────────────────────────────────────────────────────────

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Completely bypass the filter for Swagger, OpenAPI, and explicitly auth
        // endpoints
        return path != null && (path.startsWith("/swagger-ui") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/api-docs") ||
                path.startsWith("/swagger-resources") ||
                path.startsWith("/webjars") ||
                path.equals("/swagger-ui.html") ||
                path.equals("/api/account/auth/refresh") ||
                path.equals("/api/account/auth/login") ||
                path.equals("/api/account/auth/callback") ||
                path.equals("/api/account/auth/logout"));
    }

    // ───────────────────────────────────────────────────────────────────────
    // Filter entry point
    // ───────────────────────────────────────────────────────────────────────

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
                    authenticateUser(verifyResponse, accessToken, request);
                } else {
                    // Fail closed: invalid, incomplete or unsafe authorization data.
                    log.warn("SSO verification response rejected for path [{}] (invalid/empty/inactive account).",
                            path);
                }
            } catch (UnauthorizedException ex) {
                log.warn("Access token expired or invalid for path [{}]. Returning 401 to let frontend handle refresh.",
                        path);
                // The frontend interceptor will handle the 401 and call
                // /api/account/auth/refresh
            } catch (CompanyTenantVerificationException ex) {
                log.warn("Company tenant verification denied for path [{}]: {}", path, ex.getMessage());
                SecurityContextHolder.clearContext();
                CurrentUserContext.clear();
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"success\":false,\"message\":\"Company access could not be verified\"}");
                return;
            } catch (Exception ex) {
                log.warn("Authentication failed for path [{}]: {}", path, ex.getMessage());
            }
        } else {
            log.debug("No access token found for path [{}]", path);
        }

        // IMPORTANT: NEVER return 401 manually from the filter.
        // Always continue the chain. If SecurityContext is empty, Spring Security will
        // return 401
        // ONLY for protected endpoints (via JwtAuthenticationEntryPoint), and allow
        // permitAll() endpoints!
        filterChain.doFilter(request, response);
    }

    // ───────────────────────────────────────────────────────────────────────
    // SSO response validation (fail closed)
    // ───────────────────────────────────────────────────────────────────────

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

    // ───────────────────────────────────────────────────────────────────────
    // SecurityContext population
    // ───────────────────────────────────────────────────────────────────────

    private void authenticateUser(TokenVerifyResponse verifyResponse, String accessToken, HttpServletRequest request) {

        UserResponse user = verifyResponse.getUser();
        String username = user.getUsername();
        String companyCode = user.getCompanyCode();
        UUID userId = user.getId();

        if (user.getOrganizationId() != null) {
            CurrentUserContext.setOrganizationId(user.getOrganizationId());
            CurrentUserContext.setOrganizationCode(user.getOrganizationCode());
            CurrentUserContext.setAccessMode(user.getAccessMode());
        }

        // Set thread-local user context
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername(username);
        if (user.getFullName() != null) {
            CurrentUserContext.setUserFullName(user.getFullName());
        }
        if (user.getRole() != null && !user.getRole().isEmpty()) {
            String selectedRole = null;
            for (RoleResponse r : user.getRole()) {
                if (r != null && Boolean.TRUE.equals(r.isStatus()) && r.getName() != null) {
                    String rName = r.getName().trim();
                    if ("SYSTEM_ADMIN".equalsIgnoreCase(rName) || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(rName)) {
                        selectedRole = rName;
                        break;
                    }
                    if ("OWNER".equalsIgnoreCase(rName) || "ROLE_OWNER".equalsIgnoreCase(rName)) {
                        selectedRole = rName;
                    } else if (selectedRole == null) {
                        selectedRole = rName;
                    }
                }
            }
            if (selectedRole != null && !selectedRole.isBlank()) {
                CurrentUserContext.setUserRole(selectedRole);
            }
        }

        // Convert active roles, active features and active+allowed permissions from
        // the VERIFIED SSO response into a structured principal AND a flat set of
        // authorities. Nothing is read from the frontend.
        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(verifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(verifyResponse);
        log.debug(
                "Authenticated user [{}] with {} active role(s), {} feature(s) and {} active+allowed SSO permission(s)",
                username,
                authenticatedUser == null ? 0 : authenticatedUser.getRoles().size(),
                authenticatedUser == null ? 0 : authenticatedUser.getActiveFeatures().size(),
                authenticatedUser == null ? 0 : authenticatedUser.activeAndAllowedPermissionCount());

        boolean isSystemAdmin = SsoAuthorities.isSystemAdmin(authorities);
        boolean isOwner = (authenticatedUser != null && authenticatedUser.hasActiveRole("OWNER"))
                || "OWNER".equalsIgnoreCase(CurrentUserContext.getUserRole());

        UUID requestCompanyId = extractCompanyIdFromRequest(request);

        // Resolve company based on role and request
        if (isSystemAdmin) {
            if (requestCompanyId != null) {
                CurrentUserContext.setCompanyId(requestCompanyId);
                log.debug("SYSTEM_ADMIN with explicit request companyId [{}]", requestCompanyId);
            } else {
                CurrentUserContext.clearCompanyId();
                log.info("SYSTEM_ADMIN detected for user [{}]; skipping tenant resolution", username);
            }
        } else if (isOwner) {
            if (requestCompanyId != null) {
                CurrentUserContext.setCompanyId(requestCompanyId);
                log.debug("OWNER user [{}] operating on request companyId [{}]", username, requestCompanyId);
            } else if (companyCode != null && !companyCode.isBlank()) {
                try {
                    UUID companyId = companyBootstrapService.ensureCompanyByCode(companyCode, accessToken);
                    CurrentUserContext.setCompanyId(companyId);
                } catch (Exception ex) {
                    log.warn("Failed to bootstrap default company for OWNER {}: {}", companyCode, ex.getMessage());
                }
            }
        } else {
            // Resolve company only for non-system-admin users (tenant isolation).
            if (companyCode != null && !companyCode.isBlank()) {
                try {
                    UUID companyId = companyBootstrapService.ensureCompanyByCode(companyCode, accessToken);
                    CurrentUserContext.setCompanyId(companyId);
                } catch (Exception ex) {
                    log.error("Failed to provision company from SSO for code {}: {}", companyCode, ex.getMessage());
                    throw new CompanyTenantVerificationException(
                            "Failed to verify company access for code " + companyCode, ex);
                }
            }
        }

        // Populate SecurityContext (always overwrite — stateless session).
        // The principal carries the structured SSO permissions so authorization
        // managers can decide directly from the verified permission objects.
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(authenticatedUser,
                null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Authenticated user=[{}] authorities={}", username, authorities);
    }

    private UUID extractCompanyIdFromRequest(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String header = request.getHeader("X-Company-Id");
        if (!hasText(header)) {
            header = request.getHeader("X-COMPANY-ID");
        }
        if (!hasText(header)) {
            header = request.getHeader("x-company-id");
        }
        if (hasText(header)) {
            try {
                return UUID.fromString(header.trim());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID in X-Company-Id header: {}", header);
            }
        }
        String param = request.getParameter("companyId");
        if (hasText(param)) {
            try {
                return UUID.fromString(param.trim());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid UUID in companyId query parameter: {}", param);
            }
        }
        return null;
    }

    // ───────────────────────────────────────────────────────────────────────
    // Token extraction
    // ───────────────────────────────────────────────────────────────────────

    private String extractAccessToken(HttpServletRequest request) {
        // 1. Authorization header takes priority
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        // 2. Fall back to cookie
        return extractCookieValue(request, cookieName);
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

    private void writeResponseCookie(HttpServletResponse response, String name, String value, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value != null ? value : "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path(cookiePath)
                .maxAge(maxAge)
                .sameSite(cookieSameSite)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearCookies(HttpServletResponse response) {
        writeResponseCookie(response, cookieName, "", 0);
        writeResponseCookie(response, cookieName + "_REFRESH", "", 0);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static final class CompanyTenantVerificationException extends RuntimeException {
        CompanyTenantVerificationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}