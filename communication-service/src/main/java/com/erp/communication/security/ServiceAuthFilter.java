package com.erp.communication.security;

import com.erp.communication.security.sso.AccountStatus;
import com.erp.communication.security.sso.RoleResponse;
import com.erp.communication.security.sso.SsoVerificationClient;
import com.erp.communication.security.sso.TokenVerifyResponse;
import com.erp.communication.security.sso.UserResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * Filter that authenticates requests to communication-service:
 * 1. Internal microservice requests using X-Service-Token header.
 * 2. Authenticated user requests via SSO token verification (POST /api/sso/token/verify),
 *    with local HMAC-SHA secret fallback for offline tests.
 * 3. Gateway-forwarded claims (X-USER-ID, X-COMPANY-ID, X-USERNAME, X-ROLES).
 *
 * Populates TenantContext (companyId, userId, userName, caller) and SecurityContextHolder.
 */
@Component
@Slf4j
public class ServiceAuthFilter extends OncePerRequestFilter {

    private final ServiceAuthProperties serviceAuthProperties;
    private final SsoVerificationClient ssoVerificationClient;

    @Value("${app.jwt.secret:default-must-be-overridden-in-production}")
    private String jwtSecret;

    @Value("${sso.cookie-name:access_token}")
    private String cookieName;

    @Autowired
    public ServiceAuthFilter(
            ServiceAuthProperties serviceAuthProperties,
            @Autowired(required = false) SsoVerificationClient ssoVerificationClient) {
        this.serviceAuthProperties = serviceAuthProperties;
        this.ssoVerificationClient = ssoVerificationClient;
    }

    public ServiceAuthFilter(ServiceAuthProperties serviceAuthProperties) {
        this(serviceAuthProperties, null);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return path != null && (
                path.startsWith("/actuator") ||
                path.startsWith("/swagger-ui") ||
                path.startsWith("/api-docs") ||
                path.startsWith("/v3/api-docs") ||
                path.startsWith("/webjars") ||
                path.startsWith("/ws-chat") ||
                path.startsWith("/api/communication/v1/webhooks")
        );
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            boolean authenticated = false;
            String caller = "UNKNOWN";
            UUID companyId = null;
            UUID userId = null;
            String userName = null;
            List<GrantedAuthority> authorities = new ArrayList<>();

            // 1. Check Service-to-Service Header (e.g. X-Service-Token)
            String serviceToken = request.getHeader(serviceAuthProperties.getHeaderName());
            if (!StringUtils.hasText(serviceToken)) {
                serviceToken = request.getHeader("X-Service-Token");
            }

            if (StringUtils.hasText(serviceToken) && isValidServiceToken(serviceToken.trim())) {
                authenticated = true;
                caller = "INTERNAL_SERVICE";
                authorities.add(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"));

                // Tenant and user headers from trusted caller
                companyId = extractCompanyIdFromHeaders(request);
                userId = extractUserIdFromHeaders(request);
                userName = extractUserNameFromHeaders(request);
                if (userName == null) {
                    userName = "internal-service";
                }

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        "internal-service",
                        null,
                        authorities
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

            // 2. Alternatively check Bearer JWT token if service token not supplied
            if (!authenticated) {
                String token = extractAccessToken(request);
                if (StringUtils.hasText(token)) {
                    boolean tokenRejectedBySso = false;

                    // 2a. Primary SSO Verification via POST /api/sso/token/verify
                    if (ssoVerificationClient != null) {
                        SsoVerificationClient.VerificationResult ssoResult = ssoVerificationClient.verify(token);
                        if (ssoResult.isSuccess()) {
                            TokenVerifyResponse verify = ssoResult.data();
                            UserResponse user = verify.getUser();
                            if (user != null && user.getId() != null && user.getAccountStatus() == AccountStatus.ACTIVE) {
                                authenticated = true;
                                userId = user.getId();
                                userName = StringUtils.hasText(user.getUsername()) ? user.getUsername() : user.getFullName();
                                caller = user.getUsername() != null ? user.getUsername() : "USER";

                                companyId = extractCompanyIdFromHeaders(request);
                                if (companyId == null) {
                                    Claims claims = parseJwtClaims(token);
                                    if (claims != null) {
                                        companyId = extractCompanyIdFromClaims(claims);
                                    }
                                }
                                authorities = extractAuthoritiesFromUser(user);

                                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        userName != null ? userName : userId,
                                        null,
                                        authorities
                                );
                                SecurityContextHolder.getContext().setAuthentication(auth);
                                log.debug("Authenticated via SSO token verification | user={} | userId={} | companyId={}",
                                        userName, userId, companyId);
                            }
                        } else if (ssoResult.isRejected()) {
                            // Definitively rejected by SSO (inactive/blocked account or invalid signature)
                            tokenRejectedBySso = true;
                            log.warn("SSO explicitly rejected token for request path [{}]", request.getRequestURI());
                        }
                    }

                    // 2b. Optional / Test Fallback: Local JWT verification (RSA public key or HMAC secret)
                    // Only execute fallback if SSO was offline / not definitively rejected
                    if (!authenticated && !tokenRejectedBySso) {
                        Claims claims = parseJwtClaims(token);
                        if (claims != null) {
                            authenticated = true;
                            String subject = claims.getSubject();
                            caller = subject != null ? subject : "USER";
                            userName = subject;

                            // Extract companyId from claims or request header
                            companyId = extractCompanyIdFromClaims(claims);
                            if (companyId == null) {
                                companyId = extractCompanyIdFromHeaders(request);
                            }

                            // Extract userId from claims or request header
                            userId = extractUserIdFromClaims(claims);
                            if (userId == null) {
                                userId = extractUserIdFromHeaders(request);
                            }

                            // Extract userName from claims or request header
                            String nameClaim = extractUserNameFromClaims(claims);
                            if (StringUtils.hasText(nameClaim)) {
                                userName = nameClaim;
                            } else {
                                String headerName = extractUserNameFromHeaders(request);
                                if (StringUtils.hasText(headerName)) {
                                    userName = headerName;
                                }
                            }

                            // Extract roles
                            authorities = extractAuthoritiesFromClaims(claims);

                            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                    subject != null ? subject : userId,
                                    null,
                                    authorities
                            );
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                }
            }

            // 3. Fallback: Trust Gateway-verified headers if Gateway authenticated request
            if (!authenticated) {
                UUID gwUserId = extractUserIdFromHeaders(request);
                UUID gwCompanyId = extractCompanyIdFromHeaders(request);
                String gwUsername = extractUserNameFromHeaders(request);
                String gwRoles = request.getHeader("X-ROLES");

                if (gwUserId != null || gwCompanyId != null) {
                    authenticated = true;
                    userId = gwUserId;
                    companyId = gwCompanyId;
                    userName = StringUtils.hasText(gwUsername) ? gwUsername : "gateway-user";
                    caller = userName;

                    if (StringUtils.hasText(gwRoles)) {
                        for (String r : gwRoles.split(",")) {
                            String role = r.trim();
                            if (!role.isEmpty()) {
                                authorities.add(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
                            }
                        }
                    }
                    if (authorities.isEmpty()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    }

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userName,
                            null,
                            authorities
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }

            if (!authenticated) {
                log.warn("Unauthorized communication service request | path={} | ip={}",
                        request.getRequestURI(), request.getRemoteAddr());
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("""
                        {"status":401,"error":"Unauthorized","message":"Valid service token or JWT credential is required"}
                        """);
                return;
            }

            TenantContext.setCaller(caller);
            if (companyId != null) {
                TenantContext.setCompanyId(companyId);
            }
            if (userId != null) {
                TenantContext.setUserId(userId);
            }
            if (userName != null) {
                TenantContext.setUserName(userName);
            }

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
    }

    private Claims parseJwtClaims(String token) {
        // Local HMAC Secret verification (Mock / Test HS256 token fallback)
        if (StringUtils.hasText(jwtSecret)) {
            try {
                SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                return Jwts.parser()
                        .verifyWith(key)
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();
            } catch (Exception ex) {
                log.debug("HMAC token verification did not succeed ({})", ex.getMessage());
            }
        }

        return null;
    }

    private String extractAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if (cookieName.equals(c.getName()) && StringUtils.hasText(c.getValue())) {
                    return c.getValue();
                }
            }
        }
        return null;
    }

    private UUID extractCompanyIdFromClaims(Claims claims) {
        Object cidClaim = claims.get("companyId");
        if (cidClaim == null) cidClaim = claims.get("company_id");
        if (cidClaim != null) {
            try {
                return UUID.fromString(cidClaim.toString());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private UUID extractCompanyIdFromHeaders(HttpServletRequest request) {
        String cid = request.getHeader("X-Company-Id");
        if (!StringUtils.hasText(cid)) cid = request.getHeader("X-COMPANY-ID");
        if (!StringUtils.hasText(cid)) cid = request.getHeader("x-company-id");
        if (!StringUtils.hasText(cid)) cid = request.getHeader("Company-Id");
        if (!StringUtils.hasText(cid)) cid = request.getHeader("company-id");
        if (!StringUtils.hasText(cid)) cid = request.getParameter("companyId");
        if (!StringUtils.hasText(cid)) cid = request.getParameter("company_id");
        if (StringUtils.hasText(cid)) {
            try {
                return UUID.fromString(cid.trim());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private UUID extractUserIdFromClaims(Claims claims) {
        Object uidClaim = claims.get("userId");
        if (uidClaim == null) uidClaim = claims.get("user_id");
        if (uidClaim == null) uidClaim = claims.get("id");
        if (uidClaim != null) {
            try {
                return UUID.fromString(uidClaim.toString());
            } catch (Exception ignored) {}
        }
        String sub = claims.getSubject();
        if (sub != null) {
            try {
                return UUID.fromString(sub);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private UUID extractUserIdFromHeaders(HttpServletRequest request) {
        String uid = request.getHeader("X-User-Id");
        if (!StringUtils.hasText(uid)) uid = request.getHeader("X-USER-ID");
        if (!StringUtils.hasText(uid)) uid = request.getHeader("x-user-id");
        if (!StringUtils.hasText(uid)) uid = request.getHeader("User-Id");
        if (!StringUtils.hasText(uid)) uid = request.getHeader("user-id");
        if (!StringUtils.hasText(uid)) uid = request.getParameter("userId");
        if (!StringUtils.hasText(uid)) uid = request.getParameter("user_id");
        if (StringUtils.hasText(uid)) {
            try {
                return UUID.fromString(uid.trim());
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String extractUserNameFromClaims(Claims claims) {
        Object name = claims.get("name");
        if (name == null) name = claims.get("username");
        if (name == null) name = claims.get("fullName");
        return name != null ? name.toString() : null;
    }

    private String extractUserNameFromHeaders(HttpServletRequest request) {
        String name = request.getHeader("X-User-Name");
        if (!StringUtils.hasText(name)) name = request.getHeader("X-USERNAME");
        if (!StringUtils.hasText(name)) name = request.getHeader("X-Username");
        if (!StringUtils.hasText(name)) name = request.getHeader("x-username");
        if (!StringUtils.hasText(name)) name = request.getHeader("User-Name");
        if (!StringUtils.hasText(name)) name = request.getHeader("user-name");
        return StringUtils.hasText(name) ? name.trim() : null;
    }

    private List<GrantedAuthority> extractAuthoritiesFromClaims(Claims claims) {
        List<GrantedAuthority> auths = new ArrayList<>();
        Object rolesObj = claims.get("roles");
        if (rolesObj == null) rolesObj = claims.get("role");

        if (rolesObj instanceof Collection<?> col) {
            for (Object item : col) {
                if (item != null) {
                    String r = item.toString().trim();
                    auths.add(new SimpleGrantedAuthority(r.startsWith("ROLE_") ? r : "ROLE_" + r));
                }
            }
        } else if (rolesObj instanceof String str && StringUtils.hasText(str)) {
            for (String r : str.split(",")) {
                String role = r.trim();
                if (!role.isEmpty()) {
                    auths.add(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
                }
            }
        }

        if (auths.isEmpty()) {
            auths.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return auths;
    }

    private List<GrantedAuthority> extractAuthoritiesFromUser(UserResponse user) {
        List<GrantedAuthority> auths = new ArrayList<>();
        if (user.getRole() != null) {
            for (RoleResponse r : user.getRole()) {
                if (r != null && r.isStatus() && StringUtils.hasText(r.getName())) {
                    String role = r.getName().trim();
                    auths.add(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
                }
            }
        }
        if (auths.isEmpty()) {
            auths.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return auths;
    }

    private boolean isValidServiceToken(String providedToken) {
        String configuredToken = serviceAuthProperties.getInternalToken();
        if (!StringUtils.hasText(configuredToken)) {
            return false;
        }
        // Timing-attack safe comparison
        return MessageDigest.isEqual(
                providedToken.getBytes(StandardCharsets.UTF_8),
                configuredToken.getBytes(StandardCharsets.UTF_8)
        );
    }
}
