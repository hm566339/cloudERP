package com.erp.auth_service.config;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.model.SubscriptionPlan;
import com.erp.auth_service.model.SubscriptionPlanModule;
import com.erp.auth_service.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SubscriptionPlanBootstrapTest {

    @Mock private SubscriptionPlanRepository subscriptionPlanRepository;
    @Mock private SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    @Mock private ModuleRepository moduleRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CompanySubscriptionRepository companySubscriptionRepository;
    @Mock private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private SubscriptionPlanBootstrap bootstrap;

    private UUID existingTrialPlanId;
    private SubscriptionPlan existingTrialPlan;

    @BeforeEach
    void setUp() {
        existingTrialPlanId = UUID.randomUUID();
        existingTrialPlan = SubscriptionPlan.builder()
                .id(existingTrialPlanId)
                .code("30_DAY_FREE_TRIAL")
                .name("30-Day Free Trial")
                .durationDays(30)
                .price(BigDecimal.ZERO)
                .currency("INR")
                .active(true)
                .isTrial(true)
                .build();
    }

    @Test
    @DisplayName("3 & 5. Application restart -> no duplicate default plans created; uses stable plan code")
    void testBootstrapRestart_NoDuplicatePlansCreated() {
        // Mock existing plans already in DB on restart
        when(subscriptionPlanRepository.findByCodeIgnoreCase("30_DAY_FREE_TRIAL"))
                .thenReturn(Optional.of(existingTrialPlan));
        when(subscriptionPlanRepository.findByCodeIgnoreCase("BUSINESS_PLAN"))
                .thenReturn(Optional.of(SubscriptionPlan.builder().id(UUID.randomUUID()).code("BUSINESS_PLAN").build()));
        when(subscriptionPlanRepository.findByCodeIgnoreCase("BASIC"))
                .thenReturn(Optional.of(SubscriptionPlan.builder().id(UUID.randomUUID()).code("BASIC").build()));
        when(subscriptionPlanRepository.findByCodeIgnoreCase("PRO"))
                .thenReturn(Optional.of(SubscriptionPlan.builder().id(UUID.randomUUID()).code("PRO").build()));
        when(subscriptionPlanRepository.findByCodeIgnoreCase("ENTERPRISE"))
                .thenReturn(Optional.of(SubscriptionPlan.builder().id(UUID.randomUUID()).code("ENTERPRISE").build()));

        when(companyRepository.findAll()).thenReturn(Collections.emptyList());

        // Execute bootstrap run
        bootstrap.run();

        // Must NOT save any new plans!
        verify(subscriptionPlanRepository, never()).save(any());
        verify(subscriptionPlanRepository, never()).saveAndFlush(any());

        // Verify the existing trial plan ID was preserved and not re-generated
        assertEquals(existingTrialPlanId, existingTrialPlan.getId());
        assertEquals("30_DAY_FREE_TRIAL", existingTrialPlan.getCode());
    }

    @Test
    @DisplayName("5. Initial bootstrap creates default plans with standard code 30_DAY_FREE_TRIAL")
    void testBootstrapInitialRun_CreatesPlansIdempotently() {
        // On clean DB, no plans exist yet
        when(subscriptionPlanRepository.findByCodeIgnoreCase(anyString())).thenReturn(Optional.empty());

        when(subscriptionPlanRepository.saveAndFlush(any(SubscriptionPlan.class))).thenAnswer(invocation -> {
            SubscriptionPlan plan = invocation.getArgument(0);
            plan.setId(UUID.randomUUID());
            return plan;
        });

        when(moduleRepository.findByNameIgnoreCase(anyString())).thenReturn(Optional.of(
                Module.builder().id(UUID.randomUUID()).name("ACCOUNT").moduleStatus(true).build()
        ));
        when(subscriptionPlanModuleRepository.existsByPlan_IdAndModule_Id(any(), any())).thenReturn(false);
        when(companyRepository.findAll()).thenReturn(Collections.emptyList());

        // Run bootstrap
        bootstrap.run();

        // Verifies exactly 5 plans are bootstrapped: 30_DAY_FREE_TRIAL, BUSINESS_PLAN, BASIC, PRO, ENTERPRISE
        ArgumentCaptor<SubscriptionPlan> captor = ArgumentCaptor.forClass(SubscriptionPlan.class);
        verify(subscriptionPlanRepository, times(5)).saveAndFlush(captor.capture());

        List<SubscriptionPlan> savedPlans = captor.getAllValues();
        Set<String> planCodes = new HashSet<>();
        for (SubscriptionPlan p : savedPlans) {
            planCodes.add(p.getCode());
        }

        assertTrue(planCodes.contains("30_DAY_FREE_TRIAL"), "Default trial plan code must match signup expectation");
        assertTrue(planCodes.contains("BUSINESS_PLAN"));
        assertTrue(planCodes.contains("BASIC"));
        assertTrue(planCodes.contains("PRO"));
        assertTrue(planCodes.contains("ENTERPRISE"));
    }
}
