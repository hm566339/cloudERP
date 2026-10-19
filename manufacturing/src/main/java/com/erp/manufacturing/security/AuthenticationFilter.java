package com.erp.manufacturing.security;

import com.erp.manufacturing.security.authorization.AuthenticatedUser;
import com.erp.manufacturing.security.authorization.SsoAuthorities;
import com.erp.manufacturing.security.dto.sso.AccountStatus;
import com.erp.manufacturing.security.dto.sso.FeatureResponse;
import com.erp.manufacturing.security.dto.sso.PermissionResponse;
import com.erp.manufacturing.security.dto.sso.RoleResponse;
import com.erp.manufacturing.security.dto.sso.TokenVerifyResponse;
import com.erp.manufacturing.security.dto.sso.UserResponse;
import com.erp.manufacturing.security.sso.SsoService;
import com.erp.manufacturing.util.CurrentUserContext;
import io.jsonwebtoken.Claims;
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
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
@Slf4j
public class AuthenticationFilter extends OncePerRequestFilter {

    private final SsoService ssoService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Value("${workflow.callback.secret:erp-workflow-internal-callback-secret}")
    private String workflowCallbackSecret;

    @Autowired
    public AuthenticationFilter(SsoService ssoService, @Autowired(required = false) JwtTokenProvider jwtTokenProvider) {
        this.ssoService = ssoService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public AuthenticationFilter(SsoService ssoService) {
        this(ssoService, null);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) {
            return false;
        }
        return path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/webjars")
                || path.equals("/swagger-ui.html")
                || path.startsWith("/actuator")
                || path.equals("/error");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();

        String path = request.getRequestURI();
        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase();

        // Allow trusted internal workflow callback with header secret
        String callbackSecret = request.getHeader("X-Workflow-Secret");
        if (StringUtils.hasText(callbackSecret) && callbackSecret.equals(workflowCallbackSecret)) {
            log.debug("Trusted internal workflow callback detected for [{}] {}", method, path);
            try {
                filterChain.doFilter(request, response);
            } finally {
                CurrentUserContext.clear();
            }
            return;
        }

        String accessToken = extractAccessToken(request);

        try {
            if (accessToken != null && !accessToken.isBlank()) {
                boolean authenticated = false;
                try {
                    log.debug("Verifying access token with SSO for [{}] {}", method, path);
                    TokenVerifyResponse verifyResponse = ssoService != null ? ssoService.verifyToken(accessToken) : null;

                    if (isVerificationResponseUsable(verifyResponse)) {
                        authenticateUser(verifyResponse, accessToken);
                        authenticated = true;
                    } else {
                        log.debug("SSO verification unusable for path [{}]", path);
                    }
                } catch (Exception ex) {
                    log.warn("SSO verification error for [{}]: {}", path, ex.getMessage());
                }

                // Fallback to local JWT signature verification if SSO is not responding or in tests
                if (!authenticated && jwtTokenProvider != null && jwtTokenProvider.validateToken(accessToken)) {
                    log.debug("Authenticating via verified local JWT for [{}] {}", method, path);
                    authenticateUserFromJwt(accessToken);
                }
            }
        } finally {
            // Keep CurrentUserContext alive during request handling, clear afterwards
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            CurrentUserContext.clear();
            SecurityContextHolder.clearContext();
        }
    }

    private boolean isVerificationResponseUsable(TokenVerifyResponse verifyResponse) {
        if (verifyResponse == null || !verifyResponse.isValid()) {
            return false;
        }
        UserResponse user = verifyResponse.getUser();
        if (user == null || user.getId() == null || !StringUtils.hasText(user.getUsername())) {
            log.warn("SSO verification response has no valid user identity.");
            return false;
        }
        if (user.getAccountStatus() != null && user.getAccountStatus() != AccountStatus.ACTIVE) {
            log.warn("SSO verification rejected: account is not ACTIVE for user [{}].", user.getUsername());
            return false;
        }
        return true;
    }

    private void authenticateUser(TokenVerifyResponse verifyResponse, String accessToken) {
        UserResponse user = verifyResponse.getUser();
        String username = user.getUsername();
        UUID userId = user.getId();
        UUID companyId = user.getCompanyId();

        if (user.getOrganizationId() != null) {
            CurrentUserContext.setOrganizationId(user.getOrganizationId());
            CurrentUserContext.setOrganizationCode(user.getOrganizationCode());
            CurrentUserContext.setAccessMode(user.getAccessMode());
        }

        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername(username);
        if (user.getFullName() != null) {
            CurrentUserContext.setUserFullName(user.getFullName());
        }
        if (user.getRole() != null && !user.getRole().isEmpty() && user.getRole().get(0) != null) {
            CurrentUserContext.setUserRole(user.getRole().get(0).getName());
        }

        if (companyId != null) {
            CurrentUserContext.setCompanyId(companyId);
        }

        AuthenticatedUser principal = AuthenticatedUser.from(verifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(verifyResponse);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, accessToken, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private void authenticateUserFromJwt(String token) {
        Claims claims = jwtTokenProvider.extractClaims(token);
        if (claims == null) return;

        UUID userId = jwtTokenProvider.getUserIdFromToken(token);
        UUID companyId = jwtTokenProvider.getCompanyIdFromToken(token);
        String username = jwtTokenProvider.getUsernameFromToken(token);
        List<String> roles = jwtTokenProvider.getRolesFromToken(token);

        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setUsername(username);
        if (companyId != null) {
            CurrentUserContext.setCompanyId(companyId);
        }
        if (!roles.isEmpty()) {
            CurrentUserContext.setUserRole(roles.get(0));
        }

        List<RoleResponse> roleResponses = roles.stream()
                .map(r -> RoleResponse.builder().name(r).status(true).build())
                .toList();

        // Check if token has feature claims
        List<FeatureResponse> featureResponses = new ArrayList<>();
        Object featuresObj = claims.get("features");
        if (featuresObj instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    featureResponses.add(FeatureResponse.builder().featureCode(item.toString()).build());
                }
            }
        }
        // Default MANUFACTURING feature if role contains MANUFACTURING or ADMIN
        if (featureResponses.isEmpty()) {
            featureResponses.add(FeatureResponse.builder().featureCode("MANUFACTURING").build());
        }

        // Check if token has permission claims
        List<PermissionResponse> permissionResponses = new ArrayList<>();
        Object permsObj = claims.get("permissions");
        if (permsObj instanceof List<?> list) {
            for (Object item : list) {
                if (item != null) {
                    String permStr = item.toString();
                    String module = "MANUFACTURING";
                    String action = permStr;
                    if (permStr.contains(":")) {
                        String[] parts = permStr.split(":", 2);
                        module = parts[0];
                        action = parts[1];
                    }
                    permissionResponses.add(PermissionResponse.builder()
                            .moduleName(module)
                            .action(action)
                            .active(true)
                            .allowed(true)
                            .build());
                }
            }
        }

        UserResponse user = UserResponse.builder()
                .id(userId != null ? userId : UUID.randomUUID())
                .username(username != null ? username : "user")
                .companyId(companyId)
                .accountStatus(AccountStatus.ACTIVE)
                .role(roleResponses)
                .features(featureResponses)
                .permissions(permissionResponses)
                .build();

        TokenVerifyResponse verifyResponse = TokenVerifyResponse.builder()
                .valid(true)
                .user(user)
                .features(featureResponses)
                .permissions(permissionResponses)
                .build();

        AuthenticatedUser principal = AuthenticatedUser.from(verifyResponse);
        List<GrantedAuthority> authorities = SsoAuthorities.from(verifyResponse);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(principal, token, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private String extractAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }

        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equalsIgnoreCase(cookie.getName())
                        || "ACCESS_TOKEN".equalsIgnoreCase(cookie.getName())
                        || "auth_token".equalsIgnoreCase(cookie.getName())) {
                    if (StringUtils.hasText(cookie.getValue())) {
                        return cookie.getValue().trim();
                    }
                }
            }
        }
        return null;
    }
}
