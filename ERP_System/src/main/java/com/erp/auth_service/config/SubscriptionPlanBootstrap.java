package com.erp.auth_service.config;

import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) {
        relaxAuthorizationCodeModuleConstraintIfPresent();
        log.info("Checking and bootstrapping default SaaS subscription plans...");

        // 1. Bootstrap 30-Day Free Trial Plan
        SubscriptionPlan trialPlan = subscriptionPlanRepository.findByCodeIgnoreCase("30_DAY_FREE_TRIAL")
                .map(existing -> {
                    syncToLegacyPlanTableIfPresent(existing);
                    return existing;
                })
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
                    SubscriptionPlan saved = subscriptionPlanRepository.saveAndFlush(plan);
                    syncToLegacyPlanTableIfPresent(saved);
                    log.info("Created default 30-Day Free Trial plan [30_DAY_FREE_TRIAL]");
                    return saved;
                });

        // Ensure default modules for 30-Day Free Trial: ACCOUNT, INVENTORY, WORKFLOW
        List<String> trialModuleNames = List.of("ACCOUNT", "INVENTORY", "WORKFLOW");
        attachModulesToPlanIfMissing(trialPlan, trialModuleNames);

        // 2. Bootstrap Business Plan
        SubscriptionPlan businessPlan = subscriptionPlanRepository.findByCodeIgnoreCase("BUSINESS_PLAN")
                .map(existing -> {
                    syncToLegacyPlanTableIfPresent(existing);
                    return existing;
                })
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
                    SubscriptionPlan saved = subscriptionPlanRepository.saveAndFlush(plan);
                    syncToLegacyPlanTableIfPresent(saved);
                    log.info("Created default Business plan [BUSINESS_PLAN]");
                    return saved;
                });

        // Ensure default modules for Business Plan: ACCOUNT, INVENTORY, WORKFLOW, SALES, PURCHASE, CRM
        List<String> businessModuleNames = List.of("ACCOUNT", "INVENTORY", "WORKFLOW", "SALES", "PURCHASE", "CRM");
        attachModulesToPlanIfMissing(businessPlan, businessModuleNames);

        // 3. Bootstrap Basic Plan (₹999/month)
        SubscriptionPlan basicPlan = subscriptionPlanRepository.findByCodeIgnoreCase("BASIC")
                .map(existing -> {
                    syncToLegacyPlanTableIfPresent(existing);
                    return existing;
                })
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
                    SubscriptionPlan saved = subscriptionPlanRepository.saveAndFlush(plan);
                    syncToLegacyPlanTableIfPresent(saved);
                    log.info("Created default Basic plan [BASIC]");
                    return saved;
                });
        attachModulesToPlanIfMissing(basicPlan, List.of("ACCOUNT"));

        // 4. Bootstrap Pro Plan (₹2,999/month)
        SubscriptionPlan proPlan = subscriptionPlanRepository.findByCodeIgnoreCase("PRO")
                .map(existing -> {
                    syncToLegacyPlanTableIfPresent(existing);
                    return existing;
                })
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
                    SubscriptionPlan saved = subscriptionPlanRepository.saveAndFlush(plan);
                    syncToLegacyPlanTableIfPresent(saved);
                    log.info("Created default Pro plan [PRO]");
                    return saved;
                });
        attachModulesToPlanIfMissing(proPlan, List.of("ACCOUNT", "INVENTORY", "WORKFLOW"));

        // 5. Bootstrap Enterprise Plan (₹9,999/month)
        SubscriptionPlan enterprisePlan = subscriptionPlanRepository.findByCodeIgnoreCase("ENTERPRISE")
                .map(existing -> {
                    syncToLegacyPlanTableIfPresent(existing);
                    return existing;
                })
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
                    SubscriptionPlan saved = subscriptionPlanRepository.saveAndFlush(plan);
                    syncToLegacyPlanTableIfPresent(saved);
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

    private void syncToLegacyPlanTableIfPresent(SubscriptionPlan plan) {
        if (plan == null || plan.getId() == null || jdbcTemplate == null) {
            return;
        }
        try {
            Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT count(*) FROM information_schema.tables WHERE table_name = 'plan'", Integer.class);
            if (tableCount != null && tableCount > 0) {
                jdbcTemplate.update("""
                    INSERT INTO plan (id, code, name, trial_days, active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT (id) DO UPDATE SET
                        code = EXCLUDED.code,
                        name = EXCLUDED.name,
                        trial_days = EXCLUDED.trial_days,
                        active = EXCLUDED.active,
                        updated_at = EXCLUDED.updated_at
                """, plan.getId(), plan.getCode(), plan.getName(),
                    plan.getDurationDays() != null ? plan.getDurationDays() : 30,
                    Boolean.TRUE.equals(plan.getActive()),
                    plan.getCreatedAt() != null ? plan.getCreatedAt() : LocalDateTime.now(),
                    LocalDateTime.now());
                log.debug("Synchronized plan [{}] to legacy table 'plan'", plan.getCode());
            }
        } catch (Exception ex) {
            log.warn("Could not sync plan [{}] to legacy table 'plan': {}", plan.getCode(), ex.getMessage());
        }
    }

    private void relaxAuthorizationCodeModuleConstraintIfPresent() {
        if (jdbcTemplate == null) {
            return;
        }
        try {
            jdbcTemplate.execute("ALTER TABLE authorization_code ALTER COLUMN module_id DROP NOT NULL");
            log.debug("Successfully verified/relaxed authorization_code.module_id nullability");
        } catch (Exception ex) {
            log.debug("authorization_code.module_id nullability check: {}", ex.getMessage());
        }
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
