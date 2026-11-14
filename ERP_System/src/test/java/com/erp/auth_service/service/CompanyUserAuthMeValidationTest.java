package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.AuthorizationCodeMapper;
import com.erp.auth_service.mapper.SsoSessionMapper;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.repository.platform.PlatformAdminRepository;
import com.erp.auth_service.repository.platform.SupportAccessSessionRepository;
import com.erp.auth_service.security.CustomUserDetailsService;
import com.erp.auth_service.security.JwtAuthenticationFilter;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.*;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.impl.DefaultClaims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CompanyUserAuthMeValidationTest {

    // Common Mocks
    @Mock
    private UserRepository userRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private AuthorizationCodeRepository authorizationCodeRepository;
    @Mock
    private AuthorizationCodeMapper authorizationCodeMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private JwtDecoder jwtDecoder;
    @Mock
    private EmailService emailService;
    @Mock
    private UserTokenRepository userTokenRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private SsoSessionMapper ssoSessionMapper;
    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;
    @Mock
    private UserRoleRepository userRoleRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private CompanyModuleRepository companyModuleRepository;
    @Mock
    private PermissionService permissionService;
    @Mock
    private OrganizationResolverService organizationResolverService;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private OrganizationModuleRepository organizationModuleRepository;
    @Mock
    private CompanySubscriptionRepository companySubscriptionRepository;
    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock
    private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    @Mock
    private CustomUserDetailsService userDetailsService;
    @Mock
    private PlatformAdminRepository platformAdminRepository;
    @Mock
    private SupportAccessSessionRepository supportAccessSessionRepository;
    @Mock
    private FilterChain filterChain;

    private UserServiceImpl userService;
    private AuthServiceImpl authService;
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private UUID userId;
    private UUID companyId;
    private UUID organizationId;
    private Organization testOrg;
    private Company testCompany;
    private User testUser;
    private OrganizationMember testMember;
    private MemberCompanyAccess testAccess;
    private Session testSession;
    private String token;
    private Module testModule;
    private CompanyModule testCompanyModule;
    private UserPortalAccess testPortalAccess;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

        userId = UUID.fromString("25c11bbb-c13d-453e-8e4c-03ee987d28dc");
        companyId = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
        organizationId = UUID.fromString("5529d8af-d97a-42e9-b2c4-41b3a294ec87");
        token = "valid.jwt.test.token";

        testOrg = Organization.builder()
                .id(organizationId)
                .organizationCode("mohit")
                .displayName("Mohit Org")
                .legalName("Mohit Legal")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .timezone("UTC")
                .currency("INR")
                .build();

        testCompany = Company.builder()
                .id(companyId)
                .companyCode("MOHIT")
                .companyName("Mohit")
                .legalName("Mohit Technologies Pvt Ltd")
                .active(true)
                .organization(testOrg)
                .build();

        testUser = User.builder()
                .id(userId)
                .username("john_mohit")
                .email("john@mohit.com")
                .fullName("John Mohit")
                .password("$2a$10$hashedPassword")
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .failedLoginCount(0)
                .company(testCompany)
                .userRoles(new ArrayList<>())
                .build();

        testMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(testUser)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        testAccess = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(testMember)
                .organization(testOrg)
                .company(testCompany)
                .active(true)
                .build();

        testSession = Session.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .company(testCompany)
                .organization(testOrg)
                .accessToken(token)
                .accessTokenValidTill(LocalDateTime.now().plusHours(1))
                .build();

        testModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .host("https://www.mark2.in/erp/accounts")
                .moduleStatus(true)
                .build();

        testCompanyModule = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(testCompany)
                .module(testModule)
                .active(true)
                .build();

        testPortalAccess = UserPortalAccess.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .companyModule(testCompanyModule)
                .status(true)
                .build();

        // Instantiate UserServiceImpl
        userService = new UserServiceImpl(
                userRepository,
                userMapper,
                passwordEncoder,
                userTokenRepository,
                emailService,
                jwtService,
                sessionRepository,
                companyRepository,
                moduleRepository,
                jwtDecoder,
                organizationMemberRepository,
                memberCompanyAccessRepository,
                subscriptionRepository,
                organizationModuleRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                companySubscriptionRepository,
                subscriptionPlanRepository,
                subscriptionPlanModuleRepository,
                roleRepository,
                permissionService
        );

        // Instantiate AuthServiceImpl
        authService = new AuthServiceImpl(
                userRepository,
                moduleRepository,
                sessionRepository,
                authorizationCodeRepository,
                authorizationCodeMapper,
                passwordEncoder,
                jwtService,
                jwtDecoder,
                emailService,
                userTokenRepository,
                userMapper,
                ssoSessionMapper,
                userPortalAccessRepository,
                userRoleRepository,
                roleRepository,
                companyRepository,
                companyModuleRepository,
                permissionService,
                organizationResolverService,
                organizationMemberRepository,
                memberCompanyAccessRepository,
                subscriptionRepository,
                refreshTokenRecordRepository,
                organizationModuleRepository
        );

        // Instantiate JwtAuthenticationFilter
        jwtAuthenticationFilter = new JwtAuthenticationFilter(
                jwtDecoder,
                userDetailsService,
                sessionRepository,
                organizationMemberRepository,
                memberCompanyAccessRepository,
                platformAdminRepository,
                supportAccessSessionRepository
        );

        // Common mock stubbing for token & session lookup
        when(jwtDecoder.isTokenValid(token)).thenReturn(true);
        when(jwtDecoder.extractUserId(token)).thenReturn(userId);
        when(jwtDecoder.extractUsername(token)).thenReturn(testUser.getUsername());
        when(jwtDecoder.isTokenValid(token, testUser.getUsername())).thenReturn(true);
        Claims defaultClaims = new DefaultClaims(Map.of(
                "sub", testUser.getUsername(),
                "userId", userId.toString(),
                "companyCode", "MOHIT",
                "organizationId", organizationId.toString()
        ));
        when(jwtDecoder.extractClaims(token)).thenReturn(defaultClaims);
        when(sessionRepository.findByAccessToken(token)).thenReturn(Optional.of(testSession));
        when(userRepository.findByIdWithRolesAndPortalAccess(userId)).thenReturn(Optional.of(testUser));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyRepository.findByCompanyCode("MOHIT")).thenReturn(Optional.of(testCompany));
        when(companyRepository.findByCompanyCode("mohit")).thenReturn(Optional.of(testCompany));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organizationId, userId, MembershipStatus.ACTIVE)).thenReturn(Optional.of(testMember));
        when(memberCompanyAccessRepository.findActiveForMember(testMember.getId(), organizationId))
                .thenReturn(List.of(testAccess));
        when(memberCompanyAccessRepository.findActiveCompany(testMember.getId(), organizationId, companyId))
                .thenReturn(Optional.of(testAccess));
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                testMember.getId(), companyId)).thenReturn(true);
        when(userPortalAccessRepository.findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(testUser.getId()))
                .thenReturn(Optional.of(testPortalAccess));
        when(sessionRepository.countUserActiveSessions(eq(testUser.getId()), any(LocalDateTime.class)))
                .thenReturn(0);
        when(permissionService.getEffectivePermissions(eq(userId), any())).thenReturn(
                EffectivePermissionsResponse.builder()
                        .userId(userId)
                        .roles(Collections.emptyList())
                        .features(Collections.emptyList())
                        .permissions(Collections.emptyList())
                        .build()
        );
    }

    // =========================================================================
    // 1. /api/sso/auth/me?companyId=MOHIT (Uppercase Company Code)
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Resolves uppercase company code 'MOHIT' case-insensitively and returns success")
    void authMe_UppercaseCompanyCode_ResolvesSuccessfully() {
        SsoMeResponse response = userService.getSsoMe(token, "MOHIT");

        assertNotNull(response);
        assertEquals(userId, response.getUser().getId());
        assertEquals("Mohit Org", response.getOrganization().getName());
        assertEquals(companyId, response.getCurrentCompany().getId());
        assertEquals("MOHIT", response.getCurrentCompany().getCode());
        assertFalse(response.getRoles().isEmpty());
        assertEquals("MEMBER", response.getRoles().get(0).getName());
    }

    // =========================================================================
    // 2. /api/sso/auth/me?companyId=mohit (Lowercase Company Code)
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Resolves lowercase company code 'mohit' to the exact same company")
    void authMe_LowercaseCompanyCode_ResolvesSuccessfully() {
        SsoMeResponse response = userService.getSsoMe(token, "mohit");

        assertNotNull(response);
        assertEquals(userId, response.getUser().getId());
        assertEquals(companyId, response.getCurrentCompany().getId());
        assertEquals("MOHIT", response.getCurrentCompany().getCode());
        assertEquals("Mohit", response.getCurrentCompany().getName());
    }

    // =========================================================================
    // 3. /api/sso/auth/me?companyId={companyUUID} (Valid UUID)
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Resolves explicit company UUID successfully")
    void authMe_CompanyUUID_ResolvesSuccessfully() {
        SsoMeResponse response = userService.getSsoMe(token, companyId.toString());

        assertNotNull(response);
        assertEquals(companyId, response.getCurrentCompany().getId());
        assertEquals("MOHIT", response.getCurrentCompany().getCode());
        assertEquals(organizationId, response.getOrganization().getId());
    }

    // =========================================================================
    // 4. Missing / Empty roles fallback to legitimate MEMBER role
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Users without explicit granular roles receive legitimate MEMBER role")
    void authMe_MissingUserRoles_PopulatesMemberRole() {
        testUser.setUserRoles(new ArrayList<>());

        SsoMeResponse response = userService.getSsoMe(token, "MOHIT");

        assertNotNull(response.getRoles());
        assertFalse(response.getRoles().isEmpty(), "Roles should never be empty for legitimate users");
        assertEquals("MEMBER", response.getRoles().get(0).getName());
    }

    // =========================================================================
    // 5. Unknown company code throws 404 ResourceNotFoundException
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Unknown company code throws 404 ResourceNotFoundException")
    void authMe_UnknownCompanyCode_Throws404() {
        when(companyRepository.findByCompanyCode("UNKNOWN")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getSsoMe(token, "UNKNOWN");
        });
    }

    // =========================================================================
    // 6. Unknown company UUID throws 404 ResourceNotFoundException
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Unknown company UUID throws 404 ResourceNotFoundException")
    void authMe_UnknownCompanyUuid_Throws404() {
        UUID unknownUuid = UUID.randomUUID();
        when(companyRepository.findById(unknownUuid)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getSsoMe(token, unknownUuid.toString());
        });
    }

    // =========================================================================
    // 7. Company belonging to different organization throws 403 Forbidden
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: Company from foreign organization throws 403 ForbiddenException")
    void authMe_ForeignOrganizationCompany_Throws403() {
        Organization foreignOrg = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("foreign")
                .displayName("Foreign Org")
                .legalName("Foreign Legal")
                .status(OrganizationStatus.ACTIVE)
                .build();
        Company foreignCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("FOREIGN")
                .companyName("Foreign Company")
                .active(true)
                .organization(foreignOrg)
                .build();

        when(companyRepository.findById(foreignCompany.getId())).thenReturn(Optional.of(foreignCompany));

        assertThrows(ForbiddenException.class, () -> {
            userService.getSsoMe(token, foreignCompany.getId().toString());
        });
    }

    // =========================================================================
    // 8. User lacks access to requested company in same org throws 403 Forbidden
    // =========================================================================
    @Test
    @DisplayName("SSO /auth/me: User lacks access to requested company in same org throws 403 ForbiddenException")
    void authMe_NoAccessToCompany_Throws403() {
        Company unauthorizedCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("UNAUTHORIZED")
                .companyName("Unauthorized Company")
                .active(true)
                .organization(testOrg)
                .build();

        when(companyRepository.findById(unauthorizedCompany.getId())).thenReturn(Optional.of(unauthorizedCompany));

        assertThrows(ForbiddenException.class, () -> {
            userService.getSsoMe(token, unauthorizedCompany.getId().toString());
        });
    }

    // =========================================================================
    // 9. JwtAuthenticationFilter: Active member and company access passes
    // =========================================================================
    @Test
    @DisplayName("Filter: Active company member passes authentication filter without 403")
    void jwtFilter_ActiveCompanyUser_PassesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        Claims claims = new DefaultClaims(Map.of(
                "sub", testUser.getUsername(),
                "userId", userId.toString(),
                "companyCode", "MOHIT",
                "organizationId", organizationId.toString()
        ));
        when(jwtDecoder.extractClaims(token)).thenReturn(claims);
        when(jwtDecoder.extractUsername(token)).thenReturn(testUser.getUsername());
        when(jwtDecoder.isTokenValid(token, testUser.getUsername())).thenReturn(true);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNotEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
    }

    // =========================================================================
    // 10. JwtAuthenticationFilter: Genuinely revoked organization membership returns 403
    // =========================================================================
    @Test
    @DisplayName("Filter: Genuinely revoked organization membership returns 403 'Organization or company access revoked'")
    void jwtFilter_RevokedOrgMembership_Returns403Revoked() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        // Genuinely revoked membership returns empty
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organizationId, userId, MembershipStatus.ACTIVE)).thenReturn(Optional.empty());

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString().contains("Organization or company access revoked"));
        verifyNoInteractions(filterChain);
    }

    // =========================================================================
    // 11. JwtAuthenticationFilter: Genuinely revoked company access returns 403
    // =========================================================================
    @Test
    @DisplayName("Filter: Genuinely revoked company access returns 403 'Organization or company access revoked'")
    void jwtFilter_RevokedCompanyAccess_Returns403Revoked() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(
                organizationId, userId, MembershipStatus.ACTIVE)).thenReturn(Optional.of(testMember));
        // Revoked company access
        when(memberCompanyAccessRepository.existsByOrganizationMember_IdAndCompany_IdAndActiveTrue(
                testMember.getId(), companyId)).thenReturn(false);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString().contains("Organization or company access revoked"));
        verifyNoInteractions(filterChain);
    }

    // =========================================================================
    // 12. JwtAuthenticationFilter: Blocked organization returns 403
    // =========================================================================
    @Test
    @DisplayName("Filter: Blocked organization access returns 403 'Organization access is blocked'")
    void jwtFilter_BlockedOrganization_Returns403Blocked() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath("/api/sso/auth/me");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();

        testOrg.setAccessMode(AccessMode.BLOCKED);

        jwtAuthenticationFilter.doFilter(request, response, filterChain);

        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertTrue(response.getContentAsString().contains("Organization access is blocked"));
        verifyNoInteractions(filterChain);
    }

    // =========================================================================
    // 13. Login generates JWT claims containing companyId, companyCode, orgId, orgCode, roles
    // =========================================================================
    @Test
    @DisplayName("Login: Generates JWT claims with companyId, companyCode, organizationId, organizationCode, and roles")
    void login_GeneratesConsistentJwtClaims() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCompanyCode("mohit");
        loginRequest.setUsername("john_mohit");
        loginRequest.setPassword("correctPassword");

        when(passwordEncoder.matches("correctPassword", testUser.getPassword())).thenReturn(true);
        when(userRepository.findUsersWithRolesByCompany(eq(companyId), anyString())).thenReturn(List.of(testUser));
        when(jwtService.generateAccessToken(eq("john_mohit"), any(), anyLong())).thenReturn("generated.jwt.token");
        when(jwtService.generateAccessToken(eq("john_mohit"), any())).thenReturn("generated.jwt.token");
        when(jwtService.generateRefreshToken(eq("john_mohit"), eq("MOHIT"))).thenReturn("refresh.token");

        LoginResponse response = authService.login(loginRequest, "127.0.0.1", "TestAgent");

        assertNotNull(response);
        assertEquals("generated.jwt.token", response.getAccessToken());

        // Capture claims passed to jwtService.generateAccessToken
        ArgumentCaptor<Map<String, Object>> claimsCaptor = ArgumentCaptor.forClass(Map.class);
        verify(jwtService).generateAccessToken(eq("john_mohit"), claimsCaptor.capture(), anyLong());

        Map<String, Object> claims = claimsCaptor.getValue();
        assertEquals(companyId.toString(), claims.get("companyId"), "companyId claim must match company UUID");
        assertEquals("MOHIT", claims.get("companyCode"), "companyCode claim must match database field");
        assertEquals(organizationId.toString(), claims.get("organizationId"), "organizationId claim must match org UUID");
        assertEquals("mohit", claims.get("organizationCode"), "organizationCode claim must match org code");

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.get("roles");
        assertNotNull(roles);
        assertFalse(roles.isEmpty(), "roles array in JWT claims must not be empty");
        assertTrue(roles.contains("MEMBER"), "roles must contain legitimate MEMBER role");
    }

    // =========================================================================
    // 14. Genuinely revoked/suspended member access is preserved and never auto-reactivated
    // =========================================================================
    @Test
    @DisplayName("Login: Genuinely suspended member access is preserved and NOT auto-reactivated")
    void login_PreservesSuspendedMembershipRevocation() {
        OrganizationMember suspendedMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(testUser)
                .membershipStatus(MembershipStatus.SUSPENDED)
                .build();

        when(organizationMemberRepository.findByOrganization_IdAndUser_Id(organizationId, userId))
                .thenReturn(Optional.of(suspendedMember));

        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setCompanyCode("MOHIT");
        loginRequest.setUsername("john_mohit");
        loginRequest.setPassword("correctPassword");

        when(passwordEncoder.matches("correctPassword", testUser.getPassword())).thenReturn(true);
        when(userRepository.findUsersWithRolesByCompany(eq(companyId), anyString())).thenReturn(List.of(testUser));
        when(jwtService.generateAccessToken(eq("john_mohit"), any())).thenReturn("generated.jwt.token");
        when(jwtService.generateRefreshToken(eq("john_mohit"), eq("MOHIT"))).thenReturn("refresh.token");

        authService.login(loginRequest, "127.0.0.1", "TestAgent");

        // Verify suspendedMember was NEVER saved with ACTIVE status or modified
        verify(organizationMemberRepository, never()).save(argThat(m -> m.getMembershipStatus() == MembershipStatus.ACTIVE));
    }
}
