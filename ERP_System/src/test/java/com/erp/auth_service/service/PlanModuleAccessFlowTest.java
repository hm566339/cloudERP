package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.mapper.UserMapper;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.security.JwtService;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlanModuleAccessFlowTest {

    @Mock private UserRepository userRepository;
    @Mock private UserMapper userMapper;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserTokenRepository userTokenRepository;
    @Mock private EmailService emailService;
    @Mock private JwtService jwtService;
    @Mock private SessionRepository sessionRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private JwtDecoder jwtDecoder;
    @Mock private OrganizationMemberRepository organizationMemberRepository;
    @Mock private MemberCompanyAccessRepository memberCompanyAccessRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private OrganizationModuleRepository organizationModuleRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private UserPortalAccessRepository userPortalAccessRepository;
    @Mock private CompanySubscriptionRepository companySubscriptionRepository;
    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private PermissionService permissionService;

    @InjectMocks
    private UserServiceImpl userService;

    private Organization testOrg;
    private Company companyA;
    private Company companyB;
    private User ownerUser;
    private User employeeUser;
    private OrganizationMember ownerMember;
    private OrganizationMember employeeMember;

    private Module accountModule;
    private Module crmModule;
    private Module inventoryModule;
    private Module workflowModule;

    private SubscriptionPlan trialPlan;
    private SubscriptionPlan basicPlan;
    private SubscriptionPlan proPlan;
    private SubscriptionPlan enterprisePlan;

    @BeforeEach
    void setUp() {
        testOrg = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("TEST_ORG")
                .displayName("Test Organization")
                .accessMode(AccessMode.FULL)
                .build();

        companyA = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP_A")
                .companyName("Company Alpha")
                .organization(testOrg)
                .active(true)
                .build();

        companyB = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP_B")
                .companyName("Company Beta")
                .organization(testOrg)
                .active(true)
                .build();

        ownerUser = User.builder()
                .id(UUID.randomUUID())
                .username("owner@company.com")
                .email("owner@company.com")
                .fullName("Company Owner")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        employeeUser = User.builder()
                .id(UUID.randomUUID())
                .username("employee@company.com")
                .email("employee@company.com")
                .fullName("Regular Employee")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        ownerMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(ownerUser)
                .memberType(MemberType.OWNER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        employeeMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .user(employeeUser)
                .memberType(MemberType.MEMBER)
                .membershipStatus(MembershipStatus.ACTIVE)
                .joinedAt(LocalDateTime.now())
                .build();

        accountModule = Module.builder().id(UUID.randomUUID()).name("ACCOUNT").moduleStatus(true).host("/accounts").build();
        crmModule = Module.builder().id(UUID.randomUUID()).name("CRM").moduleStatus(true).host("/crm").build();
        inventoryModule = Module.builder().id(UUID.randomUUID()).name("INVENTORY").moduleStatus(true).host("/inventory").build();
        workflowModule = Module.builder().id(UUID.randomUUID()).name("WORKFLOW").moduleStatus(true).host("/workflows").build();

        trialPlan = SubscriptionPlan.builder().id(UUID.randomUUID()).code("30_DAY_FREE_TRIAL").name("Trial").active(true).build();
        basicPlan = SubscriptionPlan.builder().id(UUID.randomUUID()).code("BASIC").name("Basic").active(true).build();
        proPlan = SubscriptionPlan.builder().id(UUID.randomUUID()).code("PRO").name("Pro").active(true).build();
        enterprisePlan = SubscriptionPlan.builder().id(UUID.randomUUID()).code("ENTERPRISE").name("Enterprise").active(true).build();

        when(companyRepository.findById(companyA.getId())).thenReturn(Optional.of(companyA));
        when(companyRepository.findById(companyB.getId())).thenReturn(Optional.of(companyB));
    }

    private Session mockSession(User user, Company company) {
        String token = "test-token-" + user.getId();
        Session session = Session.builder()
                .accessToken(token)
                .accessTokenValidTill(LocalDateTime.now().plusHours(1))
                .user(user)
                .company(company)
                .organization(testOrg)
                .build();

        when(jwtDecoder.isTokenValid(token)).thenReturn(true);
        when(jwtDecoder.extractUserId(token)).thenReturn(user.getId());
        when(sessionRepository.findByAccessToken(token)).thenReturn(Optional.of(session));
        when(userRepository.findByIdWithRolesAndPortalAccess(user.getId())).thenReturn(Optional.of(user));
        return session;
    }

    // =========================================================================
    // SCENARIO 1: Trial plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW
    // =========================================================================
    @Test
    @DisplayName("Scenario 1: Trial plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW -> Owner effective modules contain all 4")
    void testScenario1_trialPlan_ownerGetsAllFourModules() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(trialPlan)
                .planCode(trialPlan.getCode())
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .trialEndsAt(LocalDateTime.now().plusDays(28))
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));

        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(trialPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(trialPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(crmModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(workflowModule).active(true).build()
        ));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        assertNotNull(resp.getModules());
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(4, moduleNames.size());
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("CRM"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("WORKFLOW"));
    }

    // =========================================================================
    // SCENARIO 2: Basic plan contains ACCOUNT only
    // =========================================================================
    @Test
    @DisplayName("Scenario 2: Basic plan contains ACCOUNT -> Expected Owner effective modules: ACCOUNT only")
    void testScenario2_basicPlan_ownerGetsAccountOnly() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(basicPlan)
                .planCode(basicPlan.getCode())
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));

        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(basicPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(basicPlan).module(accountModule).active(true).build()
        ));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(1, moduleNames.size());
        assertEquals("ACCOUNT", moduleNames.get(0));
        assertFalse(moduleNames.contains("INVENTORY"));
        assertFalse(moduleNames.contains("CRM"));
        assertFalse(moduleNames.contains("WORKFLOW"));
    }

    // =========================================================================
    // SCENARIO 3: Pro plan contains ACCOUNT, INVENTORY, WORKFLOW
    // =========================================================================
    @Test
    @DisplayName("Scenario 3: Pro plan contains ACCOUNT, INVENTORY, WORKFLOW -> Expected Owner effective modules: ACCOUNT, INVENTORY, WORKFLOW")
    void testScenario3_proPlan_ownerGetsAccountInventoryWorkflow() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(proPlan)
                .planCode(proPlan.getCode())
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));

        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(proPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(proPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(proPlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(proPlan).module(workflowModule).active(true).build()
        ));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(3, moduleNames.size());
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("WORKFLOW"));
        assertFalse(moduleNames.contains("CRM"), "CRM must not be accessible when not in Pro plan");
    }

    // =========================================================================
    // SCENARIO 4: Enterprise plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW
    // =========================================================================
    @Test
    @DisplayName("Scenario 4: Enterprise plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW -> Expected: All 4")
    void testScenario4_enterprisePlan_ownerGetsAllFourModules() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(enterprisePlan)
                .planCode(enterprisePlan.getCode())
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));

        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(enterprisePlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(crmModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(workflowModule).active(true).build()
        ));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(4, moduleNames.size());
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("CRM"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("WORKFLOW"));
    }

    // =========================================================================
    // MULTI-COMPANY: Switching Company A -> Company B updates modules
    // =========================================================================
    @Test
    @DisplayName("Multi-Company: Company A has Basic plan (ACCOUNT), Company B has Pro (ACCOUNT, INVENTORY, WORKFLOW)")
    void testMultiCompany_switchingCompaniesUpdatesModulesDynamically() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        // Company A has CompanySubscription with BASIC plan
        CompanySubscription subA = CompanySubscription.builder()
                .id(UUID.randomUUID())
                .company(companyA)
                .plan(basicPlan)
                .status(CompanySubscriptionStatus.ACTIVE)
                .startAt(LocalDateTime.now())
                .endAt(LocalDateTime.now().plusDays(30))
                .build();
        when(companySubscriptionRepository.findTopByCompany_IdAndStatusInOrderByCreatedAtDesc(eq(companyA.getId()), any()))
                .thenReturn(Optional.of(subA));
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(basicPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(basicPlan).module(accountModule).active(true).build()
        ));

        // Company B has CompanySubscription with PRO plan
        CompanySubscription subB = CompanySubscription.builder()
                .id(UUID.randomUUID())
                .company(companyB)
                .plan(proPlan)
                .status(CompanySubscriptionStatus.ACTIVE)
                .startAt(LocalDateTime.now())
                .endAt(LocalDateTime.now().plusDays(30))
                .build();
        when(companySubscriptionRepository.findTopByCompany_IdAndStatusInOrderByCreatedAtDesc(eq(companyB.getId()), any()))
                .thenReturn(Optional.of(subB));
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(proPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(proPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(proPlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(proPlan).module(workflowModule).active(true).build()
        ));

        // When Owner queries with Company A
        SsoMeResponse respA = userService.getSsoMe(session.getAccessToken(), companyA.getId());
        assertNotNull(respA);
        List<String> modulesA = respA.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(1, modulesA.size());
        assertEquals("ACCOUNT", modulesA.get(0));

        // When Owner switches to Company B
        SsoMeResponse respB = userService.getSsoMe(session.getAccessToken(), companyB.getId());
        assertNotNull(respB);
        List<String> modulesB = respB.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(3, modulesB.size());
        assertTrue(modulesB.contains("ACCOUNT"));
        assertTrue(modulesB.contains("INVENTORY"));
        assertTrue(modulesB.contains("WORKFLOW"));
        assertFalse(modulesB.contains("CRM"));
    }

    // =========================================================================
    // RBAC & EMPLOYEE ISOLATION: Normal employee does NOT get extra modules
    // =========================================================================
    @Test
    @DisplayName("Employee RBAC: Even if plan has 4 modules, employee assigned only ACCOUNT gets ONLY ACCOUNT")
    void testEmployee_onlyGetsAssignedModulesMatchingActivePlan() {
        Session session = mockSession(employeeUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), employeeUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(employeeMember));

        // Enterprise plan contains ACCOUNT, CRM, INVENTORY, WORKFLOW
        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(enterprisePlan)
                .planCode(enterprisePlan.getCode())
                .status(SubscriptionStatus.ACTIVE)
                .accessMode(AccessMode.FULL)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(enterprisePlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(crmModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(enterprisePlan).module(workflowModule).active(true).build()
        ));

        // Company modules exist for all 4
        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(accountModule).active(true).build();
        CompanyModule cmCrm = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(crmModule).active(true).build();
        CompanyModule cmInv = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(inventoryModule).active(true).build();
        CompanyModule cmWf = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(workflowModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyA.getId())).thenReturn(List.of(cmAcc, cmCrm, cmInv, cmWf));

        // But employee only has UserPortalAccess for ACCOUNT
        UserPortalAccess accAccess = UserPortalAccess.builder().id(UUID.randomUUID()).user(employeeUser).companyModule(cmAcc).status(true).build();
        when(userPortalAccessRepository.findAllByUser_Id(employeeUser.getId())).thenReturn(List.of(accAccess));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(1, moduleNames.size(), "Employee must only receive their assigned module, despite Enterprise plan");
        assertEquals("ACCOUNT", moduleNames.get(0));
    }

    // =========================================================================
    // INACTIVE PLAN MODULE: Inactive plan module is excluded
    // =========================================================================
    @Test
    @DisplayName("Inactive plan module: If a module in the plan has active=false, it is not returned")
    void testInactivePlanModule_excludedFromEffectiveModules() {
        Session session = mockSession(ownerUser, companyA);

        when(organizationMemberRepository.findByOrganization_IdAndUser_IdAndMembershipStatus(testOrg.getId(), ownerUser.getId(), MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(ownerMember));

        Subscription orgSub = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(testOrg)
                .plan(trialPlan)
                .status(SubscriptionStatus.TRIALING)
                .accessMode(AccessMode.FULL)
                .build();
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(testOrg.getId())).thenReturn(Optional.of(orgSub));

        // CRM is marked moduleStatus=false (inactive in system)
        Module inactiveCrm = Module.builder().id(UUID.randomUUID()).name("CRM").moduleStatus(false).build();
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(trialPlan.getId())).thenReturn(List.of(
                SubscriptionPlanModule.builder().plan(trialPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(inactiveCrm).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(inventoryModule).active(true).build()
        ));

        SsoMeResponse resp = userService.getSsoMe(session.getAccessToken());

        assertNotNull(resp);
        List<String> moduleNames = resp.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(2, moduleNames.size());
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertFalse(moduleNames.contains("CRM"), "Inactive module must not be exposed");
    }
}
