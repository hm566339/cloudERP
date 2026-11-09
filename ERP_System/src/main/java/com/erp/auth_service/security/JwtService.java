package com.erp.auth_service.security;

import io.jsonwebtoken.Jwts;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class JwtService {

    private final PrivateKey privateKey;

    private static final SecureRandom secureRandom = new SecureRandom();
    private static final Base64.Encoder base64Encoder = Base64.getUrlEncoder().withoutPadding();

    public JwtService() {
        try {
            // Load from resources/keys/private_pkcs8.pem
            ClassPathResource resource = new ClassPathResource("keys/private_key.pem");
            String keyContent = new String(resource.getInputStream().readAllBytes());

            // Parse PEM file content
            keyContent = keyContent
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", ""); // Remove all whitespace

            byte[] keyBytes = Base64.getDecoder().decode(keyContent);
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            privateKey = KeyFactory.getInstance("RSA").generatePrivate(spec);

        } catch (Exception e) {
            throw new RuntimeException("Failed to load private key", e);
        }
    }

    @Value("${security.jwt.access-token-expiration-minutes:30}")
    private long accessTokenExpirationMinutes = 30;

    private static final long REFRESH_EXPIRATION = 1000L * 60 * 60 * 24 * 30; // 30 days

    public JwtService(long accessTokenExpirationMinutes) {
        this();
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
    }

    public long getAccessTokenExpirationMinutes() {
        return accessTokenExpirationMinutes;
    }

    public void setAccessTokenExpirationMinutes(long accessTokenExpirationMinutes) {
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
    }

    public long getAccessTokenExpirationMillis() {
        return accessTokenExpirationMinutes * 60 * 1000L;
    }

    // ================= ACCESS TOKEN =================

    public String generateAccessToken(String username, Map<String, Object> claims) {
        return generateAccessToken(username, claims, accessTokenExpirationMinutes);
    }

    public String generateAccessToken(String username, Map<String, Object> claims, long expirationMinutes) {
        long effectiveMinutes = expirationMinutes > 0 ? expirationMinutes : accessTokenExpirationMinutes;
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        Date expiry = new Date(nowMillis + (effectiveMinutes * 60 * 1000L));

        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(now)
                .expiration(expiry)
                .id(UUID.randomUUID().toString())
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    // ================= REFRESH TOKEN =================

    public String generateRefreshToken(String username, String clientId) {

        Map<String, Object> claims = new HashMap<>();
        claims.put("token_type", "refresh");
        claims.put("clientId", clientId);
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + REFRESH_EXPIRATION))
                .id(UUID.randomUUID().toString())
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public String generateVerifyToken(String email) {
        return Jwts.builder()
                .subject("verify")
                .claim("email", email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 10)) // 10 min
                .id(UUID.randomUUID().toString())
                .signWith(privateKey, Jwts.SIG.RS256)
                .compact();
    }

    public static String generateRandomToken() {
        byte[] randomBytes = new byte[32]; // 256-bit
        secureRandom.nextBytes(randomBytes);
        return base64Encoder.encodeToString(randomBytes);
    }

}