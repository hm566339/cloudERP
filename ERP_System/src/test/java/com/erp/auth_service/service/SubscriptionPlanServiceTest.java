package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.response.CompanySubscriptionResponse;
import com.erp.auth_service.dto.response.SubscriptionPlanResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.impl.SubscriptionPlanServiceImpl;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionPlanServiceTest {

    @Mock
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Mock
    private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;

    @Mock
    private CompanySubscriptionRepository companySubscriptionRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ModuleRepository moduleRepository;

    @Mock
    private CompanyModuleRepository companyModuleRepository;

    @InjectMocks
    private SubscriptionPlanServiceImpl subscriptionPlanService;

    private SubscriptionPlan testPlan;
    private Module accountModule;
    private Module inventoryModule;
    private Company testCompany;

    @BeforeEach
    void setUp() {
        testPlan = SubscriptionPlan.builder()
                .id(UUID.randomUUID())
                .code("30_DAY_FREE_TRIAL")
                .name("30-Day Free Trial")
                .description("Trial plan")
                .durationDays(30)
                .price(BigDecimal.ZERO)
                .currency("INR")
                .active(true)
                .isTrial(true)
                .build();

        accountModule = Module.builder()
                .id(UUID.randomUUID())
                .name("ACCOUNT")
                .moduleStatus(true)
                .build();

        inventoryModule = Module.builder()
                .id(UUID.randomUUID())
                .name("INVENTORY")
                .moduleStatus(true)
                .build();

        testCompany = Company.builder()
                .id(UUID.randomUUID())
                .companyCode("COMP001")
                .companyName("Acme Corp")
                .active(true)
                .build();
    }

    @Test
    @DisplayName("1. Create subscription plan succeeds")
    void testCreateSubscriptionPlan() {
        SubscriptionPlanRequest request = SubscriptionPlanRequest.builder()
                .code("BUSINESS_PLAN")
                .name("Business Plan")
                .description("Annual business plan")
                .durationDays(365)
                .price(new BigDecimal("9999.00"))
                .currency("INR")
                .active(true)
                .isTrial(false)
                .build();

        when(subscriptionPlanRepository.existsByCodeIgnoreCase("BUSINESS_PLAN")).thenReturn(false);
        when(subscriptionPlanRepository.save(any(SubscriptionPlan.class))).thenAnswer(invocation -> {
            SubscriptionPlan plan = invocation.getArgument(0);
            plan.setId(UUID.randomUUID());
            return plan;
        });

        SubscriptionPlanResponse response = subscriptionPlanService.createPlan(request);

        assertNotNull(response);
        assertEquals("BUSINESS_PLAN", response.getCode());
        assertEquals("Business Plan", response.getName());
        assertEquals(365, response.getDurationDays());
        verify(subscriptionPlanRepository, times(1)).save(any(SubscriptionPlan.class));
    }

    @Test
    @DisplayName("2. Add modules to plan and prevents duplicates")
    void testAddModulesToPlan() {
        UUID planId = testPlan.getId();
        when(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(testPlan));
        when(moduleRepository.findById(accountModule.getId())).thenReturn(Optional.of(accountModule));
        when(subscriptionPlanModuleRepository.findByPlan_Id(planId)).thenReturn(Collections.emptyList());

        // Assign account module
        subscriptionPlanService.assignModulesToPlan(planId, List.of(accountModule.getId(), accountModule.getId()));

        // Verification: Even if passed duplicate module IDs in the request, save is called only once
        verify(subscriptionPlanModuleRepository, times(1)).save(any(SubscriptionPlanModule.class));
    }

    @Test
    @DisplayName("3. Remove module from plan succeeds")
    void testRemoveModuleFromPlan() {
        UUID planId = testPlan.getId();
        UUID moduleId = accountModule.getId();
        SubscriptionPlanModule spm = SubscriptionPlanModule.builder()
                .id(UUID.randomUUID())
                .plan(testPlan)
                .module(accountModule)
                .active(true)
                .build();

        when(subscriptionPlanRepository.findById(planId)).thenReturn(Optional.of(testPlan));
        when(subscriptionPlanModuleRepository.findByPlan_IdAndModule_Id(planId, moduleId))
                .thenReturn(Optional.of(spm));

        subscriptionPlanService.removeModuleFromPlan(planId, moduleId);

        verify(subscriptionPlanModuleRepository, times(1)).delete(spm);
    }

    @Test
    @DisplayName("4. Duplicate plan code is rejected")
    void testDuplicatePlanCodeRejected() {
        SubscriptionPlanRequest request = SubscriptionPlanRequest.builder()
                .code("30_DAY_FREE_TRIAL")
                .name("Duplicate Trial")
                .durationDays(30)
                .build();

        when(subscriptionPlanRepository.existsByCodeIgnoreCase("30_DAY_FREE_TRIAL")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> subscriptionPlanService.createPlan(request));
        verify(subscriptionPlanRepository, never()).save(any(SubscriptionPlan.class));
    }

    @Test
    @DisplayName("11. Expired subscription blocks module access entitlement")
    void testExpiredSubscriptionRejectsAccess() {
        UUID companyId = testCompany.getId();
        LocalDateTime past = LocalDateTime.now().minusDays(5);

        CompanySubscription expiredSub = CompanySubscription.builder()
                .id(UUID.randomUUID())
                .company(testCompany)
                .plan(testPlan)
                .startAt(past.minusDays(30))
                .endAt(past)
                .status(CompanySubscriptionStatus.EXPIRED)
                .build();

        when(companySubscriptionRepository.findTopByCompany_IdOrderByCreatedAtDesc(companyId))
                .thenReturn(Optional.of(expiredSub));

        boolean entitled = subscriptionPlanService.isCompanyEntitledToModule(companyId, "ACCOUNT");
        assertFalse(entitled, "Expired subscription must deny module entitlement");
    }

    @Test
    @DisplayName("13. Deactivated plan cannot be assigned to provision new subscription")
    void testDeactivatedPlanCannotBeAssigned() {
        testPlan.setActive(false);

        assertThrows(BadRequestException.class, () ->
                subscriptionPlanService.provisionCompanySubscription(testCompany, testPlan, LocalDateTime.now()));
    }

    @Test
    @DisplayName("Get current company subscription returns active state and provisioned modules")
    void testGetCurrentCompanySubscription() {
        UUID companyId = testCompany.getId();
        LocalDateTime now = LocalDateTime.now();

        CompanySubscription activeSub = CompanySubscription.builder()
                .id(UUID.randomUUID())
                .company(testCompany)
                .plan(testPlan)
                .startAt(now.minusDays(5))
                .endAt(now.plusDays(25))
                .status(CompanySubscriptionStatus.TRIALING)
                .autoRenew(false)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companySubscriptionRepository.findTopByCompany_IdOrderByCreatedAtDesc(companyId))
                .thenReturn(Optional.of(activeSub));
        when(companyModuleRepository.findByCompany_IdAndActiveTrue(companyId)).thenReturn(List.of(
                CompanyModule.builder().company(testCompany).module(accountModule).active(true).build(),
                CompanyModule.builder().company(testCompany).module(inventoryModule).active(true).build()
        ));

        CompanySubscriptionResponse res = subscriptionPlanService.getCurrentCompanySubscription(companyId);

        assertNotNull(res);
        assertEquals("30_DAY_FREE_TRIAL", res.getPlanCode());
        assertEquals(CompanySubscriptionStatus.TRIALING, res.getStatus());
        assertFalse(res.getIsExpired());
        assertEquals(2, res.getProvisionedModules().size());
        assertTrue(res.getProvisionedModules().contains("ACCOUNT"));
        assertTrue(res.getProvisionedModules().contains("INVENTORY"));
    }
}
