package com.erp.inventory.common.security.feature;

import com.erp.inventory.common.security.CurrentUserContext;
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

        assertTrue(service.hasFeature(userId, "STOCK", null));
    }

    @Test
    @DisplayName("Active FEATURE authority grants the feature")
    void testHasFeature_ActiveFeatureAuthority_Grants() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_STOCK");

        assertTrue(service.hasFeature(userId, "STOCK", null));
    }

    @Test
    @DisplayName("Missing feature authority denies the feature")
    void testHasFeature_WithoutFeatureAuthority_Denies() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_REPORTS");

        assertFalse(service.hasFeature(userId, "STOCK", null));
    }

    @Test
    @DisplayName("Decision uses the VERIFIED SSO authorities, no further SSO call")
    void testHasFeature_NoSeparateSsoCall_NoCache() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_STOCK");

        assertTrue(service.hasFeature(userId, "STOCK", null));
        assertFalse(service.hasFeature(userId, "REPORTS", null));
    }

    @Test
    @DisplayName("Missing authentication context fails closed with AccessDeniedException")
    void testHasFeature_NoAuthenticationContext_FailsClosed() {
        // No SecurityContext and no CurrentUserContext
        assertThrows(AccessDeniedException.class,
                () -> service.hasFeature(userId, "STOCK", null));
    }

    @Test
    @DisplayName("Null user id is always denied (fail closed)")
    void testHasFeature_NullUser_Denied() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_STOCK");

        assertFalse(service.hasFeature(null, "STOCK", null));
    }

    @Test
    @DisplayName("Foreign user id (not the authenticated one) is denied")
    void testHasFeature_UserIdMismatch_Denied() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_STOCK");

        UUID other = UUID.randomUUID();
        assertFalse(service.hasFeature(other, "STOCK", null));
    }

    @Test
    @DisplayName("Blank feature code is denied (fail closed)")
    void testHasFeature_BlankFeatureCode_Denied() {
        authenticate("ROLE_INVENTORY_MANAGER", "FEATURE_STOCK");

        assertFalse(service.hasFeature(userId, "   ", null));
        assertFalse(service.hasFeature(userId, null, null));
    }

    @Test
    @DisplayName("Unauthenticated anonymous context is treated as missing")
    void testHasFeature_AnonymousContextIsMissing() {
        String message = assertThrows(AccessDeniedException.class,
                () -> service.hasFeature(userId, "STOCK", null)).getMessage();
        assertEquals("Authentication context is missing or invalid", message);
    }
}