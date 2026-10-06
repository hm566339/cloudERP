package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.dto.response.TokenResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GenericErpLoginFlowTest {

    // AuthService mocks
    @Mock
    private OrganizationResolverService organizationResolverService;
    @Mock
    private OrganizationMemberRepository organizationMemberRepository;
    @Mock
    private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock
    private SubscriptionRepository subscriptionRepository;
    @Mock
    private OrganizationModuleRepository organizationModuleRepository;
    @Mock
    private CompanyModuleRepository companyModuleRepository;
    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;
    @Mock
    private ModuleRepository moduleRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthorizationCodeRepository authorizationCodeRepository;
    @Mock
    private SessionRepository sessionRepository;
    @Mock
    private RefreshTokenRecordRepository refreshTokenRecordRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private JwtDecoder jwtDecoder;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PermissionService permissionService;

    @InjectMocks
    private AuthServiceImpl authService;

    private UserServiceImpl userService;

    private Organization mohitOrg;
    private Company company;
    private User testUser;
    private OrganizationMember activeMember;
    private MemberCompanyAccess companyAccess;
    private Subscription activeSub;
    private Module accountModule;
    private Module inventoryModule;
    private Module crmModule;

    @BeforeEach
    void setUp() {
        mohitOrg = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("mohit")
                .displayName("Mohit Org")
                .legalName("Mohit Enterprises")
                .status(OrganizationStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();

        company = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT01")
                .companyName("Mohit Tech")
                .organization(mohitOrg)
                .build();

        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("test@mark2.in")
                .email("test@mark2.in")
                .password("encoded_pass")
                .accountStatus(AccountStatus.ACTIVE)
                .emailStatus(Status.VERIFIED)
                .build();

        activeMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(mohitOrg)
                .user(testUser)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        companyAccess = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(activeMember)
                .company(company)
                .active(true)
                .build();

        activeSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(mohitOrg)
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .trialEndsAt(LocalDateTime.now().plusDays(14))
                .build();

        accountModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .clientId(UUID.randomUUID())
                .clientSecret("sec-acc")
                .moduleStatus(true)
                .host("https://www.mark2.in/api/account")
                .build();

        inventoryModule = Module.builder()
                .id(UUID.randomUUID())
                .name("INVENTORY")
                .clientId(UUID.randomUUID())
                .clientSecret("sec-inv")
                .moduleStatus(true)
                .host("https://www.mark2.in/api/inventory")
                .build();

        crmModule = Module.builder()
                .id(UUID.randomUUID())
                .name("CRM")
                .clientId(UUID.randomUUID())
                .clientSecret("sec-crm")
                .moduleStatus(true)
                .host("https://www.mark2.in/api/crm")
                .build();

        userService = new UserServiceImpl(
                userRepository,
                userMapper,
                passwordEncoder,
                null,
                null,
                jwtService,
                sessionRepository,
                null,
                moduleRepository,
                jwtDecoder,
                organizationMemberRepository,
                memberCompanyAccessRepository,
                subscriptionRepository,
                organizationModuleRepository,
                companyModuleRepository,
                userPortalAccessRepository,
                permissionService
        );

        when(organizationResolverService.resolveByCode("mohit")).thenReturn(mohitOrg);
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(mohitOrg.getId(), "test@mark2.in", MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeMember));
        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(mohitOrg.getId(), testUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(activeMember));
        when(passwordEncoder.matches("TestPass123@", "encoded_pass")).thenReturn(true);
        when(memberCompanyAccessRepository.findActiveForMember(activeMember.getId(), mohitOrg.getId()))
                .thenReturn(List.of(companyAccess));
        when(memberCompanyAccessRepository.findActiveCompany(activeMember.getId(), mohitOrg.getId(), company.getId()))
                .thenReturn(Optional.of(companyAccess));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(mohitOrg.getId()))
                .thenReturn(Optional.of(activeSub));
        when(userRepository.findByIdWithRoles(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.findByIdWithRolesAndPortalAccess(testUser.getId())).thenReturn(Optional.of(testUser));
    }

    private LoginRequest createGenericLoginRequest() {
        LoginRequest req = new LoginRequest();
        req.setOrganizationCode("mohit");
        req.setUsername("test@mark2.in");
        req.setPassword("TestPass123@");
        req.setHost("https://www.mark2.in/erp");
        return req;
    }

    // =========================================================================
    // TEST 1: Generic organization ERP login
    // =========================================================================
    @Test
    @DisplayName("TEST 1: Generic organization ERP login succeeds without 'Module not found' and without forced ACCOUNT")
    void test1_genericErpLogin_succeedsWithoutModule() {
        LoginRequest req = createGenericLoginRequest();

        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");

        assertNotNull(resp);
        assertEquals("mohit", resp.getOrganization().getCode());
        assertNotNull(resp.getRedirectUrl());
        assertTrue(resp.getRedirectUrl().contains("/auth/callback?code="));

        ArgumentCaptor<AuthorizationCode> codeCaptor = ArgumentCaptor.forClass(AuthorizationCode.class);
        verify(authorizationCodeRepository).save(codeCaptor.capture());
        AuthorizationCode savedCode = codeCaptor.getValue();

        assertNotNull(savedCode);
        assertNull(savedCode.getModule(), "Generic ERP login must NOT bind to a specific business module");
        assertEquals(mohitOrg, savedCode.getOrganization());
        assertEquals(company, savedCode.getCompany());
        assertEquals(testUser, savedCode.getUser());
    }

    // =========================================================================
    // TEST 2: Generic login with organization having ACCOUNT, INVENTORY, CRM
    // =========================================================================
    @Test
    @DisplayName("TEST 2: Generic login + /me exposes all entitled modules (ACCOUNT, INVENTORY, CRM)")
    void test2_genericLogin_tokenExchange_and_me_exposesAllEntitledModules() {
        AuthorizationCode code = AuthorizationCode.builder()
                .code("test-code-12345678")
                .organization(mohitOrg)
                .company(company)
                .user(testUser)
                .module(null) // Generic ERP
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(authorizationCodeRepository.findByCode("test-code-12345678")).thenReturn(Optional.of(code));
        when(jwtService.generateAccessToken(any(), any())).thenReturn("access-token-123");
        when(jwtService.generateRefreshToken(any(), any())).thenReturn("refresh-token-123");

        TokenResponse tokenResp = authService.exchangeCodeForToken("test-code-12345678", null, null);
        assertNotNull(tokenResp);
        assertEquals("access-token-123", tokenResp.getAccessToken());

        // Validate /me returns canonical context
        Session session = Session.builder()
                .accessToken("access-token-123")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .user(testUser)
                .company(company)
                .organization(mohitOrg)
                .module(null)
                .build();
        when(sessionRepository.findByAccessToken("access-token-123")).thenReturn(Optional.of(session));
        when(jwtDecoder.isTokenValid("access-token-123")).thenReturn(true);
        when(jwtDecoder.extractUserId("access-token-123")).thenReturn(testUser.getId());

        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(accountModule).active(true).build();
        CompanyModule cmInv = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(inventoryModule).active(true).build();
        CompanyModule cmCrm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(crmModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())).thenReturn(List.of(cmAcc, cmInv, cmCrm));
        when(userPortalAccessRepository.findAllByUser_Id(testUser.getId())).thenReturn(List.of());

        SsoMeResponse me = userService.getSsoMe("access-token-123");
        assertNotNull(me);
        assertEquals("mohit", me.getOrganization().getCode());
        assertEquals(3, me.getModules().size());
        List<String> moduleNames = me.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("CRM"));
    }

    // =========================================================================
    // TEST 3: Organization having only INVENTORY, CRM
    // =========================================================================
    @Test
    @DisplayName("TEST 3: Organization having only INVENTORY, CRM succeeds, ACCOUNT not required")
    void test3_organizationWithOnlyInventoryAndCrm_succeeds() {
        LoginRequest req = createGenericLoginRequest();
        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        Session session = Session.builder()
                .accessToken("access-token-inv-crm")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .user(testUser)
                .company(company)
                .organization(mohitOrg)
                .module(null)
                .build();
        when(sessionRepository.findByAccessToken("access-token-inv-crm")).thenReturn(Optional.of(session));
        when(jwtDecoder.isTokenValid("access-token-inv-crm")).thenReturn(true);
        when(jwtDecoder.extractUserId("access-token-inv-crm")).thenReturn(testUser.getId());

        CompanyModule cmInv = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(inventoryModule).active(true).build();
        CompanyModule cmCrm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(crmModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())).thenReturn(List.of(cmInv, cmCrm));

        SsoMeResponse me = userService.getSsoMe("access-token-inv-crm");
        assertNotNull(me);
        assertEquals(2, me.getModules().size());
        List<String> moduleNames = me.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("CRM"));
        assertFalse(moduleNames.contains("ACCOUNT"), "ACCOUNT must not be present if not provisioned");
    }

    // =========================================================================
    // TEST 4: Organization having only CRM
    // =========================================================================
    @Test
    @DisplayName("TEST 4: Organization having only CRM succeeds and CRM exposed in /me")
    void test4_organizationWithOnlyCrm_succeeds() {
        LoginRequest req = createGenericLoginRequest();
        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        Session session = Session.builder()
                .accessToken("access-token-crm-only")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .user(testUser)
                .company(company)
                .organization(mohitOrg)
                .module(null)
                .build();
        when(sessionRepository.findByAccessToken("access-token-crm-only")).thenReturn(Optional.of(session));
        when(jwtDecoder.isTokenValid("access-token-crm-only")).thenReturn(true);
        when(jwtDecoder.extractUserId("access-token-crm-only")).thenReturn(testUser.getId());

        CompanyModule cmCrm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(crmModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())).thenReturn(List.of(cmCrm));

        SsoMeResponse me = userService.getSsoMe("access-token-crm-only");
        assertNotNull(me);
        assertEquals(1, me.getModules().size());
        assertEquals("CRM", me.getModules().get(0).getName());
    }

    // =========================================================================
    // TEST 5: Organization with zero entitled business modules
    // =========================================================================
    @Test
    @DisplayName("TEST 5: Organization with zero entitled business modules returns 0 modules in /me (no accidental grant)")
    void test5_organizationWithZeroEntitledModules_noAccidentalGrant() {
        LoginRequest req = createGenericLoginRequest();
        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        Session session = Session.builder()
                .accessToken("access-token-no-modules")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .user(testUser)
                .company(company)
                .organization(mohitOrg)
                .module(null)
                .build();
        when(sessionRepository.findByAccessToken("access-token-no-modules")).thenReturn(Optional.of(session));
        when(jwtDecoder.isTokenValid("access-token-no-modules")).thenReturn(true);
        when(jwtDecoder.extractUserId("access-token-no-modules")).thenReturn(testUser.getId());

        when(companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())).thenReturn(List.of());

        SsoMeResponse me = userService.getSsoMe("access-token-no-modules");
        assertNotNull(me);
        assertTrue(me.getModules().isEmpty(), "Must not accidentally grant access to any business module");
    }

    // =========================================================================
    // TEST 6: Explicit ACCOUNT login
    // =========================================================================
    @Test
    @DisplayName("TEST 6: Explicit ACCOUNT login resolves ACCOUNT normally")
    void test6_explicitAccountLogin_resolvesAccount() {
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), accountModule.getId())).thenReturn(true);
        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(accountModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), accountModule.getId())).thenReturn(Optional.of(cmAcc));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(testUser.getId(), cmAcc.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(testUser).companyModule(cmAcc).status(true).build()));

        LoginRequest req = createGenericLoginRequest();
        req.setModuleCode("ACCOUNT");

        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        ArgumentCaptor<AuthorizationCode> codeCaptor = ArgumentCaptor.forClass(AuthorizationCode.class);
        verify(authorizationCodeRepository).save(codeCaptor.capture());
        assertEquals("ACCOUNT", codeCaptor.getValue().getModule().getName());
    }

    // =========================================================================
    // TEST 7: Explicit INVENTORY login
    // =========================================================================
    @Test
    @DisplayName("TEST 7: Explicit INVENTORY login resolves INVENTORY normally")
    void test7_explicitInventoryLogin_resolvesInventory() {
        when(moduleRepository.findByNameIgnoreCase("INVENTORY")).thenReturn(Optional.of(inventoryModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), inventoryModule.getId())).thenReturn(true);
        CompanyModule cmInv = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(inventoryModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), inventoryModule.getId())).thenReturn(Optional.of(cmInv));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(testUser.getId(), cmInv.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(testUser).companyModule(cmInv).status(true).build()));

        LoginRequest req = createGenericLoginRequest();
        req.setModuleCode("INVENTORY");

        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        ArgumentCaptor<AuthorizationCode> codeCaptor = ArgumentCaptor.forClass(AuthorizationCode.class);
        verify(authorizationCodeRepository).save(codeCaptor.capture());
        assertEquals("INVENTORY", codeCaptor.getValue().getModule().getName());
    }

    // =========================================================================
    // TEST 8: Explicit CRM login
    // =========================================================================
    @Test
    @DisplayName("TEST 8: Explicit CRM login resolves CRM normally")
    void test8_explicitCrmLogin_resolvesCrm() {
        when(moduleRepository.findByNameIgnoreCase("CRM")).thenReturn(Optional.of(crmModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), crmModule.getId())).thenReturn(true);
        CompanyModule cmCrm = CompanyModule.builder().id(UUID.randomUUID()).company(company).module(crmModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(company.getId(), crmModule.getId())).thenReturn(Optional.of(cmCrm));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(testUser.getId(), cmCrm.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(testUser).companyModule(cmCrm).status(true).build()));

        LoginRequest req = createGenericLoginRequest();
        req.setModuleCode("CRM");

        LoginResponse resp = authService.login(req, "127.0.0.1", "agent");
        assertNotNull(resp);

        ArgumentCaptor<AuthorizationCode> codeCaptor = ArgumentCaptor.forClass(AuthorizationCode.class);
        verify(authorizationCodeRepository).save(codeCaptor.capture());
        assertEquals("CRM", codeCaptor.getValue().getModule().getName());
    }

    // =========================================================================
    // TEST 9: Invalid explicit module
    // =========================================================================
    @Test
    @DisplayName("TEST 9: Invalid explicit module throws ResourceNotFoundException('Module not found')")
    void test9_invalidExplicitModule_throwsModuleNotFound() {
        when(moduleRepository.findByNameIgnoreCase("SOMETHING_INVALID")).thenReturn(Optional.empty());

        LoginRequest req = createGenericLoginRequest();
        req.setModuleCode("SOMETHING_INVALID");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                authService.login(req, "127.0.0.1", "agent")
        );
        assertEquals("Module not found", ex.getMessage());
    }

    // =========================================================================
    // TEST 10: Wrong organization code
    // =========================================================================
    @Test
    @DisplayName("TEST 10: Wrong organization code fails with Organization not found")
    void test10_wrongOrganizationCode_fails() {
        when(organizationResolverService.resolveByCode("wrong-org"))
                .thenThrow(new ResourceNotFoundException("Organization not found"));

        LoginRequest req = createGenericLoginRequest();
        req.setOrganizationCode("wrong-org");

        assertThrows(ResourceNotFoundException.class, () ->
                authService.login(req, "127.0.0.1", "agent")
        );
    }

    // =========================================================================
    // TEST 11: Wrong password
    // =========================================================================
    @Test
    @DisplayName("TEST 11: Wrong password fails with BadCredentialsException")
    void test11_wrongPassword_fails() {
        when(passwordEncoder.matches("WrongPass@", "encoded_pass")).thenReturn(false);

        LoginRequest req = createGenericLoginRequest();
        req.setPassword("WrongPass@");

        assertThrows(BadCredentialsException.class, () ->
                authService.login(req, "127.0.0.1", "agent")
        );
    }

    // =========================================================================
    // TEST 12: Inactive organization membership
    // =========================================================================
    @Test
    @DisplayName("TEST 12: Inactive organization membership fails")
    void test12_inactiveMembership_fails() {
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(mohitOrg.getId(), "test@mark2.in", MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        LoginRequest req = createGenericLoginRequest();

        assertThrows(BadCredentialsException.class, () ->
                authService.login(req, "127.0.0.1", "agent")
        );
    }

    // =========================================================================
    // TEST 13: User without company access
    // =========================================================================
    @Test
    @DisplayName("TEST 13: User without company access fails")
    void test13_userWithoutCompanyAccess_fails() {
        when(memberCompanyAccessRepository.findActiveForMember(activeMember.getId(), mohitOrg.getId()))
                .thenReturn(List.of());

        LoginRequest req = createGenericLoginRequest();

        assertThrows(BadCredentialsException.class, () ->
                authService.login(req, "127.0.0.1", "agent")
        );
    }

    // =========================================================================
    // TEST 14: Expired subscription / READ_ONLY organization
    // =========================================================================
    @Test
    @DisplayName("TEST 14: Expired subscription preserves READ_ONLY accessMode in /me")
    void test14_expiredSubscription_preservesReadOnlyBehavior() {
        Subscription expiredSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(mohitOrg)
                .status(SubscriptionStatus.EXPIRED)
                .accessMode(AccessMode.READ_ONLY)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(mohitOrg.getId()))
                .thenReturn(Optional.of(expiredSub));

        Session session = Session.builder()
                .accessToken("access-token-expired-sub")
                .accessTokenValidTill(LocalDateTime.now().plusMinutes(15))
                .user(testUser)
                .company(company)
                .organization(mohitOrg)
                .module(null)
                .build();
        when(sessionRepository.findByAccessToken("access-token-expired-sub")).thenReturn(Optional.of(session));
        when(jwtDecoder.isTokenValid("access-token-expired-sub")).thenReturn(true);
        when(jwtDecoder.extractUserId("access-token-expired-sub")).thenReturn(testUser.getId());
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(company.getId())).thenReturn(List.of());

        SsoMeResponse me = userService.getSsoMe("access-token-expired-sub");
        assertNotNull(me);
        assertEquals(AccessMode.READ_ONLY, me.getSubscription().getAccessMode());
    }

    // =========================================================================
    // TEST 15: Authorization code replay
    // =========================================================================
    @Test
    @DisplayName("TEST 15: Authorization code replay fails with BadCredentialsException")
    void test15_authorizationCodeReplay_fails() {
        AuthorizationCode usedCode = AuthorizationCode.builder()
                .code("already-used-code")
                .organization(mohitOrg)
                .company(company)
                .user(testUser)
                .module(null)
                .used(true) // ALREADY USED
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(authorizationCodeRepository.findByCode("already-used-code")).thenReturn(Optional.of(usedCode));

        assertThrows(BadCredentialsException.class, () ->
                authService.exchangeCodeForToken("already-used-code", null, null)
        );
    }

    // =========================================================================
    // TEST 16: Invalid client / module mismatch
    // =========================================================================
    @Test
    @DisplayName("TEST 16: Module mismatch during token exchange fails with BadCredentialsException")
    void test16_moduleMismatch_fails() {
        Module requestedModule = Module.builder()
                .id(UUID.randomUUID())
                .name("OTHER_MODULE")
                .clientId(UUID.randomUUID())
                .build();
        when(moduleRepository.findByClientId(requestedModule.getClientId())).thenReturn(Optional.of(requestedModule));

        AuthorizationCode codeForAccount = AuthorizationCode.builder()
                .code("account-bound-code")
                .organization(mohitOrg)
                .company(company)
                .user(testUser)
                .module(accountModule)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(authorizationCodeRepository.findByCode("account-bound-code")).thenReturn(Optional.of(codeForAccount));

        assertThrows(BadCredentialsException.class, () ->
                authService.exchangeCodeForToken("account-bound-code", requestedModule.getClientId().toString(), null)
        );
    }

    // =========================================================================
    // TEST 17: Cross-organization access
    // =========================================================================
    @Test
    @DisplayName("TEST 17: Cross-organization access fails when membership revoked or company outside org")
    void test17_crossOrganizationAccess_fails() {
        Organization foreignOrg = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("other-org")
                .build();
        Company foreignCompany = Company.builder()
                .id(UUID.randomUUID())
                .organization(foreignOrg)
                .build();

        AuthorizationCode crossCode = AuthorizationCode.builder()
                .code("cross-org-code-12345")
                .organization(mohitOrg)
                .company(foreignCompany) // Mismatched company
                .user(testUser)
                .module(null)
                .used(false)
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .build();
        when(authorizationCodeRepository.findByCode("cross-org-code-12345")).thenReturn(Optional.of(crossCode));
        when(memberCompanyAccessRepository.findActiveCompany(activeMember.getId(), mohitOrg.getId(), foreignCompany.getId()))
                .thenReturn(Optional.empty()); // No access to company in org!

        assertThrows(BadCredentialsException.class, () ->
                authService.exchangeCodeForToken("cross-org-code-12345", null, null)
        );
    }
}
