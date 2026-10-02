package com.erp.account.security.feature;

import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FeatureAuthorizationServiceTest {

    private final FeatureAuthorizationService service = new FeatureAuthorizationService();

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String... authorities) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "johndoe", null,
                List.of(authorities).stream().map(SimpleGrantedAuthority::new).toList());
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserId(userId);
    }

    @Test
    @DisplayName("SYSTEM_ADMIN bypasses the feature check")
    void testHasFeature_SystemAdmin_BypassesCheck() {
        authenticate("ROLE_SYSTEM_ADMIN");

        assertTrue(service.hasFeature(userId, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Active FEATURE authority grants the feature")
    void testHasFeature_ActiveFeatureAuthority_Grants() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_PAYMENTS");

        assertTrue(service.hasFeature(userId, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Missing feature authority denies the feature")
    void testHasFeature_WithoutFeatureAuthority_Denies() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_DASHBOARD");

        assertFalse(service.hasFeature(userId, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Heartbeat of the request is the VERIFIED SSO authorities, no further SSO call")
    void testHasFeature_NoSeparateSsoCall_NoCache() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_PAYMENTS");

        assertTrue(service.hasFeature(userId, "PAYMENTS", null));
        assertFalse(service.hasFeature(userId, "REPORTS", null));
    }

    @Test
    @DisplayName("Missing authentication context fails closed with AccessDeniedException")
    void testHasFeature_NoAuthenticationContext_FailsClosed() {
        // No SecurityContext and no CurrentUserContext
        assertThrows(AccessDeniedException.class,
                () -> service.hasFeature(userId, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Null user id is always denied (fail closed)")
    void testHasFeature_NullUser_Denied() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_PAYMENTS");

        assertFalse(service.hasFeature(null, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Foreign user id (not the authenticated one) is denied")
    void testHasFeature_UserIdMismatch_Denied() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_PAYMENTS");

        UUID other = UUID.randomUUID();
        assertFalse(service.hasFeature(other, "PAYMENTS", null));
    }

    @Test
    @DisplayName("Blank feature code is denied (fail closed)")
    void testHasFeature_BlankFeatureCode_Denied() {
        authenticate("ROLE_ACCOUNTANT", "FEATURE_PAYMENTS");

        assertFalse(service.hasFeature(userId, "   ", null));
        assertFalse(service.hasFeature(userId, null, null));
    }

    @Test
    @DisplayName("Unauthenticated anonymous context is treated as missing")
    void testHasFeature_AnonymousContextIsMissing() {
        String message = assertThrows(AccessDeniedException.class,
                () -> service.hasFeature(userId, "PAYMENTS", null)).getMessage();
        assertEquals("Authentication context is missing or invalid", message);
    }
}