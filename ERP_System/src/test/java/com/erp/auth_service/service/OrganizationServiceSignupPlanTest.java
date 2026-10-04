package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.CompanyRequest;
import com.erp.auth_service.dto.request.OrganizationSignupRequest;
import com.erp.auth_service.dto.response.OrganizationSignupResponse;
import com.erp.auth_service.mail.EmailService;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.impl.OrganizationServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrganizationServiceSignupPlanTest {

    @Mock private OrganizationRepository organizationRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private OrganizationMemberRepository memberRepository;
    @Mock private MemberCompanyAccessRepository accessRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private UserPortalAccessRepository userPortalAccessRepository;
    @Mock private OrganizationModuleRepository organizationModuleRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PermissionService permissionService;
    @Mock private EmailService emailService;

    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    @Mock private CompanySubscriptionRepository companySubscriptionRepository;

    @InjectMocks
    private OrganizationServiceImpl organizationService;

    private SubscriptionPlan trialPlan;
    private Module accountModule;
    private Module inventoryModule;
    private Module workflowModule;
    private Module salesModule;
    private Module crmModule;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(organizationService, "frontendBaseUrl", "https://app.clouderp.com");
        ReflectionTestUtils.setField(organizationService, "trialDays", 30);

        trialPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("30_DAY_FREE_TRIAL")
                .name("30-Day Free Trial")
                .durationDays(30)
                .price(BigDecimal.ZERO)
                .currency("INR")
                .active(true)
                .isTrial(true)
                .build();

        accountModule = Module.builder().id(UUID.randomUUID()).name("ACCOUNT").moduleStatus(true).build();
        inventoryModule = Module.builder().id(UUID.randomUUID()).name("INVENTORY").moduleStatus(true).build();
        workflowModule = Module.builder().id(UUID.randomUUID()).name("WORKFLOW").moduleStatus(true).build();
        salesModule = Module.builder().id(UUID.randomUUID()).name("SALES").moduleStatus(true).build();
        crmModule = Module.builder().id(UUID.randomUUID()).name("CRM").moduleStatus(true).build();
    }

    private OrganizationSignupRequest createSignupRequest() {
        OrganizationSignupRequest req = new OrganizationSignupRequest();
        req.setFullName("John Doe");
        req.setEmail("john@acme.com");
        req.setPassword("Password@123");
        req.setOrganizationName("Acme Group");

        CompanyRequest comp = new CompanyRequest();
        comp.setCompanyCode("ACME01");
        comp.setCompanyName("Acme Pvt Ltd");
        comp.setBaseCurrency("INR");

        req.setCompany(comp);
        return req;
    }

    @Test
    @DisplayName("5, 6, 7, 8. Signup dynamically finds trial plan, creates CompanySubscription, and provisions ONLY plan modules")
    void testSignupFlowWithPlanModules() {
        OrganizationSignupRequest request = createSignupRequest();

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(companyRepository.existsByCompanyCode(anyString())).thenReturn(false);

        when(organizationRepository.save(any(Organization.class))).thenAnswer(i -> {
            Organization org = i.getArgument(0);
            org.setId(UUID.randomUUID());
            return org;
        });

        when(companyRepository.save(any(Company.class))).thenAnswer(i -> {
            Company comp = i.getArgument(0);
            comp.setId(UUID.randomUUID());
            return comp;
        });

        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");

        // 5. Configured trial plan in DB contains ONLY ACCOUNT, INVENTORY, WORKFLOW
        when(subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue()).thenReturn(Optional.of(trialPlan));

        List<SubscriptionPlanModule> trialPlanModules = List.of(
                SubscriptionPlanModule.builder().plan(trialPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(workflowModule).active(true).build()
        );
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(trialPlan.getId())).thenReturn(trialPlanModules);

        when(companyModuleRepository.save(any(CompanyModule.class))).thenAnswer(i -> {
            CompanyModule cm = i.getArgument(0);
            cm.setId(UUID.randomUUID());
            return cm;
        });

        when(roleRepository.findByCompany_IdAndNameIgnoreCase(any(), eq("OWNER"))).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> {
            Role r = i.getArgument(0);
            r.setId(UUID.randomUUID());
            return r;
        });

        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(i -> {
            OrganizationMember m = i.getArgument(0);
            m.setId(UUID.randomUUID());
            return m;
        });

        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> {
            Subscription s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        // Execute Signup
        OrganizationSignupResponse response = organizationService.signup(request);

        assertNotNull(response);

        // 6. Verify CompanySubscription was saved
        ArgumentCaptor<CompanySubscription> compSubCaptor = ArgumentCaptor.forClass(CompanySubscription.class);
        verify(companySubscriptionRepository, times(1)).save(compSubCaptor.capture());
        CompanySubscription createdCompSub = compSubCaptor.getValue();
        assertEquals(trialPlan.getId(), createdCompSub.getPlan().getId());
        assertEquals(CompanySubscriptionStatus.TRIALING, createdCompSub.getStatus());
        assertNotNull(createdCompSub.getStartAt());
        assertNotNull(createdCompSub.getEndAt());

        // 7. Verify CompanyModule was created ONLY for the 3 plan modules (ACCOUNT, INVENTORY, WORKFLOW)
        // SALES and CRM must NOT be provisioned
        ArgumentCaptor<CompanyModule> cmCaptor = ArgumentCaptor.forClass(CompanyModule.class);
        verify(companyModuleRepository, times(3)).save(cmCaptor.capture());
        List<CompanyModule> savedModules = cmCaptor.getAllValues();
        Set<String> savedNames = new HashSet<>();
        for (CompanyModule cm : savedModules) {
            savedNames.add(cm.getModule().getName());
        }
        assertTrue(savedNames.contains("ACCOUNT"));
        assertTrue(savedNames.contains("INVENTORY"));
        assertTrue(savedNames.contains("WORKFLOW"));
        assertFalse(savedNames.contains("SALES"), "SALES must not be provisioned because it is not in the trial plan");
        assertFalse(savedNames.contains("CRM"), "CRM must not be provisioned because it is not in the trial plan");

        // 8. Verify Administrator receives UserPortalAccess only for the 3 plan modules
        verify(userPortalAccessRepository, times(3)).save(any(UserPortalAccess.class));
    }

    @Test
    @DisplayName("9. Changing trial plan modules affects future signups dynamically without code modification")
    void testChangingPlanModulesAffectsFutureSignups() {
        OrganizationSignupRequest request = createSignupRequest();

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(companyRepository.existsByCompanyCode(anyString())).thenReturn(false);
        when(organizationRepository.save(any(Organization.class))).thenAnswer(i -> i.getArgument(0));
        when(companyRepository.save(any(Company.class))).thenAnswer(i -> {
            Company c = i.getArgument(0);
            c.setId(UUID.randomUUID());
            return c;
        });
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_pass");

        when(subscriptionPlanRepository.findFirstByIsTrialTrueAndActiveTrue()).thenReturn(Optional.of(trialPlan));

        // Suppose admin added SALES and CRM to the trial plan in Settings:
        List<SubscriptionPlanModule> updatedPlanModules = List.of(
                SubscriptionPlanModule.builder().plan(trialPlan).module(accountModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(inventoryModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(workflowModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(salesModule).active(true).build(),
                SubscriptionPlanModule.builder().plan(trialPlan).module(crmModule).active(true).build()
        );
        when(subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(trialPlan.getId())).thenReturn(updatedPlanModules);

        when(companyModuleRepository.save(any(CompanyModule.class))).thenAnswer(i -> i.getArgument(0));
        when(roleRepository.findByCompany_IdAndNameIgnoreCase(any(), eq("OWNER"))).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));
        when(memberRepository.save(any(OrganizationMember.class))).thenAnswer(i -> i.getArgument(0));
        when(subscriptionRepository.save(any(Subscription.class))).thenAnswer(i -> i.getArgument(0));

        organizationService.signup(request);

        // Now exactly 5 modules should have been provisioned automatically!
        verify(companyModuleRepository, times(5)).save(any(CompanyModule.class));
        verify(userPortalAccessRepository, times(5)).save(any(UserPortalAccess.class));
    }
}
