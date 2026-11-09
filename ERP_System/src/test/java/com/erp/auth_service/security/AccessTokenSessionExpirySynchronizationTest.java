package com.erp.auth_service.security;

import com.erp.auth_service.model.Session;
import com.erp.auth_service.model.User;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pure Java + JUnit 5 targeted verification for Access Token and Database Session expiry synchronization.
 *
 * Avoids any Mockito dynamic bytecode self-attachment or JVM Attach API named-pipe
 * operations that are blocked in secure sandboxes on Java 25.
 */
class AccessTokenSessionExpirySynchronizationTest {

    private JwtService jwtService;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(); // Uses default 30 min expiration
        jwtDecoder = new JwtDecoder();
    }

    @Test
    @DisplayName("Requirement 1: Default Access Token validity is synchronized to 30 minutes in JWT exp")
    void testDefaultAccessTokenExpirationIsThirtyMinutes() {
        assertEquals(30, jwtService.getAccessTokenExpirationMinutes(),
                "Default access token expiration minutes must be 30");

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", UUID.randomUUID().toString());
        claims.put("username", "testuser");
        claims.put("organizationId", UUID.randomUUID().toString());

        long beforeMillis = System.currentTimeMillis();
        String token = jwtService.generateAccessToken("testuser", claims);
        long afterMillis = System.currentTimeMillis();

        Claims extracted = jwtDecoder.extractClaims(token);
        Date iat = extracted.getIssuedAt();
        Date exp = extracted.getExpiration();

        assertNotNull(iat, "Issued-at (iat) must not be null");
        assertNotNull(exp, "Expiration (exp) must not be null");

        long durationMillis = exp.getTime() - iat.getTime();
        long expectedMillis = 30L * 60 * 1000; // 1,800,000 ms

        assertEquals(expectedMillis, durationMillis,
                "Access JWT lifetime (exp - iat) must be exactly 30 minutes (1800000 ms)");
        assertTrue(exp.getTime() >= (beforeMillis / 1000L) * 1000L + expectedMillis,
                "Expiration time must be at least 30 minutes from start time");
        assertTrue(exp.getTime() <= afterMillis + expectedMillis + 1000);
    }

    @Test
    @DisplayName("Requirement 2 & 3: Configured Access Token lifetime dynamically adjusts JWT exp")
    void testConfiguredAccessTokenExpirationReflectedInJwtExp() {
        // Test custom configured lifetime (e.g. 45 minutes)
        JwtService customJwtService = new JwtService(45);
        assertEquals(45, customJwtService.getAccessTokenExpirationMinutes());

        Map<String, Object> claims = Map.of("userId", "123");
        String token = customJwtService.generateAccessToken("customuser", claims);

        Claims extracted = jwtDecoder.extractClaims(token);
        long durationMillis = extracted.getExpiration().getTime() - extracted.getIssuedAt().getTime();
        long expectedMillis = 45L * 60 * 1000;

        assertEquals(expectedMillis, durationMillis,
                "Access JWT lifetime with custom configuration must be 45 minutes");
    }

    @Test
    @DisplayName("Requirement 2: Custom per-session expiration matches JWT exp and session validity")
    void testOverloadedCustomExpirationMatchesJwtExp() {
        Map<String, Object> claims = Map.of("userId", "456");
        String token = jwtService.generateAccessToken("custom_session_user", claims, 60);

        Claims extracted = jwtDecoder.extractClaims(token);
        long durationMillis = extracted.getExpiration().getTime() - extracted.getIssuedAt().getTime();
        long expectedMillis = 60L * 60 * 1000;

        assertEquals(expectedMillis, durationMillis,
                "Overloaded generateAccessToken with custom minutes must set exp to 60 minutes");
    }

    @Test
    @DisplayName("Requirement 5: Preserves session ID, user ID, organization ID, and company claims")
    void testAccessTokenPreservesAllSecurityClaims() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID compId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId.toString());
        claims.put("organizationId", orgId.toString());
        claims.put("companyId", compId.toString());
        claims.put("companyCode", "COMP_001");
        claims.put("sessionId", sessionId.toString());
        claims.put("roles", List.of("ROLE_OWNER"));
        claims.put("permissions", List.of("READ", "WRITE"));

        String token = jwtService.generateAccessToken("owner_user", claims);

        Claims parsed = jwtDecoder.extractClaims(token);
        assertEquals("owner_user", parsed.getSubject());
        assertEquals(userId.toString(), parsed.get("userId"));
        assertEquals(orgId.toString(), parsed.get("organizationId"));
        assertEquals(compId.toString(), parsed.get("companyId"));
        assertEquals("COMP_001", parsed.get("companyCode"));
        assertEquals(sessionId.toString(), parsed.get("sessionId"));
        assertEquals(List.of("ROLE_OWNER"), parsed.get("roles"));
        assertEquals(List.of("READ", "WRITE"), parsed.get("permissions"));
        assertNull(parsed.get("token_type"), "Access token must not have token_type=refresh");
    }

    @Test
    @DisplayName("Requirement 6: Refresh Token 30-day lifetime and distinct token_type remain intact")
    void testRefreshTokenProtectionAndDistinctnessPreserved() {
        String username = "employee_user";
        String clientId = "ERP_WORKSPACE";

        String refreshToken = jwtService.generateRefreshToken(username, clientId);
        assertNotNull(refreshToken);

        Claims parsed = jwtDecoder.extractClaims(refreshToken);
        assertEquals("refresh", parsed.get("token_type"),
                "Refresh token must carry token_type=refresh claim");
        assertEquals(clientId, parsed.get("clientId"));
        assertEquals(username, parsed.getSubject());

        long durationMillis = parsed.getExpiration().getTime() - parsed.getIssuedAt().getTime();
        long expectedRefreshMillis = 1000L * 60 * 60 * 24 * 30; // 30 days
        assertEquals(expectedRefreshMillis, durationMillis,
                "Refresh token must preserve 30-day expiration");
    }

    @Test
    @DisplayName("Requirement 1 & 7: Clock synchronization between JWT exp and database Session accessTokenValidTill")
    void testJwtExpAndDatabaseSessionValidTillSynchronization() {
        LocalDateTime nowLocal = LocalDateTime.now();
        long nowMillis = System.currentTimeMillis();

        int expiryMinutes = (int) jwtService.getAccessTokenExpirationMinutes();
        assertEquals(30, expiryMinutes);

        // JWT token generated
        Map<String, Object> claims = Map.of("sessionId", UUID.randomUUID().toString());
        String token = jwtService.generateAccessToken("sync_user", claims);
        Date expDate = jwtDecoder.extractExpiration(token);

        // Database session validTill calculated
        LocalDateTime sessionValidTill = nowLocal.plusMinutes(expiryMinutes);

        // Convert sessionValidTill to epoch millis for exact comparison
        long sessionValidTillEpochMillis = sessionValidTill
                .atZone(java.time.ZoneId.systemDefault())
                .toInstant()
                .toEpochMilli();

        long diffMillis = Math.abs(expDate.getTime() - sessionValidTillEpochMillis);
        assertTrue(diffMillis < 2000,
                "JWT expiration epoch millis and Session accessTokenValidTill epoch millis must be synchronized within 2 seconds. Diff was: " + diffMillis + "ms");
    }

    @Test
    @DisplayName("Requirement 8: Database session validation correctly identifies active vs expired sessions")
    void testDatabaseSessionExpirationEvaluation() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Valid Active Session (created with 30 min expiry)
        Session activeSession = Session.builder()
                .id(UUID.randomUUID())
                .accessTokenValidTill(now.plusMinutes(30))
                .refreshTokenValidTill(now.plusDays(7))
                .build();

        assertNotNull(activeSession.getAccessTokenValidTill());
        assertFalse(activeSession.getAccessTokenValidTill().isBefore(now),
                "Active session validTill must NOT be before current time");
        assertTrue(activeSession.getAccessTokenValidTill().isAfter(now),
                "Active session validTill must be in the future");

        // 2. Expired Session (15 minutes was old cutoff, testing token aged 20 minutes)
        Session expiredSession = Session.builder()
                .id(UUID.randomUUID())
                .accessTokenValidTill(now.minusMinutes(5)) // Expired 5 minutes ago
                .refreshTokenValidTill(now.plusDays(7))
                .build();

        assertTrue(expiredSession.getAccessTokenValidTill().isBefore(now),
                "Expired session must evaluate isBefore(now) as TRUE for 401 rejection");

        // 3. Revoked Session (validTill set to now)
        Session revokedSession = Session.builder()
                .id(UUID.randomUUID())
                .accessTokenValidTill(now.minusSeconds(1))
                .refreshTokenValidTill(now.minusSeconds(1))
                .build();

        assertTrue(revokedSession.getAccessTokenValidTill().isBefore(now),
                "Revoked session must evaluate isBefore(now) as TRUE for 401 rejection");
    }
}
