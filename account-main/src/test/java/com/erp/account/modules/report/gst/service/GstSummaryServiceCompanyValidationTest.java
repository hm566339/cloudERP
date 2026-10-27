package com.erp.account.modules.report.gst.service;

import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.modules.report.gst.calculator.TaxCalculationEngine;
import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.security.CurrentUserContext;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GstSummaryServiceCompanyValidationTest {

    @Mock
    private TaxCalculationEngine calculationEngine;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query countQuery;

    @Mock
    private Query storedOrgQuery;

    @InjectMocks
    private GstSummaryService gstSummaryService;

    private static final UUID TARGET_COMPANY_ID = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
    private static final UUID UNRELATED_COMPANY_ID = UUID.fromString("99999999-9999-9999-9999-999999999999");
    private static final UUID AUTHORIZED_ORG_ID = UUID.fromString("5529d8af-d97a-42e9-b2c4-41b3a294ec87");
    private static final UUID OTHER_ORG_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");

    @BeforeEach
    void setUp() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
        ReflectionTestUtils.setField(gstSummaryService, "entityManager", entityManager);
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
    }

    private void mockCompanyExists(UUID companyId, boolean exists) {
        when(entityManager.createNativeQuery(contains("SELECT COUNT(1) FROM company"))).thenReturn(countQuery);
        when(countQuery.setParameter("companyId", companyId)).thenReturn(countQuery);
        when(countQuery.getSingleResult()).thenReturn(exists ? 1L : 0L);
    }

    private void mockStoredOrganization(UUID companyId, UUID storedOrgId) {
        when(entityManager.createNativeQuery(contains("SELECT c.organization_id FROM company"))).thenReturn(storedOrgQuery);
        when(storedOrgQuery.setParameter("companyId", companyId)).thenReturn(storedOrgQuery);
        when(storedOrgQuery.getResultList()).thenReturn(
                storedOrgId != null ? List.of(storedOrgId) : Collections.singletonList(null)
        );
    }

    @Test
    @DisplayName("Non-existent company throws ValidationException (COMPANY_NOT_FOUND)")
    void nonExistentCompanyThrowsValidationException() {
        mockCompanyExists(TARGET_COMPANY_ID, false);

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(gstSummaryService, "validateCompanyExists", TARGET_COMPANY_ID))
                .isInstanceOf(ValidationException.class)
                .hasMessageContaining("Company does not exist");
    }

    @Test
    @DisplayName("OWNER access with matching organizationId passes validation (does not throw ForbiddenException)")
    void ownerWithMatchingOrganizationIdPassesValidation() {
        mockCompanyExists(TARGET_COMPANY_ID, true);
        mockStoredOrganization(TARGET_COMPANY_ID, AUTHORIZED_ORG_ID);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");
        CurrentUserContext.setOrganizationId(AUTHORIZED_ORG_ID);

        // Reflection call to validateCompanyExists directly
        ReflectionTestUtils.invokeMethod(gstSummaryService, "validateCompanyExists", TARGET_COMPANY_ID);
        // No exception thrown = access granted!
    }

    @Test
    @DisplayName("OWNER access to company belonging to different organization throws ForbiddenException (403)")
    void ownerAccessingUnrelatedOrganizationCompanyThrowsForbiddenException() {
        mockCompanyExists(UNRELATED_COMPANY_ID, true);
        mockStoredOrganization(UNRELATED_COMPANY_ID, OTHER_ORG_ID); // Belongs to OTHER_ORG_ID

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");
        CurrentUserContext.setOrganizationId(AUTHORIZED_ORG_ID); // User is from AUTHORIZED_ORG_ID

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(gstSummaryService, "validateCompanyExists", UNRELATED_COMPANY_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied: Company does not belong to authorized organization");
    }

    @Test
    @DisplayName("OWNER access to company with null organization_id throws ForbiddenException (403)")
    void ownerAccessingCompanyWithNullOrganizationThrowsForbiddenException() {
        mockCompanyExists(TARGET_COMPANY_ID, true);
        mockStoredOrganization(TARGET_COMPANY_ID, null); // Stored organization_id is NULL

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("OWNER");
        CurrentUserContext.setOrganizationId(AUTHORIZED_ORG_ID);

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(gstSummaryService, "validateCompanyExists", TARGET_COMPANY_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied: Company does not belong to authorized organization");
    }

    @Test
    @DisplayName("Regular user accessing different company throws ForbiddenException (403)")
    void regularUserAccessingUnassignedCompanyThrowsForbiddenException() {
        mockCompanyExists(UNRELATED_COMPANY_ID, true);
        mockStoredOrganization(UNRELATED_COMPANY_ID, AUTHORIZED_ORG_ID);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@test.com", null, List.of(new SimpleGrantedAuthority("ROLE_ACCOUNTANT")));
        SecurityContextHolder.getContext().setAuthentication(auth);
        CurrentUserContext.setUserRole("ACCOUNTANT");
        CurrentUserContext.setCompanyId(TARGET_COMPANY_ID); // Assigned to TARGET_COMPANY_ID

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(gstSummaryService, "validateCompanyExists", UNRELATED_COMPANY_ID))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Access denied for the requested company resource");
    }
}
