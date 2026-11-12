package com.erp.auth_service.security;

import com.erp.auth_service.controller.CompanyController;
import com.erp.auth_service.dto.response.CompanyResponse;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.mapper.CompanyMapper;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Organization;
import com.erp.auth_service.model.OrganizationMember;
import com.erp.auth_service.model.User;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.authorization.AuthorizationDecision;
import com.erp.auth_service.security.authorization.AuthorizationProperties;
import com.erp.auth_service.security.authorization.SsoAuthorizationService;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import com.erp.auth_service.service.AuthorizationService;
import com.erp.auth_service.service.CloudinaryService;
import com.erp.auth_service.service.PermissionService;
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
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class CompanyVerifySecurityRegressionTest {

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
    @Mock private PermissionService permissionService;
    @Mock private FeaturePermissionRepository featurePermissionRepository;

    private SsoAuthorizationService ssoAuthorizationService;
    private YamlAuthorizationFilter yamlAuthorizationFilter;
    private CompanyServiceImpl companyService;
    private MockMvc mockMvc;

    private UUID orgAId;
    private UUID orgBId;
    private UUID accountantUserId;
    private UUID managerUserId;
    private UUID ownerUserId;
    private UUID accountantMemberId;
    private UUID managerMemberId;
    private UUID ownerMemberId;
    private UUID activeCompanyAId;
    private UUID unassignedCompanyAId;
    private UUID inactiveCompanyAId;
    private UUID foreignCompanyBId;

    private Organization orgA;
    private Organization orgB;
    private Company activeCompanyA;
    private Company unassignedCompanyA;
    private Company inactiveCompanyA;
    private Company foreignCompanyB;

    @BeforeEach
    void setUp() {
        AuthorizationProperties properties = new AuthorizationProperties();
        Map<String, List<String>> modules = new LinkedHashMap<>();
        modules.put("AUTH", List.of("/api/sso/auth/**", "/api/sso/token/**"));
        modules.put("COMPANY", List.of("/api/sso/company/**", "/api/sso/company"));
        properties.setModules(modules);
        properties.setMethodActions(Map.of(
                "GET", List.of("READ"),
                "POST", List.of("CREATE", "WRITE")
        ));
        properties.setCustomActionSuffixes(Map.of("/verify", "UPDATE"));
        properties.setWriteImpliesCreateUpdate(false);
        properties.validate();

        ssoAuthorizationService = new SsoAuthorizationService(
                properties, permissionService, featurePermissionRepository);
        yamlAuthorizationFilter = new YamlAuthorizationFilter(ssoAuthorizationService);

        companyService = new CompanyServiceImpl(
                companyRepository, companyMapper, restClientBuilder, cloudinaryService,
                authorizationService, organizationRepository, subscriptionRepository,
                organizationMemberRepository, memberCompanyAccessRepository, roleRepository, userRoleRepository);

        mockMvc = MockMvcBuilders.standaloneSetup(new CompanyController(companyService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        orgAId = UUID.randomUUID();
        orgBId = UUID.randomUUID();
        accountantUserId = UUID.randomUUID();
        managerUserId = UUID.randomUUID();
        ownerUserId = UUID.randomUUID();
        accountantMemberId = UUID.randomUUID();
        managerMemberId = UUID.randomUUID();
        ownerMemberId = UUID.randomUUID();
        activeCompanyAId = UUID.randomUUID();
        unassignedCompanyAId = UUID.randomUUID();
        inactiveCompanyAId = UUID.randomUUID();
        foreignCompanyBId = UUID.randomUUID();

        orgA = Organization.builder().id(orgAId).organizationCode("ORG_A").displayName("Org A").build();
        orgB = Organization.builder().id(orgBId).organizationCode("ORG_B").displayName("Org B").build();

        activeCompanyA = Company.builder()
                .id(activeCompanyAId).companyCode("COMP_A").companyName("Apex India").organization(orgA).active(true).build();
        unassignedCompanyA = Company.builder()
                .id(unassignedCompanyAId).companyCode("COMP_A2").companyName("TechNova").organization(orgA).active(true).build();
        inactiveCompanyA = Company.builder()
                .id(inactiveCompanyAId).companyCode("COMP_INACTIVE").companyName("Old Co").organization(orgA).active(false).build();
        foreignCompanyB = Company.builder()
                .id(foreignCompanyBId).companyCode("COMP_B").companyName("Beta Corp").organization(orgB).active(true).build();

        lenient().when(companyRepository.findByCompanyCode("COMP_A")).thenReturn(Optional.of(activeCompanyA));
        lenient().when(companyRepository.findByCompanyCode("COMP_A2")).thenReturn(Optional.of(unassignedCompanyA));
        lenient().when(companyRepository.findByCompanyCode("COMP_INACTIVE")).thenReturn(Optional.of(inactiveCompanyA));
        lenient().when(companyRepository.findByCompanyCode("COMP_B")).thenReturn(Optional.of(foreignCompanyB));

        lenient().when(companyMapper.toCompanyResponse(activeCompanyA)).thenReturn(
                CompanyResponse.builder().id(activeCompanyAId).companyCode("COMP_A").companyName("Apex India")
                        .organizationId(orgAId).active(true).build());
    }

    @AfterEach
    void tearDown() {
        RequestContext.clear();
        SecurityContextHolder.clearContext();
    }

    private Authentication authWithNoCompanyReadPermission(UUID userId, String email, String roleName) {
        User user = new User();
        user.setId(userId);
        user.setEmail(email);
        user.setUserRoles(Collections.emptyList());
        CustomUserDetails details = new CustomUserDetails(user);

        EffectivePermissionsResponse emptyCompanyPerms = EffectivePermissionsResponse.builder()
                .userId(userId)
                .permissions(Collections.emptyList())
                .build();
        lenient().when(permissionService.getEffectivePermissions(userId)).thenReturn(emptyCompanyPerms);
        lenient().when(permissionService.getEffectivePermissions(any(), any())).thenReturn(emptyCompanyPerms);

        return new UsernamePasswordAuthenticationToken(
                details, null, List.of(new SimpleGrantedAuthority("ROLE_" + roleName)));
    }

    private void stubActiveMember(UUID orgId, UUID userId, UUID memberId, MemberType type) {
        OrganizationMember member = OrganizationMember.builder()
                .id(memberId)
                .organization(orgA)
                .memberType(type)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(orgId, userId))
                .thenReturn(Optional.of(member));
    }

    @Test
    @DisplayName("Authorized Accountant without COMPANY:READ is allowed on GET /api/sso/company/company-verify (200)")
    void accountantCanVerifyAuthorizedCompany() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(accountantUserId, "acc@orga.com", "ACCOUNTANT");
        MockHttpServletRequest authReq = new MockHttpServletRequest("GET", "/api/sso/company/company-verify");

        AuthorizationDecision decision = ssoAuthorizationService.authorize(auth, authReq);
        assertTrue(decision.isAllowed());
        assertEquals("COMPANY_VERIFY_AUTHENTICATED", decision.getReason());

        // Other COMPANY endpoints remain protected by COMPANY:READ
        AuthorizationDecision otherCompanyReq = ssoAuthorizationService.authorize(
                auth, new MockHttpServletRequest("GET", "/api/sso/company/" + activeCompanyAId));
        assertFalse(otherCompanyReq.isAllowed());

        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(accountantUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);
        stubActiveMember(orgAId, accountantUserId, accountantMemberId, MemberType.MEMBER);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                accountantMemberId, activeCompanyAId)).thenReturn(true);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.companyCode").value("COMP_A"));
    }

    @Test
    @DisplayName("Authorized Manager without COMPANY:READ is allowed on GET /api/sso/company/company-verify (200)")
    void managerCanVerifyAuthorizedCompany() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(managerUserId, "mgr@orga.com", "MANAGER");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(
                auth, new MockHttpServletRequest("GET", "/api/sso/company/company-verify"));
        assertTrue(decision.isAllowed());

        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(managerUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);
        stubActiveMember(orgAId, managerUserId, managerMemberId, MemberType.MEMBER);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                managerMemberId, activeCompanyAId)).thenReturn(true);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.companyCode").value("COMP_A"));
    }

    @Test
    @DisplayName("Org member without active MemberCompanyAccess to target company is rejected with 403")
    void memberWithoutCompanyAccessIsRejectedWith403() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(accountantUserId, "acc@orga.com", "ACCOUNTANT");
        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(accountantUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);
        stubActiveMember(orgAId, accountantUserId, accountantMemberId, MemberType.MEMBER);
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                accountantMemberId, unassignedCompanyAId)).thenReturn(false);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_A2"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User trying to verify company in another organization is rejected with 403")
    void crossOrganizationCompanyVerifyIsRejectedWith403() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(accountantUserId, "acc@orga.com", "ACCOUNTANT");
        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(accountantUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_B"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Inactive company is rejected on /company-verify with 403")
    void inactiveCompanyVerifyIsRejectedWith403() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(ownerUserId, "owner@orga.com", "OWNER");
        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(ownerUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_INACTIVE"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Organization OWNER without explicit COMPANY:READ permission can verify active org company (200)")
    void orgOwnerCanVerifyActiveOrgCompany() throws Exception {
        Authentication auth = authWithNoCompanyReadPermission(ownerUserId, "owner@orga.com", "OWNER");
        SecurityContextHolder.getContext().setAuthentication(auth);
        RequestContext.set(ownerUserId, orgAId, activeCompanyAId, null, AccessMode.FULL);
        stubActiveMember(orgAId, ownerUserId, ownerMemberId, MemberType.OWNER);

        mockMvc.perform(get("/api/sso/company/company-verify").param("companyCode", "COMP_A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.companyCode").value("COMP_A"));
    }

    @Test
    @DisplayName("Unauthenticated or anonymous request to /api/sso/company/company-verify is denied by authorization layer")
    void unauthenticatedCompanyVerifyIsDenied() {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/sso/company/company-verify");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(null, req);
        assertFalse(decision.isAllowed());
        assertEquals("AUTHENTICATION_REQUIRED", decision.getReason());
    }
}
