package com.erp.gateway_service.config;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.List;

import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter
                extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

        private PublicKey publicKey;

        private static final List<String> PUBLIC_APIS = List.of(
                        "/api/sso/auth/login",
                        "/api/sso/auth/admin-login",
                        "/api/sso/auth/register",
                        "/api/sso/authorize",
                        "/api/sso/token/exchange",
                        "/api/sso/token/refresh",
                        "/api/sso/admin/token/refresh",
                        "/api/sso/token/verify",
                        "/api/sso/auth/logout",
                        "/api/sso/company/open",
                        "/api/sso/user/verify-email",
                        "/api/sso/user/forgot-password",
                        "/api/sso/user/reset-password",
                        "/api/sso/session/sso/callback",
                        "/api/sso/session/sso/refresh",
                        "/api/sso/session/sso/logout",
                        "/api/sso/module-routes/internal/routes",

                        // Swagger
                        "/swagger-ui",
                        "/swagger-ui.html",
                        "/api-docs",
                        "/v3/api-docs",

                        // Actuator
                        "/actuator");

        public JwtAuthenticationFilter() {
                super(Config.class);
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
        public GatewayFilter apply(Config config) {

                return (exchange, chain) -> {

                        String path = exchange.getRequest()
                                        .getPath()
                                        .value();

                        // Public APIs skip JWT validation
                        boolean isPublic = PUBLIC_APIS.stream()
                                        .anyMatch(path::startsWith);

                        if (isPublic) {
                                return chain.filter(exchange);
                        }

                        String authHeader = exchange.getRequest()
                                        .getHeaders()
                                        .getFirst(HttpHeaders.AUTHORIZATION);

                        String token = null;

                        // 1. Try to get token from Authorization header
                        if (authHeader != null && authHeader.startsWith("Bearer ")) {
                                token = authHeader.substring(7);
                        } 
                        // 2. Fallback to ACCESS_TOKEN cookie
                        else {
                                HttpCookie cookie = exchange.getRequest()
                                                .getCookies()
                                                .getFirst("ACCESS_TOKEN");
                                if (cookie != null) {
                                        token = cookie.getValue();
                                }
                        }

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

                                String username = claims.getSubject();

                                System.out.println("✅ User: " + username);
                                System.out.println("✅ Company: " + companyCode);

                                final String finalToken = token;

                                return chain.filter(
                                                exchange.mutate()
                                                                .request(
                                                                                exchange.getRequest()
                                                                                                .mutate()

                                                                                                // Ensure Authorization header is present (added if from cookie, kept if from header)
                                                                                                // Using headers.set to replace existing if present
                                                                                                .headers(headers -> headers.set(
                                                                                                                HttpHeaders.AUTHORIZATION,
                                                                                                                "Bearer " + finalToken))

                                                                                                // Custom Headers
                                                                                                .header(
                                                                                                                "X-USER-ID",
                                                                                                                userId == null ? ""
                                                                                                                                : userId)

                                                                                                .header(
                                                                                                                "X-COMPANY-CODE",
                                                                                                                companyCode == null
                                                                                                                                ? ""
                                                                                                                                : companyCode)

                                                                                                .header(
                                                                                                                "X-USERNAME",
                                                                                                                username == null ? ""
                                                                                                                                : username)

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
                };
        }

        public static class Config {
        }
}