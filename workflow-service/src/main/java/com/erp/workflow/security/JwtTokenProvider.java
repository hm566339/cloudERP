package com.erp.workflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.*;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private PublicKey publicKey;

    public JwtTokenProvider(@Value("${app.jwt.secret:default-secret-key-must-be-at-least-32-chars-long-for-hmac256}") String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);

        try {
            ClassPathResource resource = new ClassPathResource("keys/public_key.pem");
            if (resource.exists()) {
                String keyContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                keyContent = keyContent
                        .replace("-----BEGIN PUBLIC KEY-----", "")
                        .replace("-----END PUBLIC KEY-----", "")
                        .replaceAll("\\s+", "");
                byte[] decoded = Base64.getMimeDecoder().decode(keyContent);
                X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
                this.publicKey = KeyFactory.getInstance("RSA").generatePublic(spec);
                log.info("Loaded RSA public key for workflow-service JWT validation");
            }
        } catch (Exception ex) {
            log.warn("Could not load RSA public key from keys/public_key.pem: {}", ex.getMessage());
        }
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        try {
            Claims claims = extractClaims(token);
            if (claims == null) {
                return false;
            }
            Date expiration = claims.getExpiration();
            if (expiration != null && expiration.before(new Date())) {
                log.debug("JWT token is expired: exp={}", expiration);
                return false;
            }
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public Claims extractClaims(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String cleanToken = token.startsWith("Bearer ") ? token.substring(7).trim() : token.trim();
        if (publicKey != null) {
            try {
                return Jwts.parser().verifyWith(publicKey).build().parseSignedClaims(cleanToken).getPayload();
            } catch (JwtException e) {
                log.debug("RSA verification failed, attempting HMAC secret fallback: {}", e.getMessage());
            }
        }
        return Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(cleanToken).getPayload();
    }

    public UserPrincipal parseUserFromToken(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) {
            return null;
        }

        UUID userId = null;
        Object userIdClaim = claims.get("userId");
        if (userIdClaim == null) userIdClaim = claims.get("user_id");
        if (userIdClaim == null) userIdClaim = claims.getSubject();
        if (userIdClaim != null) {
            try {
                userId = UUID.fromString(userIdClaim.toString());
            } catch (IllegalArgumentException ignored) {}
        }

        UUID companyId = null;
        Object companyIdClaim = claims.get("companyId");
        if (companyIdClaim == null) companyIdClaim = claims.get("company_id");
        if (companyIdClaim != null) {
            try {
                companyId = UUID.fromString(companyIdClaim.toString());
            } catch (IllegalArgumentException ignored) {}
        }

        String companyCode = claims.get("companyCode", String.class);
        if (companyCode == null) companyCode = claims.get("company_code", String.class);

        UUID orgId = companyId;
        Object orgClaim = claims.get("organizationId");
        if (orgClaim == null) orgClaim = claims.get("orgId");
        if (orgClaim != null) {
            try {
                orgId = UUID.fromString(orgClaim.toString());
            } catch (IllegalArgumentException ignored) {}
        }

        String username = claims.get("username", String.class);
        if (username == null) username = claims.getSubject();

        String email = claims.get("email", String.class);

        Set<String> rolesSet = new LinkedHashSet<>();
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?> list) {
            for (Object r : list) {
                if (r != null && !r.toString().isBlank()) rolesSet.add(r.toString().trim());
            }
        } else if (rolesObj instanceof String str && !str.isBlank()) {
            for (String r : str.split(",")) {
                if (!r.trim().isBlank()) rolesSet.add(r.trim());
            }
        }

        Object scopeObj = claims.get("scope");
        if (scopeObj != null) {
            String scope = scopeObj.toString();
            if (scope.contains("SYSTEM_ADMIN")) {
                rolesSet.add("SYSTEM_ADMIN");
            }
        }

        Object loginType = claims.get("loginType");
        if ("ADMIN".equals(loginType) || "ADMIN_PANEL".equals(claims.getIssuer())) {
            rolesSet.add("SYSTEM_ADMIN");
        }

        String accessMode = claims.get("accessMode", String.class);
        if (accessMode == null) accessMode = "FULL";

        return UserPrincipal.builder()
                .userId(userId)
                .companyId(companyId)
                .companyCode(companyCode)
                .organizationId(orgId)
                .username(username)
                .email(email)
                .accessMode(accessMode)
                .roles(new ArrayList<>(rolesSet))
                .build();
    }
}
