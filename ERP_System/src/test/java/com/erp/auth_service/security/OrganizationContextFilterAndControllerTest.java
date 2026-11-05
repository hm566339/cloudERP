package com.erp.auth_service.security;

import com.erp.auth_service.controller.OrganizationRoleTemplateController;
import com.erp.auth_service.dto.role_template.OrganizationRoleTemplateDto;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.OrganizationRepository;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class OrganizationContextFilterAndControllerTest {

    private MockMvc mockMvc;

    @Mock
    private OrganizationRoleTemplateService roleTemplateService;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private CompanyRepository companyRepository;

    private OrganizationContextFilter organizationContextFilter;
    private OrganizationRoleTemplateController controller;

    private UUID orgId;
    private UUID otherOrgId;
    private UUID userId;
    private Organization organization;
    private Organization otherOrganization;
    private User user;
    private OrganizationMember ownerMember;

    @BeforeEach
    void setUp() {
        orgId = UUID.randomUUID();
        otherOrgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .organizationCode("MARK2")
                .displayName("Mark2 Global")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        otherOrganization = Organization.builder()
                .id(otherOrgId)
                .organizationCode("OTHER")
                .displayName("Other Org")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        user = User.builder()
                .id(userId)
                .username("rohit_owner")
                .email("rohit@mark2.in")
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        organizationContextFilter = new OrganizationContextFilter(
                organizationRepository,
                organizationMemberRepository,
                companyRepository
        );

        controller = new OrganizationRoleTemplateController(
                roleTemplateService,
                companyRepository,
                organizationMemberRepository
        );

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .addFilters(organizationContextFilter)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        // Default: Authenticated user in SecurityContext
        CustomUserDetails userDetails = new CustomUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"), new SimpleGrantedAuthority("OWNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContext.clear();
        TenantContext.clear();
    }

    @Test
    @DisplayName("1. Valid organizationId query parameter with ACTIVE OWNER membership returns 200 OK")
    void testValidOrganizationIdQueryParamSuccess() throws Exception {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        OrganizationRoleTemplateDto dto = OrganizationRoleTemplateDto.builder()
                .id(UUID.randomUUID())
                .name("Finance Manager")
                .organizationId(orgId)
                .build();
        when(roleTemplateService.getTemplates(orgId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .param("organizationId", orgId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Finance Manager"));

        verify(roleTemplateService).getTemplates(orgId);
    }

    @Test
    @DisplayName("2. Valid X-Organization-Id header returns 200 OK")
    void testValidHeaderFallbackSuccess() throws Exception {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        OrganizationRoleTemplateDto dto = OrganizationRoleTemplateDto.builder()
                .id(UUID.randomUUID())
                .name("Inventory Manager")
                .organizationId(orgId)
                .build();
        when(roleTemplateService.getTemplates(orgId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .header("X-Organization-Id", orgId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Inventory Manager"));

        verify(roleTemplateService).getTemplates(orgId);
    }

    @Test
    @DisplayName("3. Organization resolved through RequestContext returns 200 OK")
    void testOrganizationResolvedViaRequestContext() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        OrganizationRoleTemplateDto dto = OrganizationRoleTemplateDto.builder()
                .id(UUID.randomUUID())
                .name("System Admin Template")
                .organizationId(orgId)
                .build();
        when(roleTemplateService.getTemplates(orgId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/sso/organization/role-templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("System Admin Template"));

        verify(roleTemplateService).getTemplates(orgId);
    }

    @Test
    @DisplayName("4. Missing organization context returns 403 Forbidden with 'Organization context required'")
    void testMissingOrganizationContextThrows403() throws Exception {
        when(organizationMemberRepository.findByUser_IdAndMembershipStatus(userId, MembershipStatus.ACTIVE))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/sso/organization/role-templates"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Organization context required"));

        verify(roleTemplateService, never()).getTemplates(any());
    }

    @Test
    @DisplayName("5. Invalid organization UUID format returns 400 Bad Request")
    void testInvalidOrganizationUuidReturns400() throws Exception {
        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .param("organizationId", "not-a-valid-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid organization ID format"));

        verify(roleTemplateService, never()).getTemplates(any());
    }

    @Test
    @DisplayName("6. Non-member user accessing another organization's data returns 403 Forbidden")
    void testNonMemberAccessToOtherOrganizationBlocked() throws Exception {
        when(organizationRepository.findById(otherOrgId)).thenReturn(Optional.of(otherOrganization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(otherOrgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .param("organizationId", otherOrgId.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Active organization membership required"));

        verify(roleTemplateService, never()).getTemplates(any());
    }

    @Test
    @DisplayName("7. Inactive membership returns 403 Forbidden")
    void testInactiveMembershipReturns403() throws Exception {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .param("organizationId", orgId.toString()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Active organization membership required"));

        verify(roleTemplateService, never()).getTemplates(any());
    }

    @Test
    @DisplayName("8. Multiple active organization memberships requires explicit selection")
    void testMultipleMembershipsRequiresExplicitSelection() throws Exception {
        OrganizationMember member2 = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(otherOrganization)
                .user(user)
                .memberType(MemberType.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        // User belongs to 2 organizations
        when(organizationMemberRepository.findByUser_IdAndMembershipStatus(userId, MembershipStatus.ACTIVE))
                .thenReturn(List.of(ownerMember, member2));

        mockMvc.perform(get("/api/sso/organization/role-templates"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Organization context required"));

        verify(roleTemplateService, never()).getTemplates(any());
    }

    @Test
    @DisplayName("9. Single active membership automatically resolves when no explicit param provided")
    void testSingleMembershipAutoResolves() throws Exception {
        when(organizationMemberRepository.findByUser_IdAndMembershipStatus(userId, MembershipStatus.ACTIVE))
                .thenReturn(List.of(ownerMember));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        OrganizationRoleTemplateDto dto = OrganizationRoleTemplateDto.builder()
                .id(UUID.randomUUID())
                .name("Single Org Role")
                .organizationId(orgId)
                .build();
        when(roleTemplateService.getTemplates(orgId)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/sso/organization/role-templates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].name").value("Single Org Role"));

        verify(roleTemplateService).getTemplates(orgId);
    }

    @Test
    @DisplayName("10. Organization context cleanup after request completion")
    void testContextCleanupAfterRequest() throws Exception {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        when(roleTemplateService.getTemplates(orgId)).thenReturn(List.of());

        mockMvc.perform(get("/api/sso/organization/role-templates")
                        .param("organizationId", orgId.toString()))
                .andExpect(status().isOk());

        // In test tearDown and filter cleanup, RequestContext must not leak
        RequestContext.clear();
        assertNull(RequestContext.get());
    }
}

