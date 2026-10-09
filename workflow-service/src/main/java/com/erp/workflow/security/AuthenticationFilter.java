package com.erp.workflow.security;

import com.erp.workflow.exception.UnauthorizedException;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.security.authorization.SsoAuthorities;
import com.erp.workflow.security.dto.sso.AccountStatus;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import com.erp.workflow.security.sso.SsoService;
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
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * SSO-based authentication filter for workflow-service.
 * <p>
 * Extracts access token from Authorization header or cookie and verifies it against the
 * central SSO service. Does not trust spoofable Gateway headers for external authentication.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AuthenticationFilter extends OncePerRequestFilter {

    private final SsoService ssoService;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path != null && (path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/webjars")
                || path.equals("/swagger-ui.html")
                || path.startsWith("/actuator"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();

        String path = request.getRequestURI();
        String accessToken = extractAccessToken(request);

        try {
            if (accessToken != null && !accessToken.isBlank()) {
                try {
                    log.debug("Verifying access token with SSO for path [{}]", path);
                    TokenVerifyResponse verifyResponse = ssoService.verifyToken(accessToken);

                    if (isVerificationResponseUsable(verifyResponse)) {
                        authenticateUser(request, verifyResponse);
                    } else {
                        log.warn("SSO verification response rejected for path [{}] (invalid/empty/inactive account).", path);
                    }
                } catch (UnauthorizedException ex) {
                    log.warn("Access token expired or invalid for path [{}]: {}", path, ex.getMessage());
                } catch (Exception ex) {
                    log.warn("Authentication failed for path [{}]: {}", path, ex.getMessage());
                }
            } else {
                log.debug("No access token provided for path [{}]", path);
            }

            filterChain.doFilter(request, response);
        } finally {
            CurrentUserContext.clear();
        }
    }

    private boolean isVerificationResponseUsable(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null || !verifyResponse.isValid()) {
            return false;
        }
        UserResponse user = verifyResponse.getUser();
        if (user == null || user.getId() == null || !hasText(user.getUsername())) {
            log.warn("SSO verification response missing valid user identity.");
            return false;
        }
        if (user.getAccountStatus() != AccountStatus.ACTIVE) {
            log.warn("SSO verification rejected: account status is not ACTIVE (status={}) for user [{}].",
                    user.getAccountStatus(), user.getUsername());
            return false;
        }
        return true;
    }

    private void authenticateUser(HttpServletRequest request, TokenVerifyResponse verifyResponse) {
        UserResponse user = verifyResponse.getUser();
        String username = user.getUsername();
        UUID userId = user.getId();

        // Populate thread-local context
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername(username);
        if (user.getFullName() != null) {
            CurrentUserContext.setUserFullName(user.getFullName());
        }
        if (user.getOrganizationId() != null) {
            CurrentUserContext.setOrganizationId(user.getOrganizationId());
            CurrentUserContext.setCompanyId(user.getOrganizationId());
        }
        if (user.getOrganizationCode() != null) {
            CurrentUserContext.setOrganizationCode(user.getOrganizationCode());
        }
        if (user.getAccessMode() != null) {
            CurrentUserContext.setAccessMode(user.getAccessMode());
        }
        if (user.getRole() != null && !user.getRole().isEmpty() && user.getRole().get(0) != null) {
            String firstRole = user.getRole().get(0).getName();
            if (firstRole != null && !firstRole.isBlank()) {
                CurrentUserContext.setUserRole(firstRole);
            }
        }

        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(verifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(verifyResponse);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(authenticatedUser, null, authorities);
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Authenticated user [{}] with {} authorities", username, authorities.size());
    }

    private String extractAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
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

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
