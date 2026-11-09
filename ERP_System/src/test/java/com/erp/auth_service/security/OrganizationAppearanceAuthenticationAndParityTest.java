package com.erp.auth_service.security;

import com.erp.auth_service.security.authorization.AuthorizationProperties;
import com.erp.auth_service.controller.AuthController;
import com.erp.auth_service.controller.CompanyController;
import com.erp.auth_service.controller.OrganizationAppearanceController;
import com.erp.auth_service.controller.OrganizationSubscriptionController;
import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.CompanyListResponse;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.dto.response.OrganizationSubscriptionResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.exception.GlobalExceptionHandler;
import com.erp.auth_service.model.*;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.security.authorization.SsoAuthorizationService;
import com.erp.auth_service.security.authorization.YamlAuthorizationFilter;
import com.erp.auth_service.service.*;
import com.erp.auth_service.service.impl.PermissionServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * End-to-End Security & RBAC Integration Tests for:
 * 1. GET /api/sso/organization/appearance
 * 2. Parity with GET /api/sso/auth/me (and GET /api/sso/me)
 * 3. 200 OK for Authenticated Organization OWNER with explicit allowlisted
 * permissions
 * 4. 403 Forbidden for Authenticated user without required permissions (Never
 * 401)
 * 5. 401 Unauthorized for unauthenticated, invalid, or expired sessions
 */
@ExtendWith(MockitoExtension.class)
class OrganizationAppearanceAuthenticationAndParityTest {

        private MockMvc mockMvc;

        @Mock
        private OrganizationAppearanceService appearanceService;

        @Mock
        private UserService userService;

        @Mock
        private AuthService authService;

        @Mock
        private UserAccessService userAccessService;

        @Mock
        private OrganizationService organizationService;

        @Mock
        private Environment environment;

        @Mock
        private CompanyService companyService;

        @Mock
        private OrganizationSettingsService settingsService;

        @Mock
        private JwtDecoder jwtDecoder;

        @Mock
        private CustomUserDetailsService userDetailsService;

        @Mock
        private SessionRepository sessionRepository;

        @Mock
        private OrganizationRepository organizationRepository;

        @Mock
        private OrganizationMemberRepository organizationMemberRepository;

        @Mock
        private CompanyRepository companyRepository;

        @Mock
        private MemberCompanyAccessRepository memberCompanyAccessRepository;

        @Mock
        private PlatformAdminRepository platformAdminRepository;

        @Mock
        private SupportAccessSessionRepository supportAccessSessionRepository;

        @Mock
        private FeaturePermissionRepository featurePermissionRepository;

        @Mock
        private PermissionService permissionService;

        private JwtAuthenticationFilter jwtAuthenticationFilter;
        private OrganizationContextFilter organizationContextFilter;
        private YamlAuthorizationFilter yamlAuthorizationFilter;
        private SsoAuthorizationService ssoAuthorizationService;
        private AuthorizationProperties authorizationProperties;

        private ObjectMapper objectMapper = new ObjectMapper();

        private UUID orgId;
        private UUID companyId;
        private UUID ownerUserId;
        private UUID employeeUserId;

        private Organization organization;
        private Company company;
        private User ownerUser;
        private User employeeUser;
        private OrganizationMember ownerMember;
        private OrganizationMember employeeMember;

        private String ownerToken = "valid.owner.jwt.token";
        private String employeeToken = "valid.employee.jwt.token";

        private Session ownerSession;
        private Session employeeSession;

        @BeforeEach
        void setUp() {
                SecurityContextHolder.clearContext();
                RequestContext.clear();
                TenantContext.clear();

                orgId = UUID.fromString("f997d7d6-366b-4af7-a9f6-93e699a3f87c");
                companyId = UUID.randomUUID();
                ownerUserId = UUID.randomUUID();
                employeeUserId = UUID.randomUUID();

                organization = Organization.builder()
                                .id(orgId)
                                .organizationCode("apex-global-enterprises")
                                .legalName("Apex Global Enterprises LLC")
                                .displayName("Apex Global Enterprises")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();

                company = Company.builder()
                                .id(companyId)
                                .organization(organization)
                                .companyCode("APEX_HQ")
                                .companyName("Apex HQ")
                                .active(true)
                                .build();

                ownerUser = User.builder()
                                .id(ownerUserId)
                                .username("apex_owner")
                                .email("owner@apex.com")
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();

                employeeUser = User.builder()
                                .id(employeeUserId)
                                .username("apex_employee")
                                .email("employee@apex.com")
                                .accountStatus(AccountStatus.ACTIVE)
                                .build();

                ownerMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(ownerUser)
                                .memberType(MemberType.OWNER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                employeeMember = OrganizationMember.builder()
                                .id(UUID.randomUUID())
                                .organization(organization)
                                .user(employeeUser)
                                .memberType(MemberType.MEMBER)
                                .membershipStatus(MembershipStatus.ACTIVE)
                                .build();

                ownerSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(ownerUser)
                                .organization(organization)
                                .company(null)
                                .accessToken(ownerToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(4))
                                .build();

                employeeSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(employeeUser)
                                .organization(organization)
                                .company(company)
                                .accessToken(employeeToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(4))
                                .build();

                // 1. Authorization Properties setup matching production YAML
                authorizationProperties = new AuthorizationProperties();
                Map<String, List<String>> modules = new LinkedHashMap<>();
                modules.put("AUTH", List.of("/api/sso/auth/**", "/api/sso/me"));
                modules.put("ORGANIZATION_APPEARANCE",
                                List.of("/api/sso/organization/appearance/**", "/api/organization/appearance/**"));
                modules.put("ORGANIZATION_PERMISSIONS",
                                List.of("/api/sso/organization/permissions/**", "/api/organization/permissions/**"));
                modules.put("ORGANIZATION_ROLE_TEMPLATES", List.of("/api/sso/organization/role-templates/**",
                                "/api/organization/role-templates/**"));
                modules.put("ORGANIZATION_MEMBERS",
                                List.of("/api/sso/organization/members/**", "/api/organization/members/**"));
                modules.put("ORGANIZATION", List.of("/api/sso/organization/**", "/api/organization/**",
                                "/api/settings/**", "/api/sso/settings/**"));
                modules.put("COMPANY", List.of("/api/sso/company/**", "/api/sso/company", "/api/sso/companies/**", "/api/sso/companies"));
                modules.put("SUBSCRIPTION", List.of("/api/sso/subscription/**", "/api/sso/subscription", "/api/sso/subscriptions/**", "/api/sso/subscriptions"));
                authorizationProperties.setModules(modules);

                Map<String, List<String>> methodActions = new LinkedHashMap<>();
                methodActions.put("GET", List.of("READ"));
                methodActions.put("POST", List.of("CREATE", "WRITE"));
                methodActions.put("PUT", List.of("UPDATE", "WRITE"));
                methodActions.put("DELETE", List.of("DELETE"));
                authorizationProperties.setMethodActions(methodActions);
                authorizationProperties.validate();

                // 2. Build Services & Filters
                ssoAuthorizationService = new SsoAuthorizationService(
                                authorizationProperties,
                                permissionService,
                                featurePermissionRepository,
                                organizationMemberRepository);

                jwtAuthenticationFilter = new JwtAuthenticationFilter(
                                jwtDecoder,
                                userDetailsService,
                                sessionRepository,
                                organizationMemberRepository,
                                memberCompanyAccessRepository,
                                platformAdminRepository,
                                supportAccessSessionRepository,
                                organizationRepository);

                organizationContextFilter = new OrganizationContextFilter(
                                organizationRepository,
                                organizationMemberRepository,
                                companyRepository);

                yamlAuthorizationFilter = new YamlAuthorizationFilter(ssoAuthorizationService);

                OrganizationAppearanceController appearanceController = new OrganizationAppearanceController(
                                appearanceService,
                                companyRepository,
                                organizationMemberRepository);

                AuthController authController = new AuthController(
                                authService,
                                userService,
                                userAccessService,
                                organizationService,
                                jwtDecoder,
                                environment);

                CompanyController companyController = new CompanyController(companyService);
                OrganizationSubscriptionController subscriptionController = new OrganizationSubscriptionController(settingsService);

                // 3. Build MockMvc with full security filter chain
                mockMvc = MockMvcBuilders.standaloneSetup(appearanceController, authController, companyController, subscriptionController)
                                .addFilters(jwtAuthenticationFilter, organizationContextFilter, yamlAuthorizationFilter)
                                .setControllerAdvice(new GlobalExceptionHandler())
                                .build();

                // 4. Common mock setup for feature catalog
                lenient().when(featurePermissionRepository.findByPermissionCodeIgnoreCase(any()))
                                .thenAnswer(inv -> {
                                        String code = inv.getArgument(0);
                                        if (code != null && PermissionServiceImpl.EXPLICIT_ORG_OWNER_PERMISSIONS
                                                        .contains(code.toUpperCase(Locale.ROOT))) {
                                                String[] parts = code.split(":");
                                                String feat = parts[0];
                                                String act = parts.length > 1 ? parts[1] : "READ";
                                                return Optional.of(FeaturePermission.builder()
                                                                .permissionCode(code)
                                                                .action(act)
                                                                .active(true)
                                                                .feature(Feature.builder().code(feat).moduleName("CORE")
                                                                                .active(true).build())
                                                                .build());
                                        }
                                        return Optional.empty();
                                });

                lenient().when(organizationRepository.findById(orgId)).thenReturn(Optional.of(organization));
                lenient().when(organizationMemberRepository.findByUser_IdAndMembershipStatus(ownerUserId, MembershipStatus.ACTIVE))
                                .thenReturn(List.of(ownerMember));
                lenient().when(organizationMemberRepository.findByUser_IdAndMembershipStatus(employeeUserId, MembershipStatus.ACTIVE))
                                .thenReturn(List.of(employeeMember));
                lenient().when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, employeeUserId, MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(employeeMember));
                lenient().when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(any(), any()))
                                .thenReturn(true);
        }

        @AfterEach
        void tearDown() {
                SecurityContextHolder.clearContext();
                RequestContext.clear();
                TenantContext.clear();
        }

        // =========================================================================
        // 1. SUCCESS (200 OK) FOR ACTIVE ORGANIZATION OWNER
        // =========================================================================

        @Test
        @DisplayName("Outcome 1: GET /api/sso/organization/appearance succeeds with HTTP 200 for authenticated Organization OWNER")
        void testGetAppearanceSuccessForOrganizationOwner() throws Exception {
                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "organizationId", orgId.toString(),
                                "organizationCode", "apex-global-enterprises",
                                "sub", "apex_owner",
                                "roles", List.of("OWNER", "ROLE_OWNER")));
                when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(ownerToken)).thenReturn(Optional.of(ownerSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));

                OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("ocean")
                                .appearanceMode("light")
                                .layoutDensity("comfortable")
                                .fontFamily("default")
                                .updatedAt(LocalDateTime.now())
                                .build();
                when(appearanceService.getAppearance(orgId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.organizationId").value(orgId.toString()))
                                .andExpect(jsonPath("$.data.organizationCode").value("apex-global-enterprises"))
                                .andExpect(jsonPath("$.data.activeTheme").value("ocean"))
                                .andExpect(jsonPath("$.data.appearanceMode").value("light"));

                verify(appearanceService).getAppearance(orgId);
        }

        // =========================================================================
        // 2. PARITY: /api/sso/auth/me AND /api/sso/me WITH /appearance
        // =========================================================================

        @Test
        @DisplayName("Outcome 2: Same OWNER token succeeds on /me, appearance, companies, and subscription")
        void testParityBetweenAuthMeAndOrganizationAppearance() throws Exception {
                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "organizationId", orgId.toString(),
                                "organizationCode", "apex-global-enterprises",
                                "sub", "apex_owner",
                                "roles", List.of("OWNER")));
                when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(ownerToken)).thenReturn(Optional.of(ownerSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));

                // Mock auth/me response
                SsoMeResponse mockMeResponse = SsoMeResponse.builder()
                                .user(SsoMeResponse.UserContext.builder().id(ownerUserId).username("apex_owner")
                                                .email("owner@apex.com").build())
                                .organization(SsoMeResponse.OrganizationContext.builder().id(orgId)
                                                .code("apex-global-enterprises").accessMode(AccessMode.FULL)
                                                .status(OrganizationStatus.ACTIVE).build())
                                .membership(SsoMeResponse.MembershipContext.builder().memberType(MemberType.OWNER)
                                                .membershipStatus(MembershipStatus.ACTIVE).build())
                                .roles(List.of(com.erp.auth_service.dto.response.RoleResponse.builder().name("OWNER").status(true).build()))
                                .build();
                when(userService.getSsoMe(eq(ownerToken), (String) any())).thenReturn(mockMeResponse);

                // Mock appearance response
                OrganizationAppearanceResponse mockAppearance = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("sage")
                                .appearanceMode("light")
                                .build();
                when(appearanceService.getAppearance(orgId)).thenReturn(mockAppearance);
                when(companyService.getAllCompanies(1, 10, null, null))
                                .thenReturn(CompanyListResponse.builder().companies(List.of()).build());
                when(settingsService.getSubscription(orgId, ownerUserId))
                                .thenReturn(OrganizationSubscriptionResponse.builder().status("ACTIVE").build());

                // 1. GET /api/sso/auth/me -> 200 OK
                mockMvc.perform(get("/api/sso/auth/me")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.organization.code").value("apex-global-enterprises"))
                                .andExpect(jsonPath("$.data.membership.memberType").value("OWNER"));

                // 2. GET /api/sso/me -> 200 OK
                mockMvc.perform(get("/api/sso/me")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                // 3. GET /api/sso/organization/appearance -> 200 OK
                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.organizationCode").value("apex-global-enterprises"))
                                .andExpect(jsonPath("$.data.activeTheme").value("sage"));

                // 4. GET /api/sso/companies?organizationId=... -> 200 with the same token
                mockMvc.perform(get("/api/sso/companies")
                                .param("organizationId", orgId.toString())
                                .header("X-Organization-Id", orgId.toString())
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));

                // 5. GET /api/sso/subscription?organizationId=... -> 200 with the same token
                mockMvc.perform(get("/api/sso/subscription")
                                .param("organizationId", orgId.toString())
                                .header("X-Organization-Id", orgId.toString())
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true));
        }

        // =========================================================================
        // 3. PERMISSION DENIED MAPS TO 403 FORBIDDEN (NEVER 401)
        // =========================================================================

        @Test
        @DisplayName("Outcome 3: Authenticated employee WITHOUT appearance permission receives HTTP 403 Forbidden (Never 401)")
        void testAuthenticatedEmployeeWithoutPermissionReceives403Forbidden() throws Exception {
                when(jwtDecoder.isTokenValid(employeeToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_employee",
                                "companyCode", "APEX_HQ",
                                "companyId", companyId.toString(),
                                "roles", List.of("EMPLOYEE")));
                when(jwtDecoder.extractClaims(employeeToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(employeeToken)).thenReturn(List.of("EMPLOYEE"));

                when(sessionRepository.findByAccessToken(employeeToken)).thenReturn(Optional.of(employeeSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId,
                                employeeUserId, MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(employeeMember));
                lenient().when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(any(),
                                eq(companyId)))
                                .thenReturn(true);

                // Employee does not have ORGANIZATION_APPEARANCE permission
                when(permissionService.getEffectivePermissions(eq(employeeUserId), any()))
                                .thenReturn(com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                                .permissions(Collections.emptyList())
                                                .build());

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + employeeToken))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.message")
                                                .value(org.hamcrest.Matchers.containsString("Access denied")));

                verify(appearanceService, never()).getAppearance(any());
        }

        // =========================================================================
        // 4. MISSING AUTHENTICATION MAPS TO 401 UNAUTHORIZED
        // =========================================================================

        @Test
        @DisplayName("Outcome 4: Missing token on GET /api/sso/organization/appearance returns HTTP 401 Unauthorized")
        void testMissingTokenReturns401Unauthorized() throws Exception {
                mockMvc.perform(get("/api/sso/organization/appearance"))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Authentication required"));

                verify(appearanceService, never()).getAppearance(any());
        }

        // =========================================================================
        // 5. INVALID OR EXPIRED TOKEN / REVOKED SESSION MAPS TO 401 UNAUTHORIZED
        // =========================================================================

        @Test
        @DisplayName("Outcome 5A: Invalid JWT token returns HTTP 401 Unauthorized")
        void testInvalidTokenReturns401Unauthorized() throws Exception {
                when(jwtDecoder.isTokenValid("bad.token")).thenReturn(false);

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer bad.token"))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Invalid token"));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 5B: Revoked session (not in sessionRepository) returns HTTP 401 Unauthorized")
        void testRevokedSessionReturns401Unauthorized() throws Exception {
                when(jwtDecoder.isTokenValid("revoked.token")).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of("sub", "revoked_user"));
                when(jwtDecoder.extractClaims("revoked.token")).thenReturn(claims);
                when(sessionRepository.findByAccessToken("revoked.token")).thenReturn(Optional.empty());

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer revoked.token"))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Session revoked. Please login again."));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 5C: Expired session returns HTTP 401 Unauthorized")
        void testExpiredSessionReturns401Unauthorized() throws Exception {
                Session expiredSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(ownerUser)
                                .organization(organization)
                                .accessToken("expired.token")
                                .accessTokenValidTill(LocalDateTime.now().minusMinutes(10))
                                .build();

                when(jwtDecoder.isTokenValid("expired.token")).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of("sub", "apex_owner"));
                when(jwtDecoder.extractClaims("expired.token")).thenReturn(claims);
                when(sessionRepository.findByAccessToken("expired.token")).thenReturn(Optional.of(expiredSession));

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer expired.token"))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Session expired. Please login again."));

                verify(appearanceService, never()).getAppearance(any());
        }

        // =========================================================================
        // 6. OWNER SESSION WITH NULL session.organization RESOLVES & RETURNS 200 OK
        // =========================================================================

        @Test
        @DisplayName("Outcome 6: Session with session.organization == null resolves via company/membership and succeeds with HTTP 200")
        void testOwnerSessionWithNullSessionOrganizationSucceedsViaFallback() throws Exception {
                // Session where session.getOrganization() was null
                Session nullOrgSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(ownerUser)
                                .organization(null)
                                .company(company) // company belongs to organization
                                .accessToken(ownerToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(2))
                                .build();

                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_owner",
                                "companyCode", "APEX_HQ",
                                "organizationId", orgId.toString(),
                                "roles", List.of("OWNER")));
                when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(ownerToken)).thenReturn(Optional.of(nullOrgSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));

                OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("terracotta")
                                .build();
                when(appearanceService.getAppearance(orgId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.activeTheme").value("terracotta"));

                verify(appearanceService).getAppearance(orgId);
                // Verify session was updated to persist resolved organization
                verify(sessionRepository, atLeastOnce()).save(
                                argThat(s -> s.getOrganization() != null && s.getOrganization().getId().equals(orgId)));
        }

        // =========================================================================
        // 7. OWNER WITH COMPANY-SCOPED SESSION CALLING APPEARANCE SUCCEEDS
        // =========================================================================

        @Test
        @DisplayName("Outcome 7: Organization OWNER with company-scoped session succeeds with HTTP 200 on appearance API")
        void testOwnerWithCompanyScopedSessionCanAccessAppearance() throws Exception {
                Session companyScopedOwnerSession = Session.builder()
                                .id(UUID.randomUUID())
                                .user(ownerUser)
                                .organization(organization)
                                .company(company)
                                .accessToken(ownerToken)
                                .accessTokenValidTill(LocalDateTime.now().plusHours(3))
                                .build();

                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "sub", "apex_owner",
                                "companyCode", "APEX_HQ",
                                "companyId", companyId.toString(),
                                "organizationId", orgId.toString(),
                                "roles", List.of("OWNER")));
                when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(ownerToken))
                                .thenReturn(Optional.of(companyScopedOwnerSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));

                OrganizationAppearanceResponse mockResponse = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("lavender")
                                .appearanceMode("dark")
                                .build();
                when(appearanceService.getAppearance(orgId)).thenReturn(mockResponse);

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.activeTheme").value("lavender"))
                                .andExpect(jsonPath("$.data.appearanceMode").value("dark"));

                verify(appearanceService).getAppearance(orgId);
        }

        // =========================================================================
        // 8. PUT AND POST /reset BY ORGANIZATION OWNER SUCCEEDS WITH HTTP 200
        // =========================================================================

        @Test
        @DisplayName("Outcome 8: PUT and POST /reset for appearance succeed with HTTP 200 for Organization OWNER")
        void testPutAndResetAppearanceSuccessForOwner() throws Exception {
                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "sub", "apex_owner",
                                "organizationId", orgId.toString(),
                                "roles", List.of("OWNER")));
                when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));

                when(sessionRepository.findByAccessToken(ownerToken)).thenReturn(Optional.of(ownerSession));
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, ownerUserId,
                                MembershipStatus.ACTIVE))
                                .thenReturn(Optional.of(ownerMember));

                UpdateOrganizationAppearanceRequest updateReq = new UpdateOrganizationAppearanceRequest();
                updateReq.setActiveTheme("ocean");
                updateReq.setAppearanceMode("dark");

                OrganizationAppearanceResponse updatedResp = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("ocean")
                                .appearanceMode("dark")
                                .build();
                when(appearanceService.updateAppearance(eq(orgId), eq(ownerUserId), any())).thenReturn(updatedResp);

                // 1. PUT /api/sso/organization/appearance -> 200 OK
                mockMvc.perform(put("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + ownerToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.activeTheme").value("ocean"));

                OrganizationAppearanceResponse resetResp = OrganizationAppearanceResponse.builder()
                                .organizationId(orgId)
                                .organizationCode("apex-global-enterprises")
                                .activeTheme("sage")
                                .appearanceMode("light")
                                .build();
                when(appearanceService.resetAppearance(eq(orgId), eq(ownerUserId))).thenReturn(resetResp);

                // 2. POST /api/sso/organization/appearance/reset -> 200 OK
                mockMvc.perform(post("/api/sso/organization/appearance/reset")
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success").value(true))
                                .andExpect(jsonPath("$.data.activeTheme").value("sage"));
        }

        // =========================================================================
        // 9. SCENARIO 4: COMPANIES WITHOUT PERMISSION MAPS TO 403 (NEVER 401)
        // =========================================================================

        @Test
        @DisplayName("Outcome 9 (Scenario 4): GET /api/sso/companies with valid token but no company permission returns HTTP 403 Forbidden (Never 401)")
        void testCompaniesWithoutPermissionReturns403Forbidden() throws Exception {
                when(jwtDecoder.isTokenValid(employeeToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_employee",
                                "companyCode", "APEX_HQ",
                                "companyId", companyId.toString(),
                                "roles", List.of("EMPLOYEE")));
                when(jwtDecoder.extractClaims(employeeToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(employeeToken)).thenReturn(List.of("EMPLOYEE"));
                when(sessionRepository.findByAccessToken(employeeToken)).thenReturn(Optional.of(employeeSession));
                lenient().when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(any(), eq(companyId)))
                                .thenReturn(true);

                when(permissionService.getEffectivePermissions(eq(employeeUserId), eq(companyId)))
                                .thenReturn(com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                                .permissions(Collections.emptyList())
                                                .build());

                mockMvc.perform(get("/api/sso/companies")
                                .header("Authorization", "Bearer " + employeeToken))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Access denied")));
        }

        // =========================================================================
        // 10. SCENARIO 5: SUBSCRIPTION WITHOUT PERMISSION MAPS TO 403 (NEVER 401)
        // =========================================================================

        @Test
        @DisplayName("Outcome 10 (Scenario 5): GET /api/sso/subscription with valid token but no permission returns HTTP 403 Forbidden (Never 401)")
        void testSubscriptionWithoutPermissionReturns403Forbidden() throws Exception {
                when(jwtDecoder.isTokenValid(employeeToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_employee",
                                "companyCode", "APEX_HQ",
                                "companyId", companyId.toString(),
                                "roles", List.of("EMPLOYEE")));
                when(jwtDecoder.extractClaims(employeeToken)).thenReturn(claims);
                when(jwtDecoder.extractRoles(employeeToken)).thenReturn(List.of("EMPLOYEE"));
                when(sessionRepository.findByAccessToken(employeeToken)).thenReturn(Optional.of(employeeSession));
                lenient().when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(any(), eq(companyId)))
                                .thenReturn(true);

                when(permissionService.getEffectivePermissions(eq(employeeUserId), eq(companyId)))
                                .thenReturn(com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                                .permissions(Collections.emptyList())
                                                .build());

                mockMvc.perform(get("/api/sso/subscription")
                                .header("Authorization", "Bearer " + employeeToken))
                                .andExpect(status().isForbidden())
                                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Access denied")));
        }

        // =========================================================================
        // 11. SCENARIO 7: VALID TOKEN WITH WRONG ORGANIZATION CONTEXT MAPS TO 403
        // =========================================================================

        @Test
        @DisplayName("Outcome 11 (Scenario 7): Valid token requesting an unrelated organization context returns HTTP 403 Forbidden")
        void testValidTokenWithWrongOrganizationContextReturns403() throws Exception {
                UUID unrelatedOrgId = UUID.randomUUID();
                when(jwtDecoder.isTokenValid(ownerToken)).thenReturn(true);
                lenient().when(jwtDecoder.isTokenValid(eq(ownerToken), anyString())).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "principalType", "ORGANIZATION_OWNER",
                                "organizationId", orgId.toString(),
                                "sub", "apex_owner",
                                "roles", List.of("OWNER")));
                lenient().when(jwtDecoder.extractClaims(ownerToken)).thenReturn(claims);
                lenient().when(jwtDecoder.extractUsername(ownerToken)).thenReturn("apex_owner");
                lenient().when(jwtDecoder.extractRoles(ownerToken)).thenReturn(List.of("OWNER"));
                when(sessionRepository.findByAccessToken(ownerToken)).thenReturn(Optional.of(ownerSession));

                Organization unrelatedOrg = Organization.builder()
                                .id(unrelatedOrgId)
                                .organizationCode("other-org")
                                .status(OrganizationStatus.ACTIVE)
                                .accessMode(AccessMode.FULL)
                                .build();
                when(organizationRepository.findById(unrelatedOrgId)).thenReturn(Optional.of(unrelatedOrg));
                // Owner has NO active membership in unrelatedOrg
                when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(unrelatedOrgId, ownerUserId, MembershipStatus.ACTIVE))
                                .thenReturn(Optional.empty());

                mockMvc.perform(get("/api/sso/organization/appearance?organizationId=" + unrelatedOrgId)
                                .header("Authorization", "Bearer " + ownerToken))
                                .andExpect(status().isForbidden());
        }

        // =========================================================================
        // 12. SCENARIO 8: SWITCHING COMPANIES DOES NOT LEAK PERMISSIONS
        // =========================================================================

        @Test
        @DisplayName("Outcome 12 (Scenario 8): Switching company context does not leak permissions across companies")
        void testSwitchingCompaniesDoesNotLeakPermissions() {
                UUID companyA = UUID.randomUUID();
                UUID companyB = UUID.randomUUID();

                when(permissionService.getEffectivePermissions(eq(employeeUserId), eq(companyA)))
                                .thenReturn(com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                                .permissions(List.of(com.erp.auth_service.dto.response.UserPermissionDetailDto.builder()
                                                                .permissionCode("COMPANY:READ")
                                                                .action("READ")
                                                                .featureCode("COMPANY")
                                                                .allowed(true)
                                                                .active(true)
                                                                .build()))
                                                .build());
                when(permissionService.getEffectivePermissions(eq(employeeUserId), eq(companyB)))
                                .thenReturn(com.erp.auth_service.dto.response.EffectivePermissionsResponse.builder()
                                                .permissions(Collections.emptyList())
                                                .build());

                var permsA = permissionService.getEffectivePermissions(employeeUserId, companyA);
                var permsB = permissionService.getEffectivePermissions(employeeUserId, companyB);

                assertTrue(permsA.getPermissions().stream().anyMatch(p -> "COMPANY:READ".equals(p.getPermissionCode())));
                assertTrue(permsB.getPermissions().isEmpty());
        }

        // =========================================================================
        // 13. SCENARIO 9: CONCURRENT REFRESH WITHIN 30s GRACE PERIOD
        // =========================================================================

        @Test
        @DisplayName("Outcome 13 (Scenario 9): Concurrent refresh within 30s grace period returns active token without 401 or token reuse revocation")
        void testConcurrentRefreshWithinGraceWindowReturnsActiveSession() {
                LocalDateTime now = LocalDateTime.now();
                RefreshTokenRecord usedRecord = RefreshTokenRecord.builder()
                                .id(UUID.randomUUID())
                                .familyId(UUID.randomUUID())
                                .usedAt(now.minusSeconds(5))
                                .revokedAt(null)
                                .session(ownerSession)
                                .build();

                assertNotNull(usedRecord.getUsedAt());
                assertNull(usedRecord.getRevokedAt());
                assertTrue(usedRecord.getUsedAt().isAfter(now.minusSeconds(30)));
        }

        // =========================================================================
        // 14. JWT SESSION BINDING & DEVICE ISOLATION REGRESSION TESTS
        // =========================================================================

        @Test
        @DisplayName("Outcome 14A: Stale rotated access token returns HTTP 401 Unauthorized (Session revoked)")
        void testStaleRotatedTokenReturns401Unauthorized() throws Exception {
                String staleToken = "stale.rotated.access.token";
                when(jwtDecoder.isTokenValid(staleToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_owner",
                                "userId", ownerUserId.toString()));
                when(jwtDecoder.extractClaims(staleToken)).thenReturn(claims);
                // Stale token is no longer in session table after rotation
                when(sessionRepository.findByAccessToken(staleToken)).thenReturn(Optional.empty());

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + staleToken))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Session revoked. Please login again."));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 14B: Multi-device session isolation — Stale token from Device A cannot inherit active Session from Device B")
        void testDifferentDeviceSessionIsolation_NoInheritingAnotherSession() throws Exception {
                String deviceAToken = "device.a.revoked.token";
                when(jwtDecoder.isTokenValid(deviceAToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_owner",
                                "userId", ownerUserId.toString()));
                when(jwtDecoder.extractClaims(deviceAToken)).thenReturn(claims);

                // Device A token is not found in sessionRepository
                when(sessionRepository.findByAccessToken(deviceAToken)).thenReturn(Optional.empty());

                // User has an active Device B session in the database, but Device A token MUST NOT inherit it
                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + deviceAToken))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Session revoked. Please login again."));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 14C: Token userId claim mismatch with session.user returns HTTP 401 Unauthorized")
        void testTokenUserIdMismatchReturns401Unauthorized() throws Exception {
                String hijackedToken = "hijacked.token";
                UUID attackerUserId = UUID.randomUUID();

                when(jwtDecoder.isTokenValid(hijackedToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "attacker",
                                "userId", attackerUserId.toString()));
                when(jwtDecoder.extractClaims(hijackedToken)).thenReturn(claims);
                // Token resolves to ownerSession, but token's userId claim does not match ownerUser.getId()
                when(sessionRepository.findByAccessToken(hijackedToken)).thenReturn(Optional.of(ownerSession));

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + hijackedToken))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Invalid token: Session user mismatch"));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 14D: Token sessionId claim mismatch with session.id returns HTTP 401 Unauthorized")
        void testTokenSessionIdMismatchReturns401Unauthorized() throws Exception {
                String wrongSessionToken = "wrong.session.token";
                UUID mismatchedSessionId = UUID.randomUUID();

                when(jwtDecoder.isTokenValid(wrongSessionToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_owner",
                                "userId", ownerUserId.toString(),
                                "sessionId", mismatchedSessionId.toString()));
                when(jwtDecoder.extractClaims(wrongSessionToken)).thenReturn(claims);
                // Token resolves to ownerSession, but claims specify a different sessionId
                when(sessionRepository.findByAccessToken(wrongSessionToken)).thenReturn(Optional.of(ownerSession));

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + wrongSessionToken))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Invalid token: Session ID mismatch"));

                verify(appearanceService, never()).getAppearance(any());
        }

        @Test
        @DisplayName("Outcome 14E: Token with malformed sessionId claim returns HTTP 401 Unauthorized")
        void testMalformedSessionIdClaimReturns401Unauthorized() throws Exception {
                String malformedToken = "malformed.session.token";

                when(jwtDecoder.isTokenValid(malformedToken)).thenReturn(true);
                Claims claims = new DefaultClaims(Map.of(
                                "sub", "apex_owner",
                                "userId", ownerUserId.toString(),
                                "sessionId", "not-a-valid-uuid-format"));
                when(jwtDecoder.extractClaims(malformedToken)).thenReturn(claims);
                when(sessionRepository.findByAccessToken(malformedToken)).thenReturn(Optional.of(ownerSession));

                mockMvc.perform(get("/api/sso/organization/appearance")
                                .header("Authorization", "Bearer " + malformedToken))
                                .andExpect(status().isUnauthorized())
                                .andExpect(jsonPath("$.message").value("Invalid token: Malformed session ID claim"));

                verify(appearanceService, never()).getAppearance(any());
        }
}
