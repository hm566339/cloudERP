package com.erp.auth_service.service;

import com.erp.auth_service.dto.response.EffectivePermissionsResponse;
import com.erp.auth_service.dto.response.SsoMeResponse;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.security.JwtDecoder;
import com.erp.auth_service.service.impl.UserServiceImpl;
import com.erp.auth_service.utility.AccountStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class UserServiceGetSsoMeModuleFlowTest {

    @Mock private UserRepository userRepository;
    @Mock private SessionRepository sessionRepository;
    @Mock private JwtDecoder jwtDecoder;
    @Mock private CompanyModuleRepository companyModuleRepository;
    @Mock private OrganizationModuleRepository organizationModuleRepository;
    @Mock private SubscriptionRepository subscriptionRepository;
    @Mock private PermissionService permissionService;

    @InjectMocks
    private UserServiceImpl userService;

    private UUID userId;
    private UUID companyMohitId;
    private UUID companyAId;
    private UUID companyBId;
    private User user;
    private Session sessionMohit;
    private Company companyMohit;
    private Company companyA;
    private Company companyB;

    private Module accountModule;
    private Module inventoryModule;
    private Module workflowModule;
    private Module crmModule;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        companyMohitId = UUID.fromString("ea811382-0afc-4908-a209-9bedcc63c445");
        companyAId = UUID.randomUUID();
        companyBId = UUID.randomUUID();

        companyMohit = Company.builder()
                .id(companyMohitId)
                .companyCode("MOHIT")
                .companyName("Mohit")
                .active(true)
                .build();

        companyA = Company.builder()
                .id(companyAId)
                .companyCode("COMP_A")
                .companyName("Company A")
                .active(true)
                .build();

        companyB = Company.builder()
                .id(companyBId)
                .companyCode("COMP_B")
                .companyName("Company B")
                .active(true)
                .build();

        user = User.builder()
                .id(userId)
                .username("mohit@example.com")
                .email("mohit@example.com")
                .accountStatus(AccountStatus.ACTIVE)
                .company(companyMohit)
                .build();

        sessionMohit = Session.builder()
                .id(UUID.randomUUID())
                .accessToken("test-token")
                .accessTokenValidTill(LocalDateTime.now().plusHours(1))
                .company(companyMohit)
                .build();

        accountModule = Module.builder()
                .id(UUID.fromString("be307506-6fb1-4c78-b454-08aef0cb6db8"))
                .name("ACCOUNT")
                .host("https://www.mark2.in/erp/accounts")
                .moduleStatus(true)
                .build();

        inventoryModule = Module.builder()
                .id(UUID.randomUUID())
                .name("INVENTORY")
                .host("https://www.mark2.in/erp/inventory")
                .moduleStatus(true)
                .build();

        workflowModule = Module.builder()
                .id(UUID.randomUUID())
                .name("WORKFLOW")
                .host("https://www.mark2.in/erp/workflow")
                .moduleStatus(true)
                .build();

        crmModule = Module.builder()
                .id(UUID.randomUUID())
                .name("CRM")
                .host("https://www.mark2.in/erp/crm")
                .moduleStatus(true)
                .build();

        when(jwtDecoder.isTokenValid(anyString())).thenReturn(true);
        when(jwtDecoder.extractUserId(anyString())).thenReturn(userId);
        when(userRepository.findByIdWithRolesAndPortalAccess(userId)).thenReturn(Optional.of(user));
        when(permissionService.getEffectivePermissions(any(), any())).thenReturn(
                EffectivePermissionsResponse.builder().features(List.of()).permissions(List.of()).build());
    }

    @Test
    @DisplayName("Test 1: Company Mohit has ACCOUNT, INVENTORY, WORKFLOW active -> returns all 3")
    void testMohitAllThreeModulesActive() {
        when(sessionRepository.findByAccessToken("test-token")).thenReturn(Optional.of(sessionMohit));

        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(accountModule).active(true).build();
        CompanyModule cmInv = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(inventoryModule).active(true).build();
        CompanyModule cmWf = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(workflowModule).active(true).build();

        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyMohitId)).thenReturn(List.of(cmAcc, cmInv, cmWf));

        SsoMeResponse response = userService.getSsoMe("test-token");

        assertNotNull(response);
        assertEquals("MOHIT", response.getCurrentCompany().getCode());
        assertEquals(3, response.getModules().size());

        List<String> moduleNames = response.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("INVENTORY"));
        assertTrue(moduleNames.contains("WORKFLOW"));

        SsoMeResponse.ModuleContext accCtx = response.getModules().stream().filter(m -> "ACCOUNT".equals(m.getName())).findFirst().orElseThrow();
        assertEquals("account", accCtx.getCode());
        assertEquals("https://www.mark2.in/erp/accounts", accCtx.getHost());
        assertTrue(accCtx.isActive());
    }

    @Test
    @DisplayName("Test 2: Company Mohit has ACCOUNT (active), INVENTORY (inactive), WORKFLOW (active) -> returns ACCOUNT and WORKFLOW")
    void testMohitInventoryInactive() {
        when(sessionRepository.findByAccessToken("test-token")).thenReturn(Optional.of(sessionMohit));

        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(accountModule).active(true).build();
        CompanyModule cmWf = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(workflowModule).active(true).build();

        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyMohitId)).thenReturn(List.of(cmAcc, cmWf));

        SsoMeResponse response = userService.getSsoMe("test-token");

        assertNotNull(response);
        assertEquals(2, response.getModules().size());

        List<String> moduleNames = response.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertTrue(moduleNames.contains("ACCOUNT"));
        assertTrue(moduleNames.contains("WORKFLOW"));
        assertFalse(moduleNames.contains("INVENTORY"));
    }

    @Test
    @DisplayName("Test 3: Company Mohit has only ACCOUNT active -> returns only ACCOUNT")
    void testMohitOnlyAccountActive() {
        when(sessionRepository.findByAccessToken("test-token")).thenReturn(Optional.of(sessionMohit));

        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(accountModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyMohitId)).thenReturn(List.of(cmAcc));

        SsoMeResponse response = userService.getSsoMe("test-token");

        assertNotNull(response);
        assertEquals(1, response.getModules().size());
        assertEquals("ACCOUNT", response.getModules().get(0).getName());
    }

    @Test
    @DisplayName("Test 4: Multi-company isolation - Company A (ACCOUNT, INVENTORY), Company B (ACCOUNT, WORKFLOW) -> no leakage")
    void testMultiCompanyIsolation() {
        Session sessionA = Session.builder().id(UUID.randomUUID()).accessToken("token-a").accessTokenValidTill(LocalDateTime.now().plusHours(1)).company(companyA).build();
        Session sessionB = Session.builder().id(UUID.randomUUID()).accessToken("token-b").accessTokenValidTill(LocalDateTime.now().plusHours(1)).company(companyB).build();

        when(sessionRepository.findByAccessToken("token-a")).thenReturn(Optional.of(sessionA));
        when(sessionRepository.findByAccessToken("token-b")).thenReturn(Optional.of(sessionB));

        CompanyModule cmA_Acc = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(accountModule).active(true).build();
        CompanyModule cmA_Inv = CompanyModule.builder().id(UUID.randomUUID()).company(companyA).module(inventoryModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyAId)).thenReturn(List.of(cmA_Acc, cmA_Inv));

        CompanyModule cmB_Acc = CompanyModule.builder().id(UUID.randomUUID()).company(companyB).module(accountModule).active(true).build();
        CompanyModule cmB_Wf = CompanyModule.builder().id(UUID.randomUUID()).company(companyB).module(workflowModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyBId)).thenReturn(List.of(cmB_Acc, cmB_Wf));

        SsoMeResponse respA = userService.getSsoMe("token-a");
        assertEquals(2, respA.getModules().size());
        List<String> namesA = respA.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(List.of("ACCOUNT", "INVENTORY"), namesA);

        SsoMeResponse respB = userService.getSsoMe("token-b");
        assertEquals(2, respB.getModules().size());
        List<String> namesB = respB.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertEquals(List.of("ACCOUNT", "WORKFLOW"), namesB);
    }

    @Test
    @DisplayName("Test 5: Global module exists but without company assignment -> does not appear")
    void testGlobalModuleWithoutAssignmentNotReturned() {
        when(sessionRepository.findByAccessToken("test-token")).thenReturn(Optional.of(sessionMohit));

        CompanyModule cmAcc = CompanyModule.builder().id(UUID.randomUUID()).company(companyMohit).module(accountModule).active(true).build();
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyMohitId)).thenReturn(List.of(cmAcc));

        SsoMeResponse response = userService.getSsoMe("test-token");

        assertNotNull(response);
        List<String> moduleNames = response.getModules().stream().map(SsoMeResponse.ModuleContext::getName).toList();
        assertFalse(moduleNames.contains("CRM"));
    }
}
