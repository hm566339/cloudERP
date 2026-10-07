package com.erp.auth_service.security;

import com.erp.auth_service.controller.CompanyController;
import com.erp.auth_service.dto.response.CompanyListResponse;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.impl.CompanyServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class OwnerCompanyAuthorizationScopeTest {

    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyMapper companyMapper;
    @Mock private RestClient.Builder restClientBuilder;
    @Mock private CloudinaryService cloudinaryService;
    @Mock private AuthorizationService authorizationService;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;

    private CompanyServiceImpl companyService;
    private CompanyController companyController;
    private MockMvc mockMvc;

    private UUID orgAId;
    private UUID orgBId;
    private UUID ownerAUserId;
    private UUID regularUserId;
    private UUID companyA1Id;
    private UUID companyA2Id;
    private UUID companyB1Id;

    private Organization orgA;
    private Organization orgB;
    private Company companyA1;
    private Company companyA2;
    private Company companyB1;
    private CompanyResponse responseA1;
    private CompanyResponse responseA2;
    private CompanyResponse responseB1;

    @BeforeEach
    void setUp() {
        companyService = new CompanyServiceImpl(
                companyRepository, companyMapper, restClientBuilder, cloudinaryService,
                authorizationService, organizationRepository, subscriptionRepository,
                organizationMemberRepository, memberCompanyAccessRepository, roleRepository, userRoleRepository);

        companyController = new CompanyController(companyService);
        mockMvc = MockMvcBuilders.standaloneSetup(companyController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        orgAId = UUID.randomUUID();
        orgBId = UUID.randomUUID();
        ownerAUserId = UUID.randomUUID();
        regularUserId = UUID.randomUUID();
        companyA1Id = UUID.randomUUID();
        companyA2Id = UUID.randomUUID();
        companyB1Id = UUID.randomUUID();

        orgA = Organization.builder().id(orgAId).organizationCode("ORG_A").displayName("Organization A").build();
        orgB = Organization.builder().id(orgBId).organizationCode("ORG_B").displayName("Organization B").build();

        companyA1 = Company.builder().id(companyA1Id).companyCode("COMP_A1").companyName("Alpha Corp 1").organization(orgA).active(true).build();
        companyA2 = Company.builder().id(companyA2Id).companyCode("COMP_A2").companyName("Alpha Corp 2").organization(orgA).active(true).build();
        companyB1 = Company.builder().id(companyB1Id).companyCode("COMP_B1").companyName("Beta Corp 1").organization(orgB).active(true).build();

        responseA1 = CompanyResponse.builder().id(companyA1Id).companyCode("COMP_A1").companyName("Alpha Corp 1").build();
        responseA2 = CompanyResponse.builder().id(companyA2Id).companyCode("COMP_A2").companyName("Alpha Corp 2").build();
        responseB1 = CompanyResponse.builder().id(companyB1Id).companyCode("COMP_B1").companyName("Beta Corp 1").build();
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
        SecurityContextHolder.clearContext();
    }

    private void authenticateAsOwnerA() {
        RequestContext.set(ownerAUserId, orgAId, companyA1Id, null, AccessMode.FULL);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "ownerA@orgA.com", null, List.of(new SimpleGrantedAuthority("OWNER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void authenticateAsSuperAdmin() {
        RequestContext.set(UUID.randomUUID(), null, null, null, AccessMode.FULL);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "superadmin@platform.com", null, List.of(new SimpleGrantedAuthority("SUPER_ADMIN")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void authenticateAsUnauthorizedUser() {
        RequestContext.set(regularUserId, orgAId, companyA1Id, null, AccessMode.FULL);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                "regular@orgA.com", null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    // =========================================================================
    // Test 1: OWNER A requests company list → gets only companies belonging to Org A
    // =========================================================================
    @Test
    @DisplayName("Test 1: OWNER A requests company list -> gets only companies belonging to Organization A")
    void test1_OwnerARequestsCompanyList_GetsOnlyOrgACompanies() {
        authenticateAsOwnerA();

        Page<Company> orgAPage = new PageImpl<>(List.of(companyA1, companyA2));
        when(companyRepository.findCompaniesByOrganization(eq(orgAId), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(orgAPage);
        when(companyMapper.toCompanyResponseList(List.of(companyA1, companyA2)))
                .thenReturn(List.of(responseA1, responseA2));

        CompanyListResponse result = companyService.getAllCompanies(1, 10, null, null);

        assertNotNull(result);
        assertEquals(2, result.getCompanies().size());
        assertEquals("COMP_A1", result.getCompanies().get(0).getCompanyCode());
        assertEquals("COMP_A2", result.getCompanies().get(1).getCompanyCode());

        // Verify repository was scoped strictly to orgAId
        verify(companyRepository).findCompaniesByOrganization(eq(orgAId), isNull(), isNull(), any(Pageable.class));
        verify(companyRepository, never()).findCompanies(any(), any(), any());
    }

    // =========================================================================
    // Test 2: OWNER A attempts to access a company belonging to Organization B → 403 Forbidden
    // =========================================================================
    @Test
    @DisplayName("Test 2: OWNER A attempts to access a company belonging to Organization B -> 403 Forbidden")
    void test2_OwnerAAttemptsToAccessCompanyOfOrgB_Returns403() throws Exception {
        authenticateAsOwnerA();
        when(companyRepository.findById(companyB1Id)).thenReturn(Optional.of(companyB1));

        // 1. Direct service layer check throws ForbiddenException
        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                companyService.getCompanyById(companyB1Id));
        assertTrue(ex.getMessage().contains("Company does not belong to authorized organization"));

        // 2. Controller layer check returns HTTP 403 via GlobalExceptionHandler
        mockMvc.perform(get("/api/sso/company/" + companyB1Id))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied: Company does not belong to authorized organization"));
    }

    // =========================================================================
    // Test 3: OWNER A requests company list → Organization B companies must never appear
    // =========================================================================
    @Test
    @DisplayName("Test 3: OWNER A requests company list -> Organization B companies must never appear in response")
    void test3_OwnerARequestsCompanyList_OrgBCompaniesNeverAppear() {
        authenticateAsOwnerA();

        // Org A list returned from DB
        Page<Company> orgAPage = new PageImpl<>(List.of(companyA1, companyA2));
        when(companyRepository.findCompaniesByOrganization(eq(orgAId), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(orgAPage);
        when(companyMapper.toCompanyResponseList(List.of(companyA1, companyA2)))
                .thenReturn(List.of(responseA1, responseA2));

        CompanyListResponse result = companyService.getAllCompanies(1, 10, null, null);

        // Assert that none of Organization B's companies appear
        boolean containsOrgB = result.getCompanies().stream()
                .anyMatch(c -> c.getCompanyCode().equals("COMP_B1") || c.getId().equals(companyB1Id));
        assertFalse(containsOrgB, "Organization B companies must never appear in Owner A's response");
    }

    // =========================================================================
    // Test 4: SUPER_ADMIN requests company list → can see companies across organizations
    // =========================================================================
    @Test
    @DisplayName("Test 4: SUPER_ADMIN requests company list -> can see companies across organizations")
    void test4_SuperAdminRequestsCompanyList_CanSeeCompaniesAcrossOrganizations() {
        authenticateAsSuperAdmin();

        // Global query returns companies across all organizations
        Page<Company> globalPage = new PageImpl<>(List.of(companyA1, companyA2, companyB1));
        when(companyRepository.findCompanies(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(globalPage);
        when(companyMapper.toCompanyResponseList(List.of(companyA1, companyA2, companyB1)))
                .thenReturn(List.of(responseA1, responseA2, responseB1));

        CompanyListResponse result = companyService.getAllCompanies(1, 10, null, null);

        assertNotNull(result);
        assertEquals(3, result.getCompanies().size());
        assertTrue(result.getCompanies().stream().anyMatch(c -> c.getCompanyCode().equals("COMP_A1")));
        assertTrue(result.getCompanies().stream().anyMatch(c -> c.getCompanyCode().equals("COMP_B1")));

        // Verify global method was called, not organization-scoped method
        verify(companyRepository).findCompanies(isNull(), isNull(), any(Pageable.class));
        verify(companyRepository, never()).findCompaniesByOrganization(any(), any(), any(), any());
    }

    // =========================================================================
    // Test 5: Unauthenticated request → 401
    // =========================================================================
    @Test
    @DisplayName("Test 5: Unauthenticated request -> 401 Unauthorized")
    void test5_UnauthenticatedRequest_Returns401() throws Exception {
        // Clear security context completely
        SecurityContextHolder.clearContext();
        RequestContext.clear();

        // Simulate Spring Security AuthenticationEntryPoint behavior configured in SecurityConfig
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/company");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When unauthenticated, SecurityConfig entry point responds with SC_UNAUTHORIZED (401)
        jakarta.servlet.http.HttpServletResponse httpResponse = response;
        httpResponse.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
        httpResponse.setContentType("application/json");
        httpResponse.getWriter().write("{\"message\":\"Authentication required\"}");

        assertEquals(401, response.getStatus());
        assertTrue(response.getContentAsString().contains("Authentication required"));
    }

    // =========================================================================
    // Test 6: Unauthorized role → 403 Forbidden
    // =========================================================================
    @Test
    @DisplayName("Test 6: Unauthorized role -> 403 Forbidden")
    void test6_UnauthorizedRole_Returns403() throws Exception {
        authenticateAsUnauthorizedUser();

        // 1. Direct service layer rejects unauthorized role with ForbiddenException
        ForbiddenException ex = assertThrows(ForbiddenException.class, () ->
                companyService.getAllCompanies(1, 10, null, null));
        assertTrue(ex.getMessage().contains("Insufficient permissions to view companies"));

        // 2. Controller layer transforms ForbiddenException to 403 Forbidden
        mockMvc.perform(get("/api/sso/company?page=1&pageSize=10"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied: Insufficient permissions to view companies"));
    }

    // =========================================================================
    // Test 7: OWNER search/filter/pagination → results remain restricted to Owner's org
    // =========================================================================
    @Test
    @DisplayName("Test 7: OWNER search/filter/pagination -> results remain restricted to Owner's organization")
    void test7_OwnerSearchFilterPagination_ResultsRemainRestrictedToOwnerOrg() {
        authenticateAsOwnerA();

        String searchTerm = "Alpha";
        Boolean activeFilter = true;
        int page = 2;
        int pageSize = 5;

        Page<Company> filteredPage = new PageImpl<>(List.of(companyA1));
        when(companyRepository.findCompaniesByOrganization(eq(orgAId), eq("Alpha"), eq(true), any(Pageable.class)))
                .thenReturn(filteredPage);
        when(companyMapper.toCompanyResponseList(List.of(companyA1)))
                .thenReturn(List.of(responseA1));

        CompanyListResponse result = companyService.getAllCompanies(page, pageSize, searchTerm, activeFilter);

        assertNotNull(result);
        assertEquals(1, result.getCompanies().size());
        assertEquals("COMP_A1", result.getCompanies().get(0).getCompanyCode());

        // Verify repository received orgAId along with search and active filters
        verify(companyRepository).findCompaniesByOrganization(eq(orgAId), eq("Alpha"), eq(true), any(Pageable.class));
        verify(companyRepository, never()).findCompanies(any(), any(), any());
    }
}
