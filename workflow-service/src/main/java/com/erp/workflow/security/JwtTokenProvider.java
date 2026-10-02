package com.erp.workflow.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey secretKey;

    public JwtTokenProvider(@Value("${app.jwt.secret:default-secret-key-must-be-at-least-32-chars-long-for-hmac256}") String secret) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, keyBytes.length);
            keyBytes = padded;
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

    public UserPrincipal parseUserFromToken(String token) {
        Claims claims = Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token).getPayload();

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

        String username = claims.get("username", String.class);
        if (username == null) username = claims.getSubject();

        String email = claims.get("email", String.class);

        List<String> roles = new ArrayList<>();
        Object rolesObj = claims.get("roles");
        if (rolesObj instanceof List<?>) {
            for (Object r : (List<?>) rolesObj) {
                if (r != null) roles.add(r.toString());
            }
        }

        return UserPrincipal.builder()
                .userId(userId)
                .companyId(companyId)
                .username(username)
                .email(email)
                .roles(roles)
                .build();
    }
}
