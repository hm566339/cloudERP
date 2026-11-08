package com.erp.auth_service.security;

import com.erp.auth_service.config.FeatureBootstrap;
import com.erp.auth_service.controller.OrganizationAppearanceController;
import com.erp.auth_service.controller.OrganizationPermissionController;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.dto.role_template.PermissionCatalogDto;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.authorization.AuthorizationDecision;
import com.erp.auth_service.security.authorization.AuthorizationProperties;
import com.erp.auth_service.security.authorization.SsoAuthorizationService;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.service.impl.PermissionServiceImpl;
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
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class OrganizationAppearanceAndPermissionCatalogRbacTest {

    @Mock
    private OrganizationAppearanceService appearanceService;

    @Mock
    private OrganizationRoleTemplateService roleTemplateService;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMemberRepository organizationMemberRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private FeaturePermissionRepository featurePermissionRepository;

    @Mock
    private FeatureRepository featureRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private UserPermissionRepository userPermissionRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private CompanyModuleRepository companyModuleRepository;

    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;

    @Mock
    private CompanySubscriptionRepository companySubscriptionRepository;

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    private AuthorizationProperties authorizationProperties;
    private SsoAuthorizationService ssoAuthorizationService;
    private OrganizationContextFilter organizationContextFilter;
    private YamlAuthorizationFilter yamlAuthorizationFilter;

    private OrganizationAppearanceController appearanceController;
    private OrganizationPermissionController permissionController;

    private MockMvc appearanceMockMvc;
    private MockMvc permissionMockMvc;

    private UUID orgId;
    private UUID otherOrgId;
    private UUID userId;
    private Organization organization;
    private Organization otherOrganization;
    private User user;
    private OrganizationMember activeOwnerMember;
    private Authentication userAuth;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        RequestContext.clear();

        orgId = UUID.randomUUID();
        otherOrgId = UUID.randomUUID();
        userId = UUID.randomUUID();

        organization = Organization.builder()
                .id(orgId)
                .organizationCode("APEX")
                .displayName("Apex Global Enterprises")
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
                .email("rohit@apex.com")
                .userRoles(new ArrayList<>())
                .build();

        activeOwnerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        CustomUserDetails cud = new CustomUserDetails(user);
        userAuth = new UsernamePasswordAuthenticationToken(cud, null, cud.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(userAuth);

        // Configure Authorization Properties
        authorizationProperties = new AuthorizationProperties();
        Map<String, List<String>> modules = new LinkedHashMap<>();
        modules.put("ORGANIZATION_ROLE_TEMPLATES", List.of("/api/sso/organization/role-templates/**", "/api/organization/role-templates/**"));
        modules.put("ORGANIZATION_MEMBERS", List.of("/api/sso/organization/members/**", "/api/organization/members/**"));
        modules.put("ORGANIZATION_PERMISSIONS", List.of("/api/sso/organization/permissions/**", "/api/organization/permissions/**"));
        modules.put("ORGANIZATION_APPEARANCE", List.of("/api/sso/organization/appearance/**", "/api/organization/appearance/**"));
        modules.put("ORGANIZATION_TAX", List.of("/api/sso/organization/tax/**", "/api/sso/tax/**"));
        modules.put("ORGANIZATION", List.of("/api/sso/organization/**", "/api/organization/**", "/api/settings/**", "/api/sso/settings/**"));
        modules.put("PERMISSION", List.of("/api/sso/permissions/**"));
        modules.put("PLATFORM_ADMIN", List.of("/api/sso/platform/**", "/api/sso/admin/**", "/api/admin/**"));
        modules.put("BILLING", List.of("/api/billing/**", "/api/sso/billing/**"));
        authorizationProperties.setModules(modules);

        Map<String, String> customSuffixes = new LinkedHashMap<>();
        customSuffixes.put("/export", "EXPORT");
        customSuffixes.put("/purge", "PURGE");
        authorizationProperties.setCustomActionSuffixes(customSuffixes);

        Map<String, List<String>> methodActions = new LinkedHashMap<>();
        methodActions.put("GET", List.of("READ"));
        methodActions.put("POST", List.of("CREATE", "WRITE"));
        methodActions.put("PUT", List.of("UPDATE", "WRITE"));
        methodActions.put("DELETE", List.of("DELETE"));
        authorizationProperties.setMethodActions(methodActions);
        authorizationProperties.validate();

        ssoAuthorizationService = new SsoAuthorizationService(
                authorizationProperties,
                permissionService,
                featurePermissionRepository,
                organizationMemberRepository
        );

        organizationContextFilter = new OrganizationContextFilter(
                organizationRepository,
                organizationMemberRepository,
                companyRepository
        );

        yamlAuthorizationFilter = new YamlAuthorizationFilter(ssoAuthorizationService);

        appearanceController = new OrganizationAppearanceController(
                appearanceService,
                companyRepository,
                organizationMemberRepository
        );

        permissionController = new OrganizationPermissionController(
                roleTemplateService,
                companyRepository,
                organizationMemberRepository
        );

        lenient().when(featurePermissionRepository.findByPermissionCodeIgnoreCase(any()))
                .thenAnswer(inv -> {
                    String code = inv.getArgument(0);
                    if (code != null && PermissionServiceImpl.EXPLICIT_ORG_OWNER_PERMISSIONS.contains(code.toUpperCase(Locale.ROOT))) {
                        String[] parts = code.split(":");
                        String feat = parts[0];
                        String act = parts.length > 1 ? parts[1] : "READ";
                        return Optional.of(FeaturePermission.builder()
                                .permissionCode(code)
                                .action(act)
                                .active(true)
                                .feature(Feature.builder().code(feat).moduleName("CORE").active(true).build())
                                .build());
                    }
                    return Optional.empty();
                });

        appearanceMockMvc = MockMvcBuilders.standaloneSetup(appearanceController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        permissionMockMvc = MockMvcBuilders.standaloneSetup(permissionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContext.clear();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 1: Active Organization OWNER can GET organization appearance
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("1. Active Organization OWNER can GET organization appearance when authorized")
    void scenario01_activeOrganizationOwner_canGetOrganizationAppearance_whenAuthorized() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                .organizationId(orgId)
                .organizationCode("APEX")
                .activeTheme("ocean")
                .appearanceMode("light")
                .layoutDensity("comfortable")
                .build();
        when(appearanceService.getAppearance(orgId)).thenReturn(mockResponse);

        appearanceMockMvc.perform(get("/api/sso/organization/appearance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()))
                .andExpect(jsonPath("$.data.organizationCode").value("APEX"))
                .andExpect(jsonPath("$.data.activeTheme").value("ocean"));

        // Also verify SsoAuthorizationService directly evaluates Organization OWNER access
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "Active Organization OWNER must be allowed");
        assertEquals("ORG_OWNER_PERMISSION", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 2: Active Organization OWNER can GET permission catalog
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("2. Active Organization OWNER can GET permission catalog when authorized")
    void scenario02_activeOrganizationOwner_canGetPermissionCatalog_whenAuthorized() throws Exception {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        PermissionCatalogDto catalogDto = PermissionCatalogDto.builder()
                .modules(List.of(
                        com.erp.auth_service.dto.role_template.ModulePermissionGroupDto.builder()
                                .moduleName("CORE")
                                .features(List.of())
                                .build()
                ))
                .build();
        when(roleTemplateService.getPermissionCatalog(orgId)).thenReturn(catalogDto);

        permissionMockMvc.perform(get("/api/sso/organization/permissions/catalog?organizationId=" + orgId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.modules[0].moduleName").value("CORE"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/permissions/catalog");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "Active Organization OWNER must be allowed catalog access");
        assertEquals("ORG_OWNER_PERMISSION", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 3: Existing ORGANIZATION:READ permission resolves correctly
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("3. Existing ORGANIZATION:READ permission resolves correctly")
    void scenario03_existingOrganizationReadPermission_resolvesCorrectly() {
        // User is regular member (not owner) but has ORGANIZATION:READ permission
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        // Effective permissions include ORGANIZATION:READ
        UserPermissionDetailDto permDto = UserPermissionDetailDto.builder()
                .permissionCode("ORGANIZATION:READ")
                .allowed(true)
                .active(true)
                .build();
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder()
                        .userId(userId)
                        .permissions(List.of(permDto))
                        .build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "User with ORGANIZATION:READ should be authorized for appearance");
        assertEquals("DB_PERMISSION", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 4: Existing PERMISSION:READ permission resolves correctly
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("4. Existing PERMISSION:READ permission resolves correctly")
    void scenario04_existingPermissionReadPermission_resolvesCorrectly() {
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        UserPermissionDetailDto permDto = UserPermissionDetailDto.builder()
                .permissionCode("PERMISSION:READ")
                .allowed(true)
                .active(true)
                .build();
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder()
                        .userId(userId)
                        .permissions(List.of(permDto))
                        .build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/permissions/catalog");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "User with PERMISSION:READ should be authorized for permission catalog");
        assertEquals("DB_PERMISSION", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 5: Missing required permission returns 403 PERMISSION_DENIED
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("5. Missing required permission is handled correctly (returns 403 PERMISSION_DENIED, not PERMISSION_NOT_FOUND)")
    void scenario05_missingRequiredPermission_returns403PermissionDenied() {
        OrganizationMember adminMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(adminMember));

        // User has NO permissions
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder()
                        .userId(userId)
                        .permissions(Collections.emptyList())
                        .build());

        // But permission exists in catalog
        Feature feature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(feature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed());
        assertEquals("PERMISSION_DENIED", decision.getReason(), "Should return PERMISSION_DENIED since permission exists in catalog");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 6: Organization ADMIN follows configured permissions
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("6. Organization ADMIN follows configured permissions")
    void scenario06_organizationAdmin_followsConfiguredPermissions() {
        OrganizationMember adminMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.ADMIN)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(adminMember));

        // When granted
        UserPermissionDetailDto granted = UserPermissionDetailDto.builder()
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .allowed(true)
                .active(true)
                .build();
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(List.of(granted)).build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision allowedDecision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(allowedDecision.isAllowed());

        // When not granted
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());
        Feature feature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(feature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        AuthorizationDecision deniedDecision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(deniedDecision.isAllowed());
        assertEquals("PERMISSION_DENIED", deniedDecision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 7: Unauthorized organization member receives 403
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("7. Unauthorized organization member receives 403")
    void scenario07_unauthorizedOrganizationMember_receives403() throws Exception {
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());
        Feature feature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(feature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        yamlAuthorizationFilter.doFilter(request, response, filterChain);
        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("Access denied: PERMISSION_DENIED"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 8: Inactive organization membership is rejected
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("8. Inactive organization membership is rejected (SUSPENDED or DEACTIVATED)")
    void scenario08_inactiveOrganizationMembership_isRejected() throws Exception {
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty()); // No active membership!

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        organizationContextFilter.doFilter(request, response, filterChain);
        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("Active organization membership required"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 9: Another organization's ID cannot access catalog (Tenant Isolation)
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("9. Another organization's ID cannot access the catalog (tenant isolation)")
    void scenario09_anotherOrganizationId_cannotAccessCatalog_tenantIsolation() throws Exception {
        when(organizationRepository.findById(otherOrgId)).thenReturn(Optional.of(otherOrganization));
        // User belongs to orgId, but NOT otherOrgId
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(otherOrgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/permissions/catalog");
        request.setParameter("organizationId", otherOrgId.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        organizationContextFilter.doFilter(request, response, filterChain);
        assertEquals(403, response.getStatus(), "Tenant cross-access must be blocked with 403");
        assertTrue(response.getContentAsString().contains("Active organization membership required"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 10: Company-level OWNER cannot automatically access organization resources
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("10. Company-level OWNER cannot automatically access organization resources")
    void scenario10_companyLevelOwner_cannotAutomaticallyAccessOrganizationResources() {
        // User has company-level role 'OWNER' for Company A
        Role companyOwnerRole = Role.builder()
                .id(UUID.randomUUID())
                .name("OWNER")
                .company(Company.builder().id(UUID.randomUUID()).companyName("Company A").build())
                .status(true)
                .build();
        UserRole ur = UserRole.builder().user(user).role(companyOwnerRole).build();
        user.setUserRoles(List.of(ur));

        // BUT in organization_member, user is only a MEMBER (NOT organization OWNER)
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        // They do NOT have organization appearance permission
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        Feature feature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(feature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertFalse(decision.isAllowed(), "Company-level OWNER must NOT bypass organization-level authorization");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 11: Organization OWNER access does not require an active company
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("11. Organization OWNER access does not require an unrelated active company (companyId is null)")
    void scenario11_organizationOwnerAccess_doesNotRequireUnrelatedActiveCompany() {
        // RequestContext has orgId, but companyId is NULL
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        assertNull(RequestContext.get().companyId(), "Active company must be null");

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
        assertTrue(decision.isAllowed(), "Organization OWNER must be authorized even when companyId is null");
        assertEquals("ORG_OWNER_PERMISSION", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 12: Missing organization context is handled correctly
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("12. Missing organization context is handled correctly")
    void scenario12_missingOrganizationContext_isHandledCorrectly() throws Exception {
        // RequestContext has userId, but organizationId is null and user has 2 active organizations (ambiguous context)
        RequestContext.set(userId, null, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByUser_IdAndMembershipStatus(userId, MembershipStatus.ACTIVE))
                .thenReturn(List.of(activeOwnerMember, OrganizationMember.builder()
                        .id(UUID.randomUUID())
                        .organization(otherOrganization)
                        .user(user)
                        .memberType(MemberType.MEMBER)
                        .membershipStatus(MembershipStatus.ACTIVE)
                        .build()));

        appearanceMockMvc.perform(get("/api/sso/organization/appearance"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Organization context required"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 13: Existing multi-company RBAC tests continue to pass
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("13. Existing multi-company RBAC role scoping continues to pass")
    void scenario13_existingMultiCompanyRbacTests_continueToPass() {
        UUID compAId = UUID.randomUUID();
        UUID compBId = UUID.randomUUID();

        Company compA = Company.builder().id(compAId).companyName("Company A").organization(organization).build();
        Company compB = Company.builder().id(compBId).companyName("Company B").organization(organization).build();

        Role accountantRole = Role.builder().id(UUID.randomUUID()).name("Accountant").company(compA).status(true).build();
        Role salesRole = Role.builder().id(UUID.randomUUID()).name("Sales Executive").company(compB).status(true).build();

        user.setUserRoles(List.of(
                UserRole.builder().user(user).role(accountantRole).build(),
                UserRole.builder().user(user).role(salesRole).build()
        ));

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userPermissionRepository.findByUser_Id(userId)).thenReturn(Collections.emptyList());

        // When Company A is requested: only Accountant role is active
        PermissionServiceImpl permService = new PermissionServiceImpl(
                featurePermissionRepository,
                userPermissionRepository,
                userRepository,
                rolePermissionRepository,
                roleRepository,
                featureRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                companyRepository,
                subscriptionRepository,
                subscriptionPlanModuleRepository,
                companySubscriptionRepository,
                subscriptionPlanRepository,
                organizationMemberRepository
        );

        EffectivePermissionsResponse respA = permService.getEffectivePermissions(userId, compAId);
        assertTrue(respA.getRoles().contains("Accountant"), "Company A must contain Accountant role");
        assertFalse(respA.getRoles().contains("Sales Executive"), "Company A must NOT leak Sales Executive role");

        EffectivePermissionsResponse respB = permService.getEffectivePermissions(userId, compBId);
        assertTrue(respB.getRoles().contains("Sales Executive"), "Company B must contain Sales Executive role");
        assertFalse(respB.getRoles().contains("Accountant"), "Company B must NOT leak Accountant role");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 14: Subscription and access-mode checks remain intact
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("14. Subscription and access-mode checks remain intact (AccessMode.BLOCKED is rejected)")
    void scenario14_subscriptionAndAccessModeChecks_remainIntact() throws Exception {
        Organization blockedOrg = Organization.builder()
                .id(orgId)
                .organizationCode("BLOCKED_ORG")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.BLOCKED)
                .build();
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(blockedOrg));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        request.setParameter("organizationId", orgId.toString());
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        organizationContextFilter.doFilter(request, response, filterChain);
        assertEquals(403, response.getStatus());
        assertTrue(response.getContentAsString().contains("Organization access is blocked"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scenario 15: Permission bootstrap/seed is idempotent
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("15. Permission bootstrap/seed is idempotent")
    void scenario15_permissionBootstrapSeed_isIdempotent() {
        FeatureBootstrap bootstrap = new FeatureBootstrap(featureRepository, featurePermissionRepository);

        Feature orgAppearanceFeature = Feature.builder()
                .id(UUID.randomUUID())
                .code("ORGANIZATION_APPEARANCE")
                .name("Organization Appearance")
                .moduleName("CORE")
                .active(true)
                .build();

        // Simulate first run where features don't exist
        when(featureRepository.findByCodeIgnoreCase(any()))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(orgAppearanceFeature));

        when(featureRepository.save(any(Feature.class))).thenAnswer(inv -> {
            Feature f = inv.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });

        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(any()))
                .thenReturn(Optional.empty());

        assertDoesNotThrow(() -> bootstrap.run(), "First bootstrap run should execute without error");

        // Second run: features and permissions already exist
        when(featureRepository.findByCodeIgnoreCase(any()))
                .thenReturn(Optional.of(orgAppearanceFeature));
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase(any()))
                .thenReturn(Optional.of(FeaturePermission.builder().permissionCode("EXISTING").active(true).build()));

        assertDoesNotThrow(() -> bootstrap.run(), "Second bootstrap run must be idempotent and succeed without duplicating");
        verify(featurePermissionRepository, atLeastOnce()).findByPermissionCodeIgnoreCase(any());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECURITY REGRESSION TESTS: Strict Least-Privilege & No Privilege Escalation
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Security: Organization OWNER receives only explicitly authorized organization permissions")
    void securityRegression_orgOwner_receivesOnlyExplicitlyAuthorizedOrgPermissions() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userPermissionRepository.findByUser_Id(userId)).thenReturn(Collections.emptyList());
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        Feature orgAppearance = Feature.builder().code("ORGANIZATION_APPEARANCE").moduleName("CORE").active(true).build();
        Feature orgPerms = Feature.builder().code("ORGANIZATION_PERMISSIONS").moduleName("SSO").active(true).build();
        Feature platformAdmin = Feature.builder().code("PLATFORM_ADMIN").moduleName("SSO").active(true).build();
        Feature billing = Feature.builder().code("BILLING").moduleName("BILLING").active(true).build();
        Feature payments = Feature.builder().code("PAYMENTS").moduleName("ACCOUNT").active(true).build();
        Feature manufacturing = Feature.builder().code("MANUFACTURING").moduleName("MANUFACTURING").active(true).build();
        Feature reports = Feature.builder().code("REPORTS").moduleName("ACCOUNT").active(true).build();

        FeaturePermission fpAppearance = FeaturePermission.builder().feature(orgAppearance).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        FeaturePermission fpOrgPerms = FeaturePermission.builder().feature(orgPerms).permissionCode("ORGANIZATION_PERMISSIONS:READ").action("READ").active(true).build();
        FeaturePermission fpPlatform = FeaturePermission.builder().feature(platformAdmin).permissionCode("PLATFORM_ADMIN:READ").action("READ").active(true).build();
        FeaturePermission fpBilling = FeaturePermission.builder().feature(billing).permissionCode("BILLING:READ").action("READ").active(true).build();
        FeaturePermission fpPayments = FeaturePermission.builder().feature(payments).permissionCode("PAYMENTS:READ").action("READ").active(true).build();
        FeaturePermission fpMfg = FeaturePermission.builder().feature(manufacturing).permissionCode("MANUFACTURING:READ").action("READ").active(true).build();
        FeaturePermission fpReports = FeaturePermission.builder().feature(reports).permissionCode("REPORTS:READ").action("READ").active(true).build();

        when(featurePermissionRepository.findAll()).thenReturn(List.of(
                fpAppearance, fpOrgPerms, fpPlatform, fpBilling, fpPayments, fpMfg, fpReports
        ));

        PermissionServiceImpl permService = new PermissionServiceImpl(
                featurePermissionRepository,
                userPermissionRepository,
                userRepository,
                rolePermissionRepository,
                roleRepository,
                featureRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                companyRepository,
                subscriptionRepository,
                subscriptionPlanModuleRepository,
                companySubscriptionRepository,
                subscriptionPlanRepository,
                organizationMemberRepository
        );

        EffectivePermissionsResponse effective = permService.getEffectivePermissions(userId);
        List<String> allowedCodes = effective.getPermissions().stream()
                .filter(UserPermissionDetailDto::isAllowed)
                .map(UserPermissionDetailDto::getPermissionCode)
                .toList();

        // Must receive explicit organization admin permissions
        assertTrue(allowedCodes.contains("ORGANIZATION_APPEARANCE:READ"), "Must contain ORGANIZATION_APPEARANCE:READ");
        assertTrue(allowedCodes.contains("ORGANIZATION_PERMISSIONS:READ"), "Must contain ORGANIZATION_PERMISSIONS:READ");

        // Must NOT automatically receive platform or operational permissions
        assertFalse(allowedCodes.contains("PLATFORM_ADMIN:READ"), "Must NOT receive PLATFORM_ADMIN permissions");
        assertFalse(allowedCodes.contains("BILLING:READ"), "Must NOT receive BILLING permissions");
        assertFalse(allowedCodes.contains("PAYMENTS:READ"), "Must NOT receive PAYMENTS operational permissions");
        assertFalse(allowedCodes.contains("MANUFACTURING:READ"), "Must NOT receive MANUFACTURING operational permissions");
        assertFalse(allowedCodes.contains("REPORTS:READ"), "Must NOT receive REPORTS permissions");
    }

    @Test
    @DisplayName("Security: Organization OWNER does not automatically receive PLATFORM_ADMIN")
    void securityRegression_orgOwner_cannotAccessPlatformAdmin() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        Feature platformAdmin = Feature.builder().code("PLATFORM_ADMIN").name("Platform Admin").moduleName("SSO").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(platformAdmin).permissionCode("PLATFORM_ADMIN:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("PLATFORM_ADMIN:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/platform/admins");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Organization OWNER must NOT have PLATFORM_ADMIN access");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }

    @Test
    @DisplayName("Security: Organization OWNER does not automatically receive unrelated billing permissions")
    void securityRegression_orgOwner_cannotAccessBilling() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        Feature billingFeature = Feature.builder().code("BILLING").name("Billing").moduleName("BILLING").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(billingFeature).permissionCode("BILLING:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("BILLING:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/billing/invoices");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Organization OWNER must NOT have general billing operational access without role");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security Rule 1 & 2: Adding a new action to an existing organization feature
    // must NOT automatically grant it to OWNER
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Security: New action on existing organization feature (e.g. ORGANIZATION:PURGE) is denied to OWNER")
    void securityRegression_unlistedActionOnExistingFeature_isDeniedToOwner() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        Feature orgFeature = Feature.builder().code("ORGANIZATION").name("Organization").moduleName("CORE").active(true).build();
        FeaturePermission fpPurge = FeaturePermission.builder()
                .feature(orgFeature)
                .permissionCode("ORGANIZATION:PURGE")
                .action("PURGE")
                .active(true)
                .build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION:PURGE"))
                .thenReturn(Optional.of(fpPurge));

        // Effective permissions does not contain ORGANIZATION:PURGE because it is not in EXPLICIT_ORG_OWNER_PERMISSIONS
        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/sso/organization/purge");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Organization OWNER must NOT automatically receive unlisted action ORGANIZATION:PURGE");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }

    @Test
    @DisplayName("Security: Unlisted action on ORGANIZATION_APPEARANCE (e.g. EXPORT) is denied to OWNER in PermissionServiceImpl")
    void securityRegression_unlistedAction_notGrantedByPermissionService() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        Feature appearanceFeature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fpRead = FeaturePermission.builder().feature(appearanceFeature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        FeaturePermission fpExport = FeaturePermission.builder().feature(appearanceFeature).permissionCode("ORGANIZATION_APPEARANCE:EXPORT").action("EXPORT").active(true).build();

        when(featurePermissionRepository.findAll()).thenReturn(List.of(fpRead, fpExport));

        PermissionServiceImpl permService = new PermissionServiceImpl(
                featurePermissionRepository,
                userPermissionRepository,
                userRepository,
                rolePermissionRepository,
                roleRepository,
                featureRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                companyRepository,
                subscriptionRepository,
                subscriptionPlanModuleRepository,
                companySubscriptionRepository,
                subscriptionPlanRepository,
                organizationMemberRepository
        );

        EffectivePermissionsResponse effective = permService.getEffectivePermissions(userId);
        List<String> allowedCodes = effective.getPermissions().stream()
                .filter(UserPermissionDetailDto::isAllowed)
                .map(UserPermissionDetailDto::getPermissionCode)
                .toList();

        assertTrue(allowedCodes.contains("ORGANIZATION_APPEARANCE:READ"), "Allowlisted permission must be granted");
        assertFalse(allowedCodes.contains("ORGANIZATION_APPEARANCE:EXPORT"), "Unlisted action on existing feature must NOT be granted");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security Rule 3: Adding a new organization feature must NOT automatically grant it
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Security: New organization feature (e.g. ORGANIZATION_TAX) is denied to OWNER by default")
    void securityRegression_newOrganizationFeature_isDeniedToOwner() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

        Feature taxFeature = Feature.builder().code("ORGANIZATION_TAX").name("Tax Settings").moduleName("CORE").active(true).build();
        FeaturePermission fpTaxRead = FeaturePermission.builder().feature(taxFeature).permissionCode("ORGANIZATION_TAX:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_TAX:READ"))
                .thenReturn(Optional.of(fpTaxRead));

        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/tax");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "New organization feature must NOT be granted automatically to OWNER");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security Rule 4: Unknown, future, or inactive permission codes must be denied
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Security: Unknown permission not in catalog returns PERMISSION_NOT_FOUND")
    void securityRegression_unknownPermission_returnsPermissionNotFound() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        // When code does not exist in catalog
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.empty());
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION:READ"))
                .thenReturn(Optional.empty());

        when(permissionService.getEffectivePermissions(userId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed());
        assertEquals("PERMISSION_NOT_FOUND", decision.getReason());
    }

    @Test
    @DisplayName("Security: Inactive permission in catalog returns PERMISSION_DISABLED even for Organization OWNER")
    void securityRegression_inactivePermission_returnsPermissionDisabled() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        Feature appearanceFeature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission disabledFp = FeaturePermission.builder()
                .feature(appearanceFeature)
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(false) // Inactive in database
                .build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(disabledFp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Inactive permission must NOT be allowed");
        assertEquals("PERMISSION_DISABLED", decision.getReason());
    }

    @Test
    @DisplayName("Security: Permission with inactive feature returns PERMISSION_DISABLED even for Organization OWNER")
    void securityRegression_inactiveFeature_returnsPermissionDisabled() {
        RequestContext.set(userId, orgId, null, null, AccessMode.FULL);
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeOwnerMember));

        Feature disabledFeature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(false).build();
        FeaturePermission fp = FeaturePermission.builder()
                .feature(disabledFeature)
                .permissionCode("ORGANIZATION_APPEARANCE:READ")
                .action("READ")
                .active(true)
                .build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Permission with inactive feature must NOT be allowed");
        assertEquals("PERMISSION_DISABLED", decision.getReason());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security Rule 6: Company OWNER cannot inherit Organization OWNER permissions
    // ─────────────────────────────────────────────────────────────────────────
    @Test
    @DisplayName("Security: Company OWNER without Organization OWNER membership is denied organization admin access")
    void securityRegression_companyOwner_cannotAccessOrganizationAdmin() {
        UUID companyId = UUID.randomUUID();
        RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

        // User is regular MEMBER of organization, but has OWNER role in Company
        OrganizationMember regularMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(user)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(regularMember));

        when(permissionService.getEffectivePermissions(userId, companyId))
                .thenReturn(EffectivePermissionsResponse.builder().userId(userId).permissions(Collections.emptyList()).build());

        Feature appearanceFeature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance").moduleName("CORE").active(true).build();
        FeaturePermission fp = FeaturePermission.builder().feature(appearanceFeature).permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();
        when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:READ"))
                .thenReturn(Optional.of(fp));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
        AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);

        assertFalse(decision.isAllowed(), "Company OWNER must NOT inherit Organization OWNER access");
        assertEquals("PERMISSION_DENIED", decision.getReason());
    }
}
