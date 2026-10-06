package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.LoginRequest;
import com.erp.auth_service.dto.response.LoginResponse;
import com.erp.auth_service.exception.BadCredentialsException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.impl.AuthServiceImpl;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.MembershipStatus;
import com.erp.auth_service.utility.OrganizationStatus;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OrganizationTenantLoginTest {

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
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private Organization mohitOrg;
    private Company defaultCompany;
    private User validUser;
    private OrganizationMember orgMember;
    private MemberCompanyAccess memberCompanyAccess;
    private Subscription activeSubscription;
    private Module accountModule;
    private CompanyModule accountCompanyModule;

    @BeforeEach
    void setUp() {
        mohitOrg = Organization.builder()
                .id(UUID.randomUUID())
                .organizationCode("mohit")
                .displayName("Mohit")
                .legalName("Mohit Enterprises")
                .status(OrganizationStatus.ACTIVE)
                .build();

        defaultCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("MOHIT01")
                .companyName("Mohit Primary")
                .build();

        validUser = User.builder()
                .id(UUID.randomUUID())
                .username("mohit_admin")
                .email("mohit@example.com")
                .password("encoded_pass")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        orgMember = OrganizationMember.builder()
                .id(UUID.randomUUID())
                .organization(mohitOrg)
                .user(validUser)
                .membershipStatus(MembershipStatus.ACTIVE)
                .build();

        memberCompanyAccess = MemberCompanyAccess.builder()
                .id(UUID.randomUUID())
                .organizationMember(orgMember)
                .company(defaultCompany)
                .active(true)
                .build();

        activeSubscription = Subscription.builder()
                .id(UUID.randomUUID())
                .organization(mohitOrg)
                .accessMode(AccessMode.FULL)
                .build();

        accountModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .host("https://www.mark2.in/api/account")
                .moduleStatus(true)
                .build();

        accountCompanyModule = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(defaultCompany)
                .module(accountModule)
                .active(true)
                .build();
    }

    private void mockStandardMohitLoginSetup() {
        when(organizationResolverService.resolveByCode("mohit")).thenReturn(mohitOrg);
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(mohitOrg.getId(), "mohit@example.com", MembershipStatus.ACTIVE))
                .thenReturn(Optional.of(orgMember));
        when(passwordEncoder.matches("Password123@", "encoded_pass")).thenReturn(true);
        when(memberCompanyAccessRepository.findActiveForMember(orgMember.getId(), mohitOrg.getId()))
                .thenReturn(List.of(memberCompanyAccess));
        when(memberCompanyAccessRepository.findActiveCompany(orgMember.getId(), mohitOrg.getId(), defaultCompany.getId()))
                .thenReturn(Optional.of(memberCompanyAccess));
        when(subscriptionRepository.findTopByOrganization_IdOrderByCreatedAtDesc(mohitOrg.getId()))
                .thenReturn(Optional.of(activeSubscription));
    }

    @Test
    @DisplayName("Case 1: Organization MOHIT + active ACCOUNT CompanyModule + valid user -> login succeeds")
    void test1_organizationMohit_activeAccount_validUser_loginSucceeds() {
        mockStandardMohitLoginSetup();

        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(companyModuleRepository.existsByCompany_IdAndModule_Id(defaultCompany.getId(), accountModule.getId())).thenReturn(true);
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), accountModule.getId())).thenReturn(true);
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(defaultCompany.getId(), accountModule.getId()))
                .thenReturn(Optional.of(accountCompanyModule));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(validUser.getId(), accountCompanyModule.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(validUser).companyModule(accountCompanyModule).status(true).build()));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");
        request.setHost("https://www.mark2.in/api/account");

        LoginResponse response = authService.login(request, "127.0.0.1", "test-agent");

        assertNotNull(response);
        assertFalse(Boolean.TRUE.equals(response.getRequiresCompanySelection()));
        assertEquals("mohit", response.getOrganization().getCode());
        assertNotNull(response.getRedirectUrl());
        assertTrue(response.getRedirectUrl().contains("/auth/callback?code="));
        verify(authorizationCodeRepository, times(1)).save(any(AuthorizationCode.class));
    }

    @Test
    @DisplayName("Case 2: Organization does not exist -> returns ResourceNotFoundException(Organization not found)")
    void test2_organizationDoesNotExist_returnsOrganizationNotFound() {
        when(organizationResolverService.resolveByCode("missing-org"))
                .thenThrow(new ResourceNotFoundException("Organization not found"));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("missing-org");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                authService.login(request, "127.0.0.1", "test-agent")
        );
        assertEquals("Organization not found", ex.getMessage());
    }

    @Test
    @DisplayName("Case 3: ACCOUNT module does not exist globally -> returns ResourceNotFoundException(Module not found)")
    void test3_accountModuleDoesNotExist_returnsModuleNotFound() {
        mockStandardMohitLoginSetup();
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");
        request.setModuleCode("ACCOUNT");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                authService.login(request, "127.0.0.1", "test-agent")
        );
        assertEquals("Module not found", ex.getMessage());
    }

    @Test
    @DisplayName("Case 4: ACCOUNT exists globally but is not provisioned for the company -> access denied")
    void test4_accountExistsGlobally_notProvisionedForCompany_accessDenied() {
        mockStandardMohitLoginSetup();
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), accountModule.getId()))
                .thenReturn(true);
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(defaultCompany.getId(), accountModule.getId()))
                .thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");
        request.setModuleCode("ACCOUNT");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                authService.login(request, "127.0.0.1", "test-agent")
        );
        assertEquals("Module not enabled for company", ex.getMessage());
    }

    @Test
    @DisplayName("Case 5: ACCOUNT exists and is provisioned but inactive -> access denied")
    void test5_accountExistsAndProvisioned_butInactive_accessDenied() {
        mockStandardMohitLoginSetup();
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(companyModuleRepository.existsByCompany_IdAndModule_Id(defaultCompany.getId(), accountModule.getId())).thenReturn(true);
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), accountModule.getId()))
                .thenReturn(true);
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(defaultCompany.getId(), accountModule.getId()))
                .thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");
        request.setModuleCode("ACCOUNT");

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () ->
                authService.login(request, "127.0.0.1", "test-agent")
        );
        assertEquals("Module not enabled for company", ex.getMessage());
    }

    @Test
    @DisplayName("Case 6: User belongs to another organization/company -> access denied")
    void test6_userBelongsToAnotherOrganizationOrCompany_accessDenied() {
        when(organizationResolverService.resolveByCode("mohit")).thenReturn(mohitOrg);
        when(organizationMemberRepository.findActiveByOrganizationAndEmail(mohitOrg.getId(), "foreign@other.com", MembershipStatus.ACTIVE))
                .thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("foreign@other.com");
        request.setPassword("Password123@");

        BadCredentialsException ex = assertThrows(BadCredentialsException.class, () ->
                authService.login(request, "127.0.0.1", "test-agent")
        );
        assertEquals("Invalid credentials", ex.getMessage());
    }

    @Test
    @DisplayName("Case 7: Module code case/format is handled consistently according to canonical Module convention")
    void test7_moduleCodeCaseAndFormat_handledConsistently() {
        mockStandardMohitLoginSetup();

        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), accountModule.getId())).thenReturn(true);
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(defaultCompany.getId(), accountModule.getId()))
                .thenReturn(Optional.of(accountCompanyModule));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(validUser.getId(), accountCompanyModule.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(validUser).companyModule(accountCompanyModule).status(true).build()));

        // Test with lowercase "account"
        LoginRequest request1 = new LoginRequest();
        request1.setOrganizationCode("mohit");
        request1.setUsername("mohit@example.com");
        request1.setPassword("Password123@");
        request1.setModuleCode("account");

        LoginResponse response1 = authService.login(request1, "127.0.0.1", "test-agent");
        assertNotNull(response1);
        assertTrue(response1.getRedirectUrl().contains("/auth/callback?code="));

        // Test with slug/display format "Finance & Accounts"
        LoginRequest request2 = new LoginRequest();
        request2.setOrganizationCode("mohit");
        request2.setUsername("mohit@example.com");
        request2.setPassword("Password123@");
        request2.setModuleCode("Finance & Accounts");

        LoginResponse response2 = authService.login(request2, "127.0.0.1", "test-agent");
        assertNotNull(response2);
        assertTrue(response2.getRedirectUrl().contains("/auth/callback?code="));
    }

    @Test
    @DisplayName("Case 8: SYSTEM_ADMIN/platform behavior continues to work and is excluded from tenant default modules")
    void test8_systemAdminPlatformBehavior_continuesToWork() {
        mockStandardMohitLoginSetup();

        Module sysAdmin = Module.builder()
                .id(UUID.randomUUID())
                .name("SYSTEM_ADMIN")
                .host("system-admin.local")
                .moduleStatus(true)
                .build();
        CompanyModule sysAdminCm = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(defaultCompany)
                .module(sysAdmin)
                .active(true)
                .build();

        Module inventoryModule = Module.builder()
                .id(UUID.randomUUID())
                .name("INVENTORY")
                .host("https://inventory.local")
                .moduleStatus(true)
                .build();
        CompanyModule inventoryCm = CompanyModule.builder()
                .id(UUID.randomUUID())
                .company(defaultCompany)
                .module(inventoryModule)
                .active(true)
                .build();

        // Company does not have ACCOUNT, but has SYSTEM_ADMIN and INVENTORY
        when(moduleRepository.findByNameIgnoreCase("ACCOUNT")).thenReturn(Optional.of(accountModule));
        when(companyModuleRepository.existsByCompany_IdAndModule_Id(defaultCompany.getId(), accountModule.getId())).thenReturn(false);
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(defaultCompany.getId()))
                .thenReturn(List.of(sysAdminCm, inventoryCm));
        when(organizationModuleRepository.existsByOrganization_IdAndModule_IdAndEnabledTrue(mohitOrg.getId(), inventoryModule.getId()))
                .thenReturn(true);
        when(companyModuleRepository.findByCompany_IdAndModule_IdAndActiveTrue(defaultCompany.getId(), inventoryModule.getId()))
                .thenReturn(Optional.of(inventoryCm));
        when(userPortalAccessRepository.findByUser_IdAndCompanyModule_IdAndStatusTrue(validUser.getId(), inventoryCm.getId()))
                .thenReturn(Optional.of(UserPortalAccess.builder().id(UUID.randomUUID()).user(validUser).companyModule(inventoryCm).status(true).build()));

        LoginRequest request = new LoginRequest();
        request.setOrganizationCode("mohit");
        request.setUsername("mohit@example.com");
        request.setPassword("Password123@");

        LoginResponse response = authService.login(request, "127.0.0.1", "test-agent");
        assertNotNull(response);
        // Successfully resolved tenant module INVENTORY (skipping SYSTEM_ADMIN)
        assertTrue(response.getRedirectUrl().contains("/auth/callback?code="));
    }
}
