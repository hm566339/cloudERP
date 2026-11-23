package com.erp.crm.common.security;

import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class CrossTenantAccessSecurityTest {

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Should prevent cross-tenant IDOR when tenant A attempts to specify tenant B companyId")
    void testCrossTenantIdorPrevention() {
        UUID companyA = UUID.randomUUID();
        UUID companyB = UUID.randomUUID();

        // User is authenticated under Company A
        CurrentUserContext.setCompanyId(companyA);
        CurrentUserContext.setUserId(UUID.randomUUID());

        // Attempt to access or pass Company B
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> {
            CurrentUserContext.resolveCompanyId(companyB);
        });

        assertTrue(ex.getMessage().contains("Cross-tenant access forbidden"));
    }

    @Test
    @DisplayName("Should allow tenant when requested companyId matches session companyId")
    void testTenantSelfAccess_Success() {
        UUID companyA = UUID.randomUUID();

        CurrentUserContext.setCompanyId(companyA);
        CurrentUserContext.setUserId(UUID.randomUUID());

        UUID resolved = CurrentUserContext.resolveCompanyId(companyA);
        assertEquals(companyA, resolved);

        // Also test null requestCompanyId defaults to tenant companyId
        UUID resolvedNull = CurrentUserContext.resolveCompanyId(null);
        assertEquals(companyA, resolvedNull);
    }

    @Test
    @DisplayName("Should block unauthenticated requests without session company context")
    void testUnauthenticatedAccessBlocked() {
        UUID targetCompany = UUID.randomUUID();

        // No session context set
        assertThrows(AccessDeniedException.class, () -> {
            CurrentUserContext.resolveCompanyId(targetCompany);
        });
    }

    @Test
    @DisplayName("Should allow SystemAdmin to operate across companies with explicit companyId")
    void testSystemAdminCrossCompanyAccess() {
        UUID targetCompany = UUID.randomUUID();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "sysadmin", "n/a", List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        UUID resolved = CurrentUserContext.resolveCompanyId(targetCompany);
        assertEquals(targetCompany, resolved);
    }
}

