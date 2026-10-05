package com.erp.auth_service.config;

import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@Order(3)
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPlanBootstrap implements CommandLineRunner {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    private final ModuleRepository moduleRepository;
    private final CompanyRepository companyRepository;
    private final CompanySubscriptionRepository companySubscriptionRepository;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Checking and bootstrapping default SaaS subscription plans...");

        // 1. Bootstrap 30-Day Free Trial Plan
        SubscriptionPlan trialPlan = subscriptionPlanRepository.findByCodeIgnoreCase("30_DAY_FREE_TRIAL")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .code("30_DAY_FREE_TRIAL")
                            .name("30-Day Free Trial")
                            .description("30-day free trial with standard financial, inventory, and workflow modules.")
                            .durationDays(30)
                            .price(BigDecimal.ZERO)
                            .currency("INR")
                            .active(true)
                            .isTrial(true)
                            .build();
                    SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
                    log.info("Created default 30-Day Free Trial plan [30_DAY_FREE_TRIAL]");
                    return saved;
                });

        // Ensure default modules for 30-Day Free Trial: ACCOUNT, INVENTORY, WORKFLOW
        List<String> trialModuleNames = List.of("ACCOUNT", "INVENTORY", "WORKFLOW");
        attachModulesToPlanIfMissing(trialPlan, trialModuleNames);

        // 2. Bootstrap Business Plan
        SubscriptionPlan businessPlan = subscriptionPlanRepository.findByCodeIgnoreCase("BUSINESS_PLAN")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .code("BUSINESS_PLAN")
                            .name("Business Plan")
                            .description("Annual full ERP suite for growing businesses.")
                            .durationDays(365)
                            .price(new BigDecimal("19999.00"))
                            .currency("INR")
                            .active(true)
                            .isTrial(false)
                            .build();
                    SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
                    log.info("Created default Business plan [BUSINESS_PLAN]");
                    return saved;
                });

        // Ensure default modules for Business Plan: ACCOUNT, INVENTORY, WORKFLOW, SALES, PURCHASE, CRM
        List<String> businessModuleNames = List.of("ACCOUNT", "INVENTORY", "WORKFLOW", "SALES", "PURCHASE", "CRM");
        attachModulesToPlanIfMissing(businessPlan, businessModuleNames);

        // 3. Bootstrap Basic Plan (₹999/month)
        SubscriptionPlan basicPlan = subscriptionPlanRepository.findByCodeIgnoreCase("BASIC")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .code("BASIC")
                            .name("Basic Plan")
                            .description("Essential cloud ERP financial and account tools for small teams.")
                            .durationDays(30)
                            .price(new BigDecimal("999.00"))
                            .currency("INR")
                            .active(true)
                            .isTrial(false)
                            .build();
                    SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
                    log.info("Created default Basic plan [BASIC]");
                    return saved;
                });
        attachModulesToPlanIfMissing(basicPlan, List.of("ACCOUNT"));

        // 4. Bootstrap Pro Plan (₹2,999/month)
        SubscriptionPlan proPlan = subscriptionPlanRepository.findByCodeIgnoreCase("PRO")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .code("PRO")
                            .name("Pro Plan")
                            .description("Complete business automation with accounts, inventory, and workflows.")
                            .durationDays(30)
                            .price(new BigDecimal("2999.00"))
                            .currency("INR")
                            .active(true)
                            .isTrial(false)
                            .build();
                    SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
                    log.info("Created default Pro plan [PRO]");
                    return saved;
                });
        attachModulesToPlanIfMissing(proPlan, List.of("ACCOUNT", "INVENTORY", "WORKFLOW"));

        // 5. Bootstrap Enterprise Plan (₹9,999/month)
        SubscriptionPlan enterprisePlan = subscriptionPlanRepository.findByCodeIgnoreCase("ENTERPRISE")
                .orElseGet(() -> {
                    SubscriptionPlan plan = SubscriptionPlan.builder()
                            .code("ENTERPRISE")
                            .name("Enterprise Plan")
                            .description("Unlimited enterprise suite with multi-company, CRM, and dedicated priority support.")
                            .durationDays(30)
                            .price(new BigDecimal("9999.00"))
                            .currency("INR")
                            .active(true)
                            .isTrial(false)
                            .build();
                    SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
                    log.info("Created default Enterprise plan [ENTERPRISE]");
                    return saved;
                });
        attachModulesToPlanIfMissing(enterprisePlan, List.of("ACCOUNT", "INVENTORY", "WORKFLOW", "CRM", "SALES", "PURCHASE"));

        // 3. Existing Companies Backward Compatibility
        // Ensure any existing company has a CompanySubscription so access checks pass seamlessly
        List<Company> allCompanies = companyRepository.findAll();
        for (Company company : allCompanies) {
            boolean hasSub = companySubscriptionRepository.existsByCompany_IdAndStatus(company.getId(), CompanySubscriptionStatus.ACTIVE)
                    || companySubscriptionRepository.existsByCompany_IdAndStatus(company.getId(), CompanySubscriptionStatus.TRIALING);

            if (!hasSub) {
                SubscriptionPlan assignedPlan = trialPlan != null ? trialPlan : businessPlan;
                CompanySubscription existingSub = CompanySubscription.builder()
                        .company(company)
                        .plan(assignedPlan)
                        .startAt(LocalDateTime.now())
                        .endAt(LocalDateTime.now().plusDays(assignedPlan.getDurationDays() != null ? assignedPlan.getDurationDays() : 365))
                        .status(CompanySubscriptionStatus.ACTIVE)
                        .autoRenew(true)
                        .build();
                companySubscriptionRepository.save(existingSub);
                log.info("Assigned backward-compatible active subscription to existing company [{}]", company.getCompanyCode());
            }
        }

        log.info("Subscription plan bootstrap completed successfully.");
    }

    private void attachModulesToPlanIfMissing(SubscriptionPlan plan, List<String> moduleNames) {
        for (String modName : moduleNames) {
            Optional<Module> moduleOpt = moduleRepository.findByNameIgnoreCase(modName);
            if (moduleOpt.isPresent()) {
                Module module = moduleOpt.get();
                if (!subscriptionPlanModuleRepository.existsByPlan_IdAndModule_Id(plan.getId(), module.getId())) {
                    subscriptionPlanModuleRepository.save(SubscriptionPlanModule.builder()
                            .plan(plan)
                            .module(module)
                            .active(true)
                            .build());
                    log.info("Attached module [{}] to plan [{}]", module.getName(), plan.getCode());
                }
            }
        }
    }
}
