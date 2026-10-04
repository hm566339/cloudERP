package com.erp.auth_service.security;

import com.erp.auth_service.controller.CompanySubscriptionController;
import com.erp.auth_service.dto.response.CompanySubscriptionResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.service.SubscriptionPlanService;
import com.erp.auth_service.utility.AccessMode;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CompanySubscriptionSecurityTest {

    @Mock
    private SubscriptionPlanService subscriptionPlanService;

    @InjectMocks
    private CompanySubscriptionController controller;

    private UUID companyAId;
    private UUID companyBId;
    private UUID userAId;

    @BeforeEach
    void setUp() {
        companyAId = UUID.randomUUID();
        companyBId = UUID.randomUUID();
        userAId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("12. User from Company A CANNOT access Company B subscription (Tenant Isolation Enforced)")
    void testCompanyCannotAccessAnotherCompanySubscription() {
        // Authenticated context for Company A
        RequestContext.set(userAId, UUID.randomUUID(), companyAId, null, AccessMode.FULL);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "john@companya.com", null, List.of(new SimpleGrantedAuthority("OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        // Attempting to access Company B's subscription
        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                controller.getCompanySubscription(companyBId));

        assertTrue(ex.getMessage().contains("Cannot access subscription data for another company"));
        verify(subscriptionPlanService, never()).getCurrentCompanySubscription(companyBId);
    }

    @Test
    @DisplayName("User from Company A CAN access Company A's own subscription")
    void testCompanyCanAccessOwnSubscription() {
        RequestContext.set(userAId, UUID.randomUUID(), companyAId, null, AccessMode.FULL);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "john@companya.com", null, List.of(new SimpleGrantedAuthority("OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(subscriptionPlanService.getCurrentCompanySubscription(companyAId))
                .thenReturn(CompanySubscriptionResponse.builder().companyId(companyAId).build());

        ResponseEntity<ResponseWrapper<CompanySubscriptionResponse>> response =
                controller.getCompanySubscription(companyAId);

        assertNotNull(response);
        assertEquals(companyAId, response.getBody().getData().getCompanyId());
    }

    @Test
    @DisplayName("Elevated SYSTEM_ADMIN can access Company B subscription for administration")
    void testSystemAdminCanAccessAnyCompanySubscription() {
        RequestContext.set(userAId, UUID.randomUUID(), companyAId, null, AccessMode.FULL);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "admin@clouderp.com", null, List.of(new SimpleGrantedAuthority("SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(subscriptionPlanService.getCurrentCompanySubscription(companyBId))
                .thenReturn(CompanySubscriptionResponse.builder().companyId(companyBId).build());

        ResponseEntity<ResponseWrapper<CompanySubscriptionResponse>> response =
                controller.getCompanySubscription(companyBId);

        assertNotNull(response);
        assertEquals(companyBId, response.getBody().getData().getCompanyId());
    }
}
