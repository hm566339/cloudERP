package com.erp.auth_service.security;

import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;

@Component("customJwtDecoder")
public class JwtDecoder {

    private final PublicKey publicKey;

    public JwtDecoder() {
        try {
            ClassPathResource resource = new ClassPathResource("keys/public_key.pem");
            String keyContent = new String(resource.getInputStream().readAllBytes());

            keyContent = keyContent
                    .replace("-----BEGIN PUBLIC KEY-----", "")
                    .replace("-----END PUBLIC KEY-----", "")
                    .replaceAll("\\s+", "");

            // 🔥 IMPORTANT: MIME decoder (correct for PEM)
            byte[] keyBytes = Base64.getMimeDecoder().decode(keyContent);

            X509EncodedKeySpec keySpec = new X509EncodedKeySpec(keyBytes);
            publicKey = KeyFactory.getInstance("RSA").generatePublic(keySpec);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load public key", e);
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(publicKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isValidToken(String token) {
        try {
            extractClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        return extractClaims(token)
                .getExpiration()
                .before(new Date());
    }

    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    public Date extractExpiration(String token) {
        return extractClaims(token).getExpiration();
    }

    public boolean isTokenValid(String token) {
        try {
            var ext = extractClaims(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public UUID extractUserId(String token) {
        String userId = extractClaims(token).get("userId", String.class);

        if (userId == null) {
            throw new RuntimeException("userId claim not found in token");
        }

        return UUID.fromString(userId);
    }

    public boolean isAccessToken(String token) {
        try {
            String tokenType = extractClaims(token).get("token_type", String.class);
            return "access".equals(tokenType);
        } catch (Exception e) {
            return false;
        }
    }

    public List<String> extractRoles(String token) {
        Claims claims = extractClaims(token);

        Object rolesObj = claims.get("roles");

        if (rolesObj == null) {
            return Collections.emptyList();
        }

        // Convert to List<String>
        if (rolesObj instanceof List<?>) {
            List<?> rolesList = (List<?>) rolesObj;
            List<String> roles = new ArrayList<>();

            for (Object role : rolesList) {
                roles.add(String.valueOf(role));
            }

            return roles;
        }

        return Collections.emptyList();
    }

    public boolean isTokenValid(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return extractedUsername != null
                && extractedUsername.equalsIgnoreCase(username)
                && !isTokenExpired(token);
    }
}