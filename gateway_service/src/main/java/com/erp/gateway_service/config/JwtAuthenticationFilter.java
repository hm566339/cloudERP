package com.erp.gateway_service.config;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.Ordered;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter
                extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config>
                implements GlobalFilter, Ordered {

        private PublicKey publicKey;

        private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

        private static final List<String> PUBLIC_PATTERNS = List.of(
                        // Auth & SSO public endpoints
                        "/api/admin/auth/login",
                        "/api/sso/admin/auth/login",
                        "/api/sso/auth/login",
                        "/api/sso/auth/select-company",
                        "/api/sso/auth/admin-login",
                        "/api/sso/auth/register",
                        "/api/sso/signup",
                        "/api/sso/organization/*",
                        "/api/sso/authorize",
                        "/api/sso/token/exchange",
                        "/api/sso/token/refresh",
                        "/api/sso/company/open",
                        "/api/sso/admin/token/refresh",
                        "/api/sso/token/verify",
                        "/api/sso/auth/logout",
                        "/api/sso/user/verify-email",
                        "/api/sso/user/forgot-password",
                        "/api/sso/user/reset-password",
                        "/api/sso/session/sso/callback",
                        "/api/sso/session/sso/refresh",
                        "/api/sso/session/sso/logout",
                        "/api/sso/module-routes/internal/routes",

                        // Billing webhooks
                        "/api/billing/webhook/**",
                        "/api/sso/billing/webhook/**",

                        // Swagger / OpenAPI
                        "/swagger-ui/**",
                        "/swagger-ui",
                        "/swagger-ui.html",
                        "/api-docs/**",
                        "/api-docs",
                        "/v3/api-docs/**",
                        "/v3/api-docs",

                        // Actuator
                        "/actuator/**",
                        "/actuator");

        public JwtAuthenticationFilter() {
                super(Config.class);
        }

        @Override
        public int getOrder() {
                return -100;
        }

        @PostConstruct
        public void loadPublicKey() throws Exception {

                ClassPathResource resource = new ClassPathResource("keys/public_key.pem");

                String pem = new String(resource.getInputStream().readAllBytes());

                pem = pem.replace("-----BEGIN PUBLIC KEY-----", "")
                                .replace("-----END PUBLIC KEY-----", "")
                                .replaceAll("\\s+", "");

                byte[] decoded = Base64.getDecoder().decode(pem);

                X509EncodedKeySpec keySpec = new X509EncodedKeySpec(decoded);

                publicKey = KeyFactory.getInstance("RSA")
                                .generatePublic(keySpec);

                System.out.println("🔑 Public key loaded successfully");
        }

        @Override
        public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
                return authenticateAndExecute(exchange, chain);
        }

        @Override
        public GatewayFilter apply(Config config) {
                return (exchange, chain) -> authenticateAndExecute(exchange, chain);
        }

        public static boolean isPublicEndpoint(String method, String path) {
                if (!StringUtils.hasText(path)) {
                        return false;
                }

                // Public user registration (POST /api/sso/user)
                if ("POST".equalsIgnoreCase(method) && ("/api/sso/user".equals(path) || "/api/sso/user/".equals(path))) {
                        return true;
                }

                String normalizedPath = path.endsWith("/") && path.length() > 1
                                ? path.substring(0, path.length() - 1)
                                : path;

                for (String pattern : PUBLIC_PATTERNS) {
                        if (PATH_MATCHER.match(pattern, path) || PATH_MATCHER.match(pattern, normalizedPath)) {
                                return true;
                        }
                }

                return false;
        }

        private Mono<Void> authenticateAndExecute(ServerWebExchange exchange, GatewayFilterChain chain) {
                String path = exchange.getRequest()
                                .getPath()
                                .value();
                String method = exchange.getRequest()
                                .getMethod() != null ? exchange.getRequest().getMethod().name() : "";

                // Public APIs skip JWT validation
                if (isPublicEndpoint(method, path)) {
                        return chain.filter(exchange);
                }

                String token = extractToken(exchange);

                if (token == null) {
                        return Mono.error(
                                        new ResponseStatusException(
                                                        HttpStatus.UNAUTHORIZED,
                                                        "Missing Authorization Header or Cookie"));
                }

                try {
                        Claims claims = Jwts.parser()
                                        .verifyWith(publicKey)
                                        .build()
                                        .parseSignedClaims(token)
                                        .getPayload();

                        String userId = claims.get("userId", String.class);
                        String companyCode = claims.get("companyCode", String.class);
                        String companyId = claims.get("companyId", String.class);
                        String username = claims.getSubject();
                        Object rolesObj = claims.get("roles");
                        String roles = rolesObj != null ? rolesObj.toString() : "";
                        String scope = claims.get("scope", String.class);

                        final String finalToken = token;

                        return chain.filter(
                                        exchange.mutate()
                                                        .request(
                                                                        exchange.getRequest()
                                                                                        .mutate()
                                                                                        .headers(headers -> headers.set(
                                                                                                        HttpHeaders.AUTHORIZATION,
                                                                                                        "Bearer " + finalToken))
                                                                                        .header("X-USER-ID", userId == null ? "" : userId)
                                                                                        .header("X-COMPANY-CODE", companyCode == null ? "" : companyCode)
                                                                                        .header("X-COMPANY-ID", companyId == null ? "" : companyId)
                                                                                        .header("X-USERNAME", username == null ? "" : username)
                                                                                        .header("X-ROLES", roles == null ? "" : roles)
                                                                                        .header("X-SCOPE", scope == null ? "" : scope)
                                                                                        .build())
                                                        .build());

                } catch (Exception ex) {
                        System.out.println(
                                        "❌ JWT Verification failed: "
                                                        + ex.getMessage());

                        return Mono.error(
                                        new ResponseStatusException(
                                                        HttpStatus.UNAUTHORIZED,
                                                        "Invalid Token"));
                }
        }

        private String extractToken(ServerWebExchange exchange) {
                String authHeader = exchange.getRequest()
                                .getHeaders()
                                .getFirst(HttpHeaders.AUTHORIZATION);

                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        return authHeader.substring(7);
                }

                for (String cookieName : List.of("ACCESS_TOKEN", "access_token", "auth_token")) {
                        HttpCookie cookie = exchange.getRequest()
                                        .getCookies()
                                        .getFirst(cookieName);
                        if (cookie != null && StringUtils.hasText(cookie.getValue())) {
                                return cookie.getValue();
                        }
                }

                return null;
        }

        public static class Config {
        }
}