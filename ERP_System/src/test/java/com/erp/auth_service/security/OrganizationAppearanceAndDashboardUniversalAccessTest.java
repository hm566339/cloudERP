package com.erp.auth_service.security;

import com.erp.auth_service.controller.OrganizationAppearanceController;
import com.erp.auth_service.dto.request.CreateRoleRequest;
import com.erp.auth_service.dto.role_template.CreateRoleTemplateRequest;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.dto.response.UserPermissionDetailDto;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.authorization.AuthorizationDecision;
import com.erp.auth_service.security.authorization.AuthorizationProperties;
import com.erp.auth_service.security.authorization.SsoAuthorizationService;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.service.PermissionService;
import com.erp.auth_service.service.impl.PermissionServiceImpl;
import com.erp.auth_service.service.impl.RoleServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class OrganizationAppearanceAndDashboardUniversalAccessTest {

        @Mock
        private OrganizationAppearanceService appearanceService;

        @Mock
        private PermissionService permissionService;

        @Mock
        private FeaturePermissionRepository featurePermissionRepository;

        @Mock
        private OrganizationMemberRepository organizationMemberRepository;

        @Mock
        private OrganizationRepository organizationRepository;

        @Mock
        private CompanyRepository companyRepository;

        @Mock
        private RoleRepository roleRepository;

        @Mock
        private RolePermissionRepository rolePermissionRepository;

        @Mock
        private UserRepository userRepository;

        @Mock
        private UserRoleRepository userRoleRepository;

        @Mock
        private UserPermissionRepository userPermissionRepository;

        @Mock
        private FeatureRepository featureRepository;

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
        private YamlAuthorizationFilter yamlAuthorizationFilter;
        private OrganizationContextFilter organizationContextFilter;
        private OrganizationAppearanceController appearanceController;

        private UUID orgId;
        private UUID companyId;
        private UUID userId;
        private Organization organization;
        private Company company;
        private User user;
        private Authentication userAuth;
        private CustomUserDetails userDetails;

        @BeforeEach
        void setUp() {
                orgId = UUID.randomUUID();
                companyId = UUID.randomUUID();
                userId = UUID.randomUUID();

                organization = Organization.builder()
                                .id(orgId)
                                .organizationCode("MARK2")
                                .legalName("Mark2 Corp")
                                .displayName("Mark2 Corp")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                company = Company.builder()
                                .id(companyId)
                                .companyCode("COMP-1")
                                .companyName("Mark2 Company")
                                .legalName("Mark2 Company")
                                .organization(organization)
                                .active(true)
                                .build();

                user = User.builder()
                                .id(userId)
                                .email("member@mark2.in")
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();

                userDetails = new CustomUserDetails(user);
                userAuth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(userAuth);

                // Configure AuthorizationProperties matching authorization.yml
                authorizationProperties = new AuthorizationProperties();
                Map<String, List<String>> modules = new HashMap<>();
                modules.put("ORGANIZATION_APPEARANCE", List.of(
                                "/api/sso/organization/appearance/**",
                                "/api/sso/organization/appearance",
                                "/api/organization/appearance/**",
                                "/api/organization/appearance"));
                modules.put("DASHBOARD", List.of(
                                "/api/sso/dashboard/**",
                                "/api/sso/dashboard",
                                "/api/dashboard/**",
                                "/api/dashboard"));
                authorizationProperties.setModules(modules);

                Map<String, List<String>> methodActions = new HashMap<>();
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
                                organizationMemberRepository);

                yamlAuthorizationFilter = new YamlAuthorizationFilter(ssoAuthorizationService);

                organizationContextFilter = new OrganizationContextFilter(
                                organizationRepository,
                                organizationMemberRepository,
                                companyRepository);

                appearanceController = new OrganizationAppearanceController(
                                appearanceService,
                                companyRepository,
                                organizationMemberRepository);

                when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
        }

        @AfterEach
        void tearDown() {
                RequestContext.clear();
                SecurityContextHolder.clearContext();
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 1. Super Admin access without organization membership requirement
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("Super Admin can view Organization Appearance without organization membership")
        void superAdmin_canAccessOrganizationAppearance_withoutOrganizationMembership() throws Exception {
                UUID adminId = UUID.randomUUID();
                PlatformAdminPrincipal pap = PlatformAdminPrincipal.builder()
                                .adminId(adminId)
                                .email("superadmin@platform.com")
                                .fullName("Super Admin")
                                .authorities(List.of(new SimpleGrantedAuthority("SUPER_ADMIN"),
                                                new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")))
                                .build();
                Authentication superAdminAuth = new UsernamePasswordAuthenticationToken(
                                pap, null, pap.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(superAdminAuth);

                // OrganizationContextFilter does not reject Super Admin even when memberOpt is
                // empty
                MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
                request.setParameter("organizationId", orgId.toString());
                MockHttpServletResponse response = new MockHttpServletResponse();
                MockFilterChain filterChain = new MockFilterChain();

                organizationContextFilter.doFilter(request, response, filterChain);
                assertEquals(200, response.getStatus());

                // AuthorizationDecision recognizes SUPER_ADMIN as full access bypass
                AuthorizationDecision decision = ssoAuthorizationService.authorize(superAdminAuth, request);
                assertTrue(decision.isAllowed());
                assertEquals("SYSTEM_ADMIN_FULL_ACCESS", decision.getReason());

                // Controller resolveOrgId succeeds for Super Admin
                when(appearanceService.getAppearance(orgId))
                                .thenReturn(OrganizationAppearanceResponse.builder().organizationId(orgId).build());
                var res = appearanceController.getAppearance(orgId, null);
                assertNotNull(res.getBody());
                assertEquals(orgId, res.getBody().getData().getOrganizationId());
        }

        @Test
        @DisplayName("Super Admin can view Dashboard without organization membership")
        void superAdmin_canAccessDashboard_withoutOrganizationMembership() {
                UUID adminId = UUID.randomUUID();
                PlatformAdminPrincipal pap = PlatformAdminPrincipal.builder()
                                .adminId(adminId)
                                .email("superadmin@platform.com")
                                .fullName("Super Admin")
                                .authorities(List.of(new SimpleGrantedAuthority("SUPER_ADMIN")))
                                .build();
                Authentication superAdminAuth = new UsernamePasswordAuthenticationToken(
                                pap, null, pap.getAuthorities());

                MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/dashboard/" + companyId);
                AuthorizationDecision decision = ssoAuthorizationService.authorize(superAdminAuth, request);
                assertTrue(decision.isAllowed());
                assertEquals("SYSTEM_ADMIN_FULL_ACCESS", decision.getReason());
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. All Authenticated Roles in Organization can view Appearance and Dashboard
        // ─────────────────────────────────────────────────────────────────────────

        private void mockActiveMembershipAndEffectivePermissions(MemberType memberType, String roleName) {
                OrganizationMember member = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(user)
                                .memberType(memberType)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(member));

                List<UserPermissionDetailDto> perms = List.of(
                                UserPermissionDetailDto.builder().permissionCode("ORGANIZATION_APPEARANCE:READ")
                                                .allowed(true).active(true).build(),
                                UserPermissionDetailDto.builder().permissionCode("DASHBOARD:READ").allowed(true)
                                                .active(true).build());

                when(permissionService.getEffectivePermissions(userId))
                                .thenReturn(EffectivePermissionsResponse.builder().userId(userId)
                                                .roles(List.of(roleName)).permissions(perms).build());
                when(permissionService.getEffectivePermissions(userId, companyId))
                                .thenReturn(EffectivePermissionsResponse.builder().userId(userId)
                                                .roles(List.of(roleName)).permissions(perms).build());
        }

        @Test
        @DisplayName("Organization Owner can view Appearance and Dashboard")
        void organizationOwner_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.OWNER, "OWNER");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
        }

        @Test
        @DisplayName("Organization Admin can view Appearance and Dashboard")
        void organizationAdmin_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.ADMIN, "ADMIN");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        @Test
        @DisplayName("Manager role can view Appearance and Dashboard")
        void manager_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "MANAGER");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        @Test
        @DisplayName("HR role can view Appearance and Dashboard")
        void hr_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "HR");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        @Test
        @DisplayName("Employee role can view Appearance and Dashboard")
        void employee_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "EMPLOYEE");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        @Test
        @DisplayName("Team Leader role can view Appearance and Dashboard")
        void teamLeader_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "TEAM_LEADER");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        @Test
        @DisplayName("Custom Role can view Appearance and Dashboard")
        void customRole_canAccessOrganizationAppearance_and_Dashboard() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "ACCOUNTANT_SPECIALIST");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                MockHttpServletRequest appearanceReq = new MockHttpServletRequest("GET",
                                "/api/sso/organization/appearance");
                AuthorizationDecision appearanceDecision = ssoAuthorizationService.authorize(userAuth, appearanceReq);
                assertTrue(appearanceDecision.isAllowed());
                assertEquals("DB_PERMISSION", appearanceDecision.getReason());

                MockHttpServletRequest dashboardReq = new MockHttpServletRequest("GET",
                                "/api/sso/dashboard/" + companyId);
                AuthorizationDecision dashboardDecision = ssoAuthorizationService.authorize(userAuth, dashboardReq);
                assertTrue(dashboardDecision.isAllowed());
                assertEquals("DB_PERMISSION", dashboardDecision.getReason());
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 3. Centralized Permission Service Automatically Grants Baseline Read
        // Permissions
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("PermissionService getEffectivePermissions automatically includes DASHBOARD:READ and ORGANIZATION_APPEARANCE:READ for active members")
        void permissionService_grantsBaselinePermissions_toActiveOrganizationMembers() {
                PermissionServiceImpl serviceImpl = new PermissionServiceImpl(
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
                                organizationMemberRepository);

                when(userRepository.findById(userId)).thenReturn(Optional.of(user));
                when(userPermissionRepository.findByUser_Id(userId)).thenReturn(Collections.emptyList());

                OrganizationMember member = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(user)
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(member));

                Feature coreFeature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance")
                                .moduleName("CORE").active(true).build();
                FeaturePermission appearancePerm = FeaturePermission.builder().feature(coreFeature)
                                .permissionCode("ORGANIZATION_APPEARANCE:READ").action("READ").active(true).build();

                Feature dashboardFeature = Feature.builder().code("DASHBOARD").name("Dashboard").moduleName("CORE")
                                .active(true).build();
                FeaturePermission dashboardPerm = FeaturePermission.builder().feature(dashboardFeature)
                                .permissionCode("DASHBOARD:READ").action("READ").active(true).build();

                when(featurePermissionRepository.findAll()).thenReturn(List.of(appearancePerm, dashboardPerm));

                RequestContext.set(userId, orgId, null, null, AccessMode.FULL);

                EffectivePermissionsResponse response = serviceImpl.getEffectivePermissions(userId);
                assertNotNull(response);
                List<String> codes = response.getPermissions().stream()
                                .filter(UserPermissionDetailDto::isAllowed)
                                .map(UserPermissionDetailDto::getPermissionCode)
                                .toList();

                assertTrue(codes.contains("ORGANIZATION_APPEARANCE:READ"),
                                "Active member must automatically receive ORGANIZATION_APPEARANCE:READ");
                assertTrue(codes.contains("DASHBOARD:READ"), "Active member must automatically receive DASHBOARD:READ");
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 4. Multi-Tenant Isolation: User from Org A cannot access Org B Appearance
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("User from Org A cannot access Org B Appearance (tenant isolation returns 403)")
        void tenantIsolation_userFromOrgA_cannotAccessOrgBAppearance() throws Exception {
                UUID otherOrgId = UUID.randomUUID();
                Organization otherOrg = Organization.builder()
                                .id(otherOrgId)
                                .organizationCode("OTHER")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();
                when(organizationRepository.findById(otherOrgId)).thenReturn(Optional.of(otherOrg));

                // User belongs to orgId, but NOT otherOrgId
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(otherOrgId, userId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.empty());

                MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
                request.setParameter("organizationId", otherOrgId.toString());
                MockHttpServletResponse response = new MockHttpServletResponse();
                MockFilterChain filterChain = new MockFilterChain();

                organizationContextFilter.doFilter(request, response, filterChain);
                assertEquals(403, response.getStatus(), "Non-member of requested organization must be denied with 403");
                assertTrue(response.getContentAsString().contains("Active organization membership required"));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 5. Mutation Restrictions: Regular roles cannot mutate appearance
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("Regular member role cannot update/mutate organization appearance (returns 403)")
        void regularRole_cannotMutateAppearance_PUT_returns403() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "EMPLOYEE");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                // Feature permission exists in catalog
                Feature feature = Feature.builder().code("ORGANIZATION_APPEARANCE").name("Appearance")
                                .moduleName("CORE").active(true).build();
                FeaturePermission writeFp = FeaturePermission.builder().feature(feature)
                                .permissionCode("ORGANIZATION_APPEARANCE:WRITE").action("WRITE").active(true).build();
                when(featurePermissionRepository.findByPermissionCodeIgnoreCase("ORGANIZATION_APPEARANCE:WRITE"))
                                .thenReturn(Optional.of(writeFp));

                // PUT requires UPDATE / WRITE
                MockHttpServletRequest putReq = new MockHttpServletRequest("PUT", "/api/sso/organization/appearance");
                AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, putReq);
                assertFalse(decision.isAllowed(), "Regular role must NOT be allowed to mutate appearance");
                assertEquals("PERMISSION_DENIED", decision.getReason());
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 6. Dot-notated permission alias matching
        // ─────────────────────────────────────────────────────────────────────────

        @Test
        @DisplayName("organization.appearance.read alias resolves correctly in authorization service")
        void organizationAppearanceReadAlias_resolvesCorrectly() {
                mockActiveMembershipAndEffectivePermissions(MemberType.MEMBER, "EMPLOYEE");
                RequestContext.set(userId, orgId, companyId, null, AccessMode.FULL);

                // Effective permissions provide dot-notated code
                UserPermissionDetailDto dotPerm = UserPermissionDetailDto.builder()
                                .permissionCode("organization.appearance.read")
                                .allowed(true)
                                .active(true)
                                .build();

                when(permissionService.getEffectivePermissions(userId))
                                .thenReturn(EffectivePermissionsResponse.builder().userId(userId)
                                                .permissions(List.of(dotPerm)).build());

                MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/sso/organization/appearance");
                AuthorizationDecision decision = ssoAuthorizationService.authorize(userAuth, request);
                assertTrue(decision.isAllowed(), "Dot-notated permission alias must authorize GET appearance");
                assertEquals("DB_PERMISSION", decision.getReason());
        }
}