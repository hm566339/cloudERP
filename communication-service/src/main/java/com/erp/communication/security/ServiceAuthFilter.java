package com.erp.communication.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ServiceAuthFilter extends OncePerRequestFilter {

    private final ServiceAuthProperties serviceAuthProperties;

    @Value("${app.jwt.secret:default-must-be-overridden-in-production}")
    private String jwtSecret;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") ||
               path.startsWith("/swagger-ui") ||
               path.startsWith("/api-docs") ||
               path.startsWith("/v3/api-docs") ||
               path.startsWith("/webjars");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            boolean authenticated = false;
            String caller = "UNKNOWN";
            UUID companyId = null;

            // 1. Check Service-to-Service Header (e.g. X-Service-Token)
            String serviceToken = request.getHeader(serviceAuthProperties.getHeaderName());
            if (StringUtils.hasText(serviceToken) && isValidServiceToken(serviceToken.trim())) {
                authenticated = true;
                caller = "INTERNAL_SERVICE";

                // Optional tenant header from trusted caller
                String headerCompanyId = request.getHeader("X-Company-Id");
                if (StringUtils.hasText(headerCompanyId)) {
                    try {
                        companyId = UUID.fromString(headerCompanyId.trim());
                    } catch (IllegalArgumentException ignored) {
                    }
                }

                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        "internal-service",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_INTERNAL_SERVICE"))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }

            // 2. Alternatively check Bearer JWT token if service token not supplied
            if (!authenticated) {
                String authHeader = request.getHeader("Authorization");
                if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7).trim();
                    try {
                        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
                        Claims claims = Jwts.parser()
                                .verifyWith(key)
                                .build()
                                .parseSignedClaims(token)
                                .getPayload();

                        String subject = claims.getSubject();
                        authenticated = true;
                        caller = subject;

                        Object cidClaim = claims.get("companyId");
                        if (cidClaim != null) {
                            try {
                                companyId = UUID.fromString(cidClaim.toString());
                            } catch (Exception ignored) {}
                        }

                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                subject,
                                null,
                                List.of(new SimpleGrantedAuthority("ROLE_USER"))
                        );
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    } catch (Exception jwtEx) {
                        log.debug("JWT verification failed: {}", jwtEx.getMessage());
                    }
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

            filterChain.doFilter(request, response);

        } finally {
            TenantContext.clear();
        }
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
