package com.erp.workflow.security;

import com.erp.workflow.exception.UnauthorizedException;
import com.erp.workflow.security.authorization.AuthenticatedUser;
import com.erp.workflow.security.authorization.SsoAuthorities;
import com.erp.workflow.security.dto.sso.AccountStatus;
import com.erp.workflow.security.dto.sso.RoleResponse;
import com.erp.workflow.security.dto.sso.TokenVerifyResponse;
import com.erp.workflow.security.dto.sso.UserResponse;
import com.erp.workflow.security.sso.SsoService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

/**
 * SSO-based authentication filter for workflow-service with local JWT signature validation fallback.
 * <p>
 * Extracts access token from Authorization header or cookies and verifies it against the
 * central SSO service. If SSO verification is unreachable or returns invalid for trusted JWTs
 * (e.g., ADMIN_PANEL tokens), verifies JWT signature via public RSA key / HMAC secret.
 */
@Component
@Slf4j
public class AuthenticationFilter extends OncePerRequestFilter {

    private final SsoService ssoService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Autowired
    public AuthenticationFilter(SsoService ssoService, @Autowired(required = false) JwtTokenProvider jwtTokenProvider) {
        this.ssoService = ssoService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthenticationFilter(SsoService ssoService) {
        this(ssoService, null);
    }

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
                boolean authenticated = false;
                try {
                    log.debug("Verifying access token with SSO for path [{}]", path);
                    TokenVerifyResponse verifyResponse = ssoService.verifyToken(accessToken);

                    if (isVerificationResponseUsable(verifyResponse)) {
                        authenticateUser(request, verifyResponse);
                        authenticated = true;
                    } else {
                        log.warn("SSO verification response rejected for path [{}] (invalid/empty/inactive account).", path);
                    }
                } catch (UnauthorizedException ex) {
                    log.warn("SSO token verification failed for path [{}]: {}", path, ex.getMessage());
                } catch (Exception ex) {
                    log.warn("SSO verification error for path [{}]: {}", path, ex.getMessage());
                }

                // Fallback to local JWT verification with public key or HMAC if SSO did not authenticate
                if (!authenticated && jwtTokenProvider != null && jwtTokenProvider.validateToken(accessToken)) {
                    log.debug("SSO unavailable or rejected; authenticating via verified JWT token for path [{}]", path);
                    authenticateUserFromJwt(request, accessToken);
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
        }
        if (user.getCompanyId() != null) {
            CurrentUserContext.setCompanyId(user.getCompanyId());
            if (CurrentUserContext.getOrganizationId() == null) {
                CurrentUserContext.setOrganizationId(user.getCompanyId());
            }
        } else {
            // When user session is at organization level (e.g. OWNER with currentCompany: null),
            // resolve tenant company context from the X-Company-Id header sent by the client.
            String headerCompanyId = request.getHeader("X-Company-Id");
            if (StringUtils.hasText(headerCompanyId)) {
                try {
                    CurrentUserContext.setCompanyId(UUID.fromString(headerCompanyId.trim()));
                } catch (IllegalArgumentException ignored) {
                    log.debug("Invalid UUID in X-Company-Id header: {}", headerCompanyId);
                }
            }
        }
        if (user.getOrganizationCode() != null) {
            CurrentUserContext.setOrganizationCode(user.getOrganizationCode());
        } else if (user.getCompanyCode() != null) {
            CurrentUserContext.setOrganizationCode(user.getCompanyCode());
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

    private void authenticateUserFromJwt(HttpServletRequest request, String token) {
        UserPrincipal userPrincipal = jwtTokenProvider.parseUserFromToken(token);
        if (userPrincipal == null) {
            return;
        }

        UUID userId = userPrincipal.getUserId();
        String username = userPrincipal.getUsername();
        UUID companyId = userPrincipal.getCompanyId();
        String companyCode = userPrincipal.getCompanyCode();
        List<String> roles = userPrincipal.getRoles() != null ? userPrincipal.getRoles() : Collections.emptyList();

        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername(username);
        if (companyId != null) {
            CurrentUserContext.setCompanyId(companyId);
            CurrentUserContext.setOrganizationId(companyId);
        }
        if (companyCode != null) {
            CurrentUserContext.setOrganizationCode(companyCode);
        }
        CurrentUserContext.setAccessMode(userPrincipal.getAccessMode() != null ? userPrincipal.getAccessMode() : "FULL");
        if (!roles.isEmpty()) {
            CurrentUserContext.setUserRole(roles.get(0));
        }

        List<RoleResponse> roleResponses = new ArrayList<>();
        for (String r : roles) {
            roleResponses.add(RoleResponse.builder().name(r).status(true).build());
        }

        UserResponse userResponse = UserResponse.builder()
                .id(userId)
                .username(username)
                .companyCode(companyCode)
                .organizationId(companyId)
                .organizationCode(companyCode)
                .accessMode(userPrincipal.getAccessMode() != null ? userPrincipal.getAccessMode() : "FULL")
                .accountStatus(AccountStatus.ACTIVE)
                .role(roleResponses)
                .features(Collections.emptyList())
                .permissions(Collections.emptyList())
                .build();

        TokenVerifyResponse syntheticVerifyResponse = TokenVerifyResponse.builder()
                .valid(true)
                .user(userResponse)
                .features(Collections.emptyList())
                .permissions(Collections.emptyList())
                .build();

        AuthenticatedUser authenticatedUser = AuthenticatedUser.from(syntheticVerifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(syntheticVerifyResponse);

        Set<GrantedAuthority> allAuthorities = new LinkedHashSet<>(authorities);
        allAuthorities.addAll(userPrincipal.getAuthorities());

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(authenticatedUser, null, new ArrayList<>(allAuthorities));
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        log.debug("Authenticated user [{}] from JWT with {} authorities", username, allAuthorities.size());
    }

    private String extractAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7).trim();
        }
        String token = extractCookieValue(request, cookieName);
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        token = extractCookieValue(request, "ACCESS_TOKEN");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        token = extractCookieValue(request, "access_token");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        token = extractCookieValue(request, "auth_token");
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        return null;
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        if (name == null) return null;
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (name.equalsIgnoreCase(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
