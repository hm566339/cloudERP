package com.erp.manufacturing.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    private final SecretKey secretKey;
    private PublicKey publicKey;

    public JwtTokenProvider(@Value("${app.jwt.secret:${jwt.secret:default-secret-key-must-be-at-least-32-chars-long-for-hmac256}}") String secret) {
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
                log.info("Loaded RSA public key for manufacturing-service JWT validation");
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

    public UUID getUserIdFromToken(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return null;
        Object userIdClaim = claims.get("userId");
        if (userIdClaim == null) userIdClaim = claims.get("user_id");
        if (userIdClaim == null) userIdClaim = claims.getSubject();
        if (userIdClaim != null) {
            try {
                return UUID.fromString(userIdClaim.toString().trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return null;
    }

    public UUID getCompanyIdFromToken(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return null;
        Object companyIdClaim = claims.get("companyId");
        if (companyIdClaim == null) companyIdClaim = claims.get("company_id");
        if (companyIdClaim != null) {
            try {
                return UUID.fromString(companyIdClaim.toString().trim());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return null;
    }

    public String getUsernameFromToken(String token) {
        Claims claims = extractClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    @SuppressWarnings("unchecked")
    public List<String> getRolesFromToken(String token) {
        Claims claims = extractClaims(token);
        if (claims == null) return Collections.emptyList();
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?>) {
            return ((List<?>) rolesObj).stream().map(Object::toString).toList();
        } else if (rolesObj instanceof String str && !str.isBlank()) {
            return Arrays.stream(str.split(",")).map(String::trim).toList();
        }
        return Collections.emptyList();
    }

    public String generateToken(UUID userId, UUID companyId, String role, List<String> features, List<String> permissions) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(userId != null ? userId.toString() : "anonymous")
                .claim("userId", userId != null ? userId.toString() : null)
                .claim("companyId", companyId != null ? companyId.toString() : null)
                .claim("roles", role != null ? List.of(role) : Collections.emptyList())
                .claim("features", features != null ? features : Collections.emptyList())
                .claim("permissions", permissions != null ? permissions : Collections.emptyList())
                .issuedAt(new Date(now))
                .expiration(new Date(now + 3600000))
                .signWith(secretKey)
                .compact();
    }
}
