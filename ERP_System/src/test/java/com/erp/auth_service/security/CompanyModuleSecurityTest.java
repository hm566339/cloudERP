package com.erp.auth_service.security;

import com.erp.auth_service.dto.request.CompanyModuleRequest;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.CompanyModuleRepository;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.ModuleRepository;
import com.erp.auth_service.service.impl.CompanyModuleServiceImpl;
import com.erp.auth_service.utility.AccessMode;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
public class CompanyModuleSecurityTest {

    @Mock
    private CompanyModuleRepository companyModuleRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private com.erp.auth_service.service.AuthorizationService authorizationService;

    @InjectMocks
    private CompanyModuleServiceImpl companyModuleService;

    private UUID companyAId;
    private UUID companyBId;
    private UUID moduleId;
    private UUID userAId;

    @BeforeEach
    void setUp() {
        companyAId = UUID.randomUUID();
        companyBId = UUID.randomUUID();
        moduleId = UUID.randomUUID();
        userAId = UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Tenant user from Company A cannot configure modules for Company B")
    void testTenantCannotAssignModuleToOtherCompany() {
        RequestContext.set(userAId, null, companyAId, null, AccessMode.FULL);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "user@companyA.com", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        Company companyB = new Company();
        companyB.setId(companyBId);

        when(companyRepository.findById(companyBId)).thenReturn(Optional.of(companyB));

        CompanyModuleRequest request = new CompanyModuleRequest();
        request.setCompany(companyBId);
        request.setModule(moduleId);

        ForbiddenException exception = assertThrows(ForbiddenException.class, () ->
                companyModuleService.createCompanyModule(request));

        assertTrue(exception.getMessage().contains("Access denied: Company does not match authorized company context"));
    }

    @Test
    @DisplayName("SYSTEM_ADMIN can configure modules for any company without company context restriction")
    void testSystemAdminCanAssignModuleToAnyCompany() {
        // System admin context (even if company context is set to admin company or root company)
        RequestContext.set(userAId, null, companyAId, null, AccessMode.FULL);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "System001", null, List.of(new SimpleGrantedAuthority("SYSTEM_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        Company companyB = new Company();
        companyB.setId(companyBId);
        com.erp.auth_service.model.Organization org = new com.erp.auth_service.model.Organization();
        org.setId(UUID.randomUUID());
        companyB.setOrganization(org);

        Module module = new Module();
        module.setId(moduleId);

        when(companyRepository.findById(companyBId)).thenReturn(Optional.of(companyB));
        when(companyModuleRepository.existsByCompany_IdAndModule_Id(companyBId, moduleId)).thenReturn(false);
        when(moduleRepository.findById(moduleId)).thenReturn(Optional.of(module));

        CompanyModuleRequest request = new CompanyModuleRequest();
        request.setCompany(companyBId);
        request.setModule(moduleId);

        Map<String, String> result = companyModuleService.createCompanyModule(request);

        assertNotNull(result);
        assertEquals("Company Module created successfully", result.get("message"));
        verify(companyModuleRepository).save(any());
    }

    @Test
    @DisplayName("Organization Owner can access company modules for another company in the same organization")
    void testOrganizationOwnerCanAccessModulesForOtherCompanyInSameOrg() {
        UUID orgId = UUID.randomUUID();
        RequestContext.set(userAId, orgId, companyAId, null, AccessMode.FULL);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "owner@org.com", null, List.of(new SimpleGrantedAuthority("OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);

        Company companyB = new Company();
        companyB.setId(companyBId);
        com.erp.auth_service.model.Organization org = new com.erp.auth_service.model.Organization();
        org.setId(orgId);
        companyB.setOrganization(org);

        when(companyRepository.findById(companyBId)).thenReturn(Optional.of(companyB));
        when(companyModuleRepository.findAllByCompany_Id(companyBId)).thenReturn(List.of());

        List<com.erp.auth_service.dto.response.CompanyModulesResposnse> response =
                companyModuleService.getCompanyModulesByCompany(companyBId, null);

        assertNotNull(response);
        verify(companyModuleRepository).findAllByCompany_Id(companyBId);
    }
}
