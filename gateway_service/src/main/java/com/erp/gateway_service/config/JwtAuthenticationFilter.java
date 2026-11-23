package com.erp.gateway_service.config;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

        private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

        private PublicKey publicKey;

        private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

        /**
         * Reserved organization sub-paths that are NEVER public — they always require a
         * valid JWT. This mirrors SsoPublicEndpoints.RESERVED_ORGANIZATION_PATHS in the
         * auth service so that both layers enforce the same boundary.
         */
        private static final java.util.Set<String> RESERVED_ORGANIZATION_PATHS = java.util.Set.of(
                        "role-templates",
                        "permissions",
                        "members",
                        "appearance",
                        "profile",
                        "login-portal",
                        "regional-settings",
                        "security",
                        "companies",
                        "subscription",
                        "modules",
                        "settings",
                        "audit");

        private static final List<String> PUBLIC_PATTERNS = List.of(
                        // Auth & SSO public endpoints
                        "/api/admin/auth/login",
                        "/api/sso/admin/auth/login",
                        "/api/sso/auth/login",
                        "/api/sso/auth/select-company",
                        "/api/sso/auth/admin-login",
                        "/api/sso/auth/register",
                        "/api/sso/signup",
                        // NOTE: /api/sso/organization/* is intentionally omitted here.
                        // Public organization lookup (GET /api/sso/organization/{code}) is handled
                        // through isPublicOrganizationLookup() in isPublicEndpoint() below,
                        // using the RESERVED_ORGANIZATION_PATHS allowlist to protect admin endpoints.
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

                        // CRM Integrations public endpoints (OAuth callback & webhooks)
                        "/api/crm/integrations/oauth/*/callback",
                        "/api/crm/integrations/oauth/*/callback/**",
                        "/api/crm/integrations/oauth/**",
                        "/api/crm/integrations/webhook/**",
                        "/api/crm/integrations/webhook",
                        "/api/crm/integrations/facebook/webhook",
                        "/api/crm/integrations/facebook/webhook/**",

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

        /**
         * Returns true when the request path is a public (unauthenticated) endpoint
         * that
         * the gateway should let through without JWT validation.
         *
         * Public organization lookup: GET /api/sso/organization/{code}
         * – Only a single-segment code path is public (e.g.
         * /api/sso/organization/my-org).
         * – Any path that extends further or whose segment matches a reserved admin
         * path
         * (companies, subscription, appearance, members, etc.) is PROTECTED and
         * requires
         * a valid JWT. This mirrors SsoPublicEndpoints.isPublicOrganizationLookup() in
         * the auth service.
         */
        public static boolean isPublicEndpoint(String method, String path) {
                if (!StringUtils.hasText(path)) {
                        return false;
                }

                // Public user registration (POST /api/sso/user)
                if ("POST".equalsIgnoreCase(method)
                                && ("/api/sso/user".equals(path) || "/api/sso/user/".equals(path))) {
                        return true;
                }

                String normalizedPath = path.endsWith("/") && path.length() > 1
                                ? path.substring(0, path.length() - 1)
                                : path;

                // Public organization lookup: GET /api/sso/organization/{orgCode}
                // Protected if: not GET, path goes deeper than one segment, or segment is a
                // reserved admin path.
                if (normalizedPath.startsWith("/api/sso/organization/")) {
                        if (!"GET".equalsIgnoreCase(method)) {
                                return false; // Only GET is ever public for org lookup
                        }
                        String sub = normalizedPath.substring("/api/sso/organization/".length());
                        // Must be exactly one non-empty segment (no further slashes)
                        if (sub.isEmpty() || sub.contains("/")) {
                                return false;
                        }
                        // Reserved admin sub-paths are protected (require authentication)
                        if (RESERVED_ORGANIZATION_PATHS.contains(sub.toLowerCase(java.util.Locale.ROOT))) {
                                return false;
                        }
                        return true;
                }

                // CRM Integrations public endpoints (OAuth callbacks from Meta/Google & inbound webhooks)
                if (normalizedPath.contains("/api/crm/integrations/oauth/") && normalizedPath.contains("/callback")) {
                        return true;
                }
                if (normalizedPath.startsWith("/api/crm/integrations/webhook")) {
                        return true;
                }

                // All other patterns
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

                log.info("Gateway [INCOMING] -> [{}] {}", method, path);

                // Public APIs skip JWT validation
                if (isPublicEndpoint(method, path)) {
                        log.debug("Gateway [PUBLIC] -> skipping JWT authentication for [{}] {}", method, path);
                        return chain.filter(exchange);
                }

                String token = extractToken(exchange);

                if (token == null) {
                        log.warn("Gateway [UNAUTHORIZED] -> [{}] {} Missing Authorization Header or Cookie", method,
                                        path);
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

                        String tokenType = claims.get("token_type", String.class);
                        if ("refresh".equalsIgnoreCase(tokenType)) {
                                log.warn("Gateway [UNAUTHORIZED] -> [{}] {} Refresh token presented as access token",
                                                method, path);
                                return Mono.error(new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED,
                                                "Refresh token cannot be used as an access token"));
                        }

                        String userId = claims.get("userId", String.class);
                        String companyCode = claims.get("companyCode", String.class);
                        String companyId = claims.get("companyId", String.class);
                        String username = claims.getSubject();
                        Object rolesObj = claims.get("roles");
                        String roles = rolesObj != null ? rolesObj.toString() : "";
                        String scope = claims.get("scope", String.class);

                        String organizationId = claims.get("organizationId", String.class);
                        if (!StringUtils.hasText(organizationId)) {
                            organizationId = exchange.getRequest().getHeaders().getFirst("X-Organization-Id");
                        }
                        if (!StringUtils.hasText(organizationId)) {
                            organizationId = exchange.getRequest().getHeaders().getFirst("X-ORGANIZATION-ID");
                        }
                        if (!StringUtils.hasText(organizationId)) {
                            organizationId = exchange.getRequest().getQueryParams().getFirst("organizationId");
                        }

                        log.info("Gateway [AUTHENTICATED] -> user: {}, userId: {}, roles: {}, companyId: {}, orgId: {}, method: {}, uri: {}",
                                        username, userId, roles, companyId, organizationId, method, path);

                        final String finalToken = token;

                        final String finalOrgId = organizationId == null ? "" : organizationId;

                        ServerWebExchange mutatedExchange = exchange.mutate()
                                        .request(
                                                        exchange.getRequest()
                                                                        .mutate()
                                                                        .headers(headers -> headers.set(
                                                                                        HttpHeaders.AUTHORIZATION,
                                                                                        "Bearer " + finalToken))
                                                                        .header("X-USER-ID",
                                                                                        userId == null ? "" : userId)
                                                                        .header("X-COMPANY-CODE",
                                                                                        companyCode == null ? ""
                                                                                                        : companyCode)
                                                                        .header("X-COMPANY-ID",
                                                                                        companyId == null ? ""
                                                                                                        : companyId)
                                                                        .header("X-ORGANIZATION-ID",
                                                                                        finalOrgId)
                                                                        .header("X-USERNAME",
                                                                                        username == null ? ""
                                                                                                        : username)
                                                                        .header("X-ROLES", roles == null ? "" : roles)
                                                                        .header("X-SCOPE", scope == null ? "" : scope)
                                                                        .build())
                                        .build();

                        return chain.filter(mutatedExchange)
                                        .doFinally(signalType -> {
                                                var statusCode = exchange.getResponse().getStatusCode();
                                                log.info("Gateway [COMPLETED] -> [{}] {} responseStatus: {}, signal: {}",
                                                                method, path, statusCode, signalType);
                                        });

                } catch (Exception ex) {
                        log.warn("Gateway [JWT_FAILED] -> [{}] {} JWT verification failed ({})", method, path,
                                        ex.getClass().getSimpleName());

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