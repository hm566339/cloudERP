package com.erp.auth_service.service.impl;

import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.response.CompanySubscriptionResponse;
import com.erp.auth_service.dto.response.SubscriptionPlanModuleResponse;
import com.erp.auth_service.dto.response.SubscriptionPlanResponse;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.DuplicateResourceException;
import com.erp.auth_service.exception.ResourceNotFoundException;
import com.erp.auth_service.model.*;
import com.erp.auth_service.model.Module;
import com.erp.auth_service.repository.*;
import com.erp.auth_service.service.SubscriptionPlanService;
import com.erp.auth_service.utility.CompanySubscriptionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionPlanServiceImpl implements SubscriptionPlanService {

    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final SubscriptionPlanModuleRepository subscriptionPlanModuleRepository;
    private final CompanySubscriptionRepository companySubscriptionRepository;
    private final CompanyRepository companyRepository;
    private final ModuleRepository moduleRepository;
    private final CompanyModuleRepository companyModuleRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> getAllPlans(Boolean active, String search) {
        List<SubscriptionPlan> plans;
        if (active != null && active) {
            plans = subscriptionPlanRepository.findByActiveTrue();
        } else {
            plans = subscriptionPlanRepository.findAll();
        }

        if (search != null && !search.isBlank()) {
            String lowerSearch = search.trim().toLowerCase(Locale.ROOT);
            plans = plans.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase(Locale.ROOT).contains(lowerSearch))
                            || (p.getCode() != null && p.getCode().toLowerCase(Locale.ROOT).contains(lowerSearch)))
                    .toList();
        }

        return plans.stream()
                .map(this::toResponse)
                .sorted(Comparator.comparing(SubscriptionPlanResponse::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionPlanResponse getPlanById(UUID id) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + id));
        return toResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public SubscriptionPlanResponse getPlanByCode(String code) {
        SubscriptionPlan plan = subscriptionPlanRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with code: " + code));
        return toResponse(plan);
    }

    @Override
    @Transactional
    public SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request) {
        String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
        if (subscriptionPlanRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new DuplicateResourceException("Subscription plan with code '" + normalizedCode + "' already exists");
        }

        SubscriptionPlan plan = SubscriptionPlan.builder()
                .code(normalizedCode)
                .name(request.getName().trim())
                .description(request.getDescription())
                .durationDays(request.getDurationDays() != null ? request.getDurationDays() : 30)
                .maxCompanies(request.getMaxCompanies())
                .maxUsersPerCompany(request.getMaxUsersPerCompany() != null ? request.getMaxUsersPerCompany() : request.getMaxUsers())
                .maxUsers(request.getMaxUsersPerCompany() != null ? request.getMaxUsersPerCompany() : request.getMaxUsers())
                .price(request.getPrice() != null ? request.getPrice() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null && !request.getCurrency().isBlank()
                        ? request.getCurrency().trim().toUpperCase(Locale.ROOT)
                        : "INR")
                .active(request.getActive() != null ? request.getActive() : true)
                .isTrial(request.getIsTrial() != null ? request.getIsTrial() : false)
                .build();

        SubscriptionPlan savedPlan = subscriptionPlanRepository.save(plan);

        if (request.getModuleIds() != null && !request.getModuleIds().isEmpty()) {
            Set<UUID> uniqueModuleIds = new LinkedHashSet<>(request.getModuleIds());
            for (UUID moduleId : uniqueModuleIds) {
                Module module = moduleRepository.findById(moduleId)
                        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + moduleId));

                SubscriptionPlanModule planModule = SubscriptionPlanModule.builder()
                        .plan(savedPlan)
                        .module(module)
                        .active(true)
                        .build();
                subscriptionPlanModuleRepository.save(planModule);
            }
        }

        return toResponse(savedPlan);
    }

    @Override
    @Transactional
    public SubscriptionPlanResponse updatePlan(UUID id, SubscriptionPlanRequest request) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + id));

        if (request.getCode() != null && !request.getCode().isBlank()) {
            String normalizedCode = request.getCode().trim().toUpperCase(Locale.ROOT);
            if (!normalizedCode.equalsIgnoreCase(plan.getCode()) && subscriptionPlanRepository.existsByCodeIgnoreCase(normalizedCode)) {
                throw new DuplicateResourceException("Subscription plan with code '" + normalizedCode + "' already exists");
            }
            plan.setCode(normalizedCode);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            plan.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            plan.setDescription(request.getDescription());
        }
        if (request.getDurationDays() != null) {
            plan.setDurationDays(request.getDurationDays());
        }
        if (request.getPrice() != null) {
            BigDecimal oldPrice = plan.getPrice();
            BigDecimal newPrice = request.getPrice();
            if (oldPrice == null || oldPrice.compareTo(newPrice) != 0) {
                plan.setPrice(newPrice);
                if (plan.getRazorpayPlanId() != null) {
                    log.info("Plan price changed from {} to {} for plan [{}]. Clearing razorpayPlanId [{}] and bumping version",
                            oldPrice, newPrice, plan.getCode(), plan.getRazorpayPlanId());
                    plan.setRazorpayPlanId(null);
                    plan.setPlanVersion(bumpPlanVersion(plan.getPlanVersion()));
                }
            }
        }
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            plan.setCurrency(request.getCurrency().trim().toUpperCase(Locale.ROOT));
        }
        if (request.getActive() != null) {
            plan.setActive(request.getActive());
        }
        if (request.getIsTrial() != null) {
            plan.setIsTrial(request.getIsTrial());
        }
        if (request.getMaxCompanies() != null) {
            plan.setMaxCompanies(request.getMaxCompanies());
        }
        if (request.getMaxUsersPerCompany() != null) {
            plan.setMaxUsersPerCompany(request.getMaxUsersPerCompany());
        } else if (request.getMaxUsers() != null) {
            plan.setMaxUsersPerCompany(request.getMaxUsers());
        }

        SubscriptionPlan updatedPlan = subscriptionPlanRepository.save(plan);

        if (request.getModuleIds() != null) {
            syncPlanModules(updatedPlan, request.getModuleIds());
        }

        return toResponse(updatedPlan);
    }

    @Override
    @Transactional
    public void deletePlan(UUID id) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + id));

        // Soft-delete / deactivate to preserve historical integrity for companies already subscribed
        plan.setActive(false);
        subscriptionPlanRepository.save(plan);
        log.info("Subscription plan [{}] deactivated successfully", plan.getCode());
    }

    @Override
    @Transactional
    public SubscriptionPlanResponse togglePlanStatus(UUID id, Boolean active) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + id));

        plan.setActive(active != null ? active : !plan.getActive());
        SubscriptionPlan saved = subscriptionPlanRepository.save(plan);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SubscriptionPlanResponse assignModulesToPlan(UUID planId, List<UUID> moduleIds) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + planId));

        if (moduleIds == null) {
            moduleIds = Collections.emptyList();
        }

        syncPlanModules(plan, moduleIds);
        return toResponse(plan);
    }

    @Override
    @Transactional
    public SubscriptionPlanResponse removeModuleFromPlan(UUID planId, UUID moduleId) {
        SubscriptionPlan plan = subscriptionPlanRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("Subscription plan not found with id: " + planId));

        SubscriptionPlanModule planModule = subscriptionPlanModuleRepository
                .findByPlan_IdAndModule_Id(planId, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module mapping not found for plan: " + planId + " and module: " + moduleId));

        subscriptionPlanModuleRepository.delete(planModule);
        return toResponse(plan);
    }

    @Override
    @Transactional(readOnly = true)
    public CompanySubscriptionResponse getCurrentCompanySubscription(UUID companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        CompanySubscription sub = companySubscriptionRepository
                .findTopByCompany_IdOrderByCreatedAtDesc(companyId)
                .orElse(null);

        if (sub == null) {
            return CompanySubscriptionResponse.builder()
                    .companyId(company.getId())
                    .companyName(company.getCompanyName())
                    .companyCode(company.getCompanyCode())
                    .status(CompanySubscriptionStatus.EXPIRED)
                    .isExpired(true)
                    .provisionedModules(Collections.emptyList())
                    .build();
        }

        boolean isExpired = sub.getStatus() == CompanySubscriptionStatus.EXPIRED
                || (sub.getEndAt() != null && sub.getEndAt().isBefore(LocalDateTime.now()));

        List<String> activeModules = companyModuleRepository.findByCompany_IdAndActiveTrue(companyId).stream()
                .map(cm -> cm.getModule() != null ? cm.getModule().getName() : "")
                .filter(name -> !name.isBlank())
                .toList();

        return CompanySubscriptionResponse.builder()
                .id(sub.getId())
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .companyCode(company.getCompanyCode())
                .planId(sub.getPlan() != null ? sub.getPlan().getId() : null)
                .planName(sub.getPlan() != null ? sub.getPlan().getName() : null)
                .planCode(sub.getPlan() != null ? sub.getPlan().getCode() : null)
                .startAt(sub.getStartAt())
                .endAt(sub.getEndAt())
                .status(sub.getStatus())
                .autoRenew(sub.getAutoRenew())
                .isExpired(isExpired)
                .provisionedModules(activeModules)
                .createdAt(sub.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public CompanySubscription provisionCompanySubscription(Company company, SubscriptionPlan plan, LocalDateTime startAt) {
        if (company == null) {
            throw new BadRequestException("Company cannot be null when provisioning subscription");
        }
        if (plan == null) {
            throw new BadRequestException("Subscription plan cannot be null when provisioning subscription");
        }
        if (!Boolean.TRUE.equals(plan.getActive())) {
            throw new BadRequestException("Cannot assign inactive subscription plan: " + plan.getCode());
        }

        LocalDateTime effectiveStart = startAt != null ? startAt : LocalDateTime.now();
        int durationDays = (plan.getDurationDays() != null && plan.getDurationDays() > 0) ? plan.getDurationDays() : 30;
        LocalDateTime effectiveEnd = effectiveStart.plusDays(durationDays);

        CompanySubscriptionStatus initialStatus = Boolean.TRUE.equals(plan.getIsTrial())
                ? CompanySubscriptionStatus.TRIALING
                : CompanySubscriptionStatus.ACTIVE;

        CompanySubscription subscription = CompanySubscription.builder()
                .company(company)
                .plan(plan)
                .startAt(effectiveStart)
                .endAt(effectiveEnd)
                .status(initialStatus)
                .autoRenew(false)
                .build();

        CompanySubscription savedSub = companySubscriptionRepository.save(subscription);

        // Provision CompanyModules based on active PlanModules
        List<SubscriptionPlanModule> planModules = subscriptionPlanModuleRepository.findByPlan_IdAndActiveTrue(plan.getId());
        for (SubscriptionPlanModule spm : planModules) {
            Module mod = spm.getModule();
            if (mod != null && Boolean.TRUE.equals(mod.getModuleStatus()) && !"SYSTEM_ADMIN".equalsIgnoreCase(mod.getName())) {
                Optional<CompanyModule> existingCmOpt = companyModuleRepository.findByCompany_IdAndModule_Id(company.getId(), mod.getId());
                if (existingCmOpt.isPresent()) {
                    CompanyModule existingCm = existingCmOpt.get();
                    if (!Boolean.TRUE.equals(existingCm.getActive())) {
                        existingCm.setActive(true);
                        companyModuleRepository.save(existingCm);
                    }
                } else {
                    companyModuleRepository.save(CompanyModule.builder()
                            .company(company)
                            .module(mod)
                            .active(true)
                            .build());
                }
            }
        }

        log.info("Provisioned subscription [{}] with plan [{}] for company [{}]",
                savedSub.getId(), plan.getCode(), company.getCompanyCode());
        return savedSub;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCompanyEntitledToModule(UUID companyId, String moduleName) {
        if (companyId == null || moduleName == null || moduleName.isBlank()) {
            return false;
        }

        // Check if company has an active non-expired subscription
        Optional<CompanySubscription> subOpt = companySubscriptionRepository.findTopByCompany_IdOrderByCreatedAtDesc(companyId);
        if (subOpt.isEmpty()) {
            return false;
        }

        CompanySubscription sub = subOpt.get();
        if (sub.getStatus() == CompanySubscriptionStatus.EXPIRED
                || (sub.getEndAt() != null && sub.getEndAt().isBefore(LocalDateTime.now()))) {
            return false;
        }

        // Check if module is provisioned and active for company
        return companyModuleRepository.findByCompany_IdAndActiveTrue(companyId).stream()
                .anyMatch(cm -> cm.getModule() != null && moduleName.equalsIgnoreCase(cm.getModule().getName()));
    }

    private void syncPlanModules(SubscriptionPlan plan, List<UUID> targetModuleIds) {
        Set<UUID> targetSet = new LinkedHashSet<>(targetModuleIds != null ? targetModuleIds : Collections.emptyList());
        List<SubscriptionPlanModule> currentPlanModules = subscriptionPlanModuleRepository.findByPlan_Id(plan.getId());

        // Remove any plan module not in target set
        for (SubscriptionPlanModule current : currentPlanModules) {
            UUID moduleId = current.getModule() != null ? current.getModule().getId() : null;
            if (moduleId != null && !targetSet.contains(moduleId)) {
                subscriptionPlanModuleRepository.delete(current);
            }
        }

        // Add or reactivate modules in target set
        Map<UUID, SubscriptionPlanModule> existingByModuleId = currentPlanModules.stream()
                .filter(c -> c.getModule() != null)
                .collect(Collectors.toMap(c -> c.getModule().getId(), c -> c, (a, b) -> a));

        for (UUID modId : targetSet) {
            if (existingByModuleId.containsKey(modId)) {
                SubscriptionPlanModule existing = existingByModuleId.get(modId);
                if (!Boolean.TRUE.equals(existing.getActive())) {
                    existing.setActive(true);
                    subscriptionPlanModuleRepository.save(existing);
                }
            } else {
                Module module = moduleRepository.findById(modId)
                        .orElseThrow(() -> new ResourceNotFoundException("Module not found with id: " + modId));
                subscriptionPlanModuleRepository.save(SubscriptionPlanModule.builder()
                        .plan(plan)
                        .module(module)
                        .active(true)
                        .build());
            }
        }
    }

    private SubscriptionPlanResponse toResponse(SubscriptionPlan plan) {
        List<SubscriptionPlanModule> modules = subscriptionPlanModuleRepository.findByPlan_Id(plan.getId());
        List<SubscriptionPlanModuleResponse> moduleResponses = modules.stream()
                .map(spm -> SubscriptionPlanModuleResponse.builder()
                        .id(spm.getId())
                        .moduleId(spm.getModule() != null ? spm.getModule().getId() : null)
                        .moduleName(spm.getModule() != null ? spm.getModule().getName() : null)
                        .host(spm.getModule() != null ? spm.getModule().getHost() : null)
                        .active(spm.getActive())
                        .createdAt(spm.getCreatedAt())
                        .build())
                .sorted(Comparator.comparing(m -> m.getModuleName() != null ? m.getModuleName() : ""))
                .toList();

        return SubscriptionPlanResponse.builder()
                .id(plan.getId())
                .code(plan.getCode())
                .name(plan.getName())
                .description(plan.getDescription())
                .durationDays(plan.getDurationDays())
                .maxCompanies(plan.getMaxCompanies())
                .maxUsersPerCompany(plan.getMaxUsersPerCompany())
                .maxUsers(plan.getMaxUsersPerCompany())
                .price(plan.getPrice())
                .currency(plan.getCurrency())
                .active(plan.getActive())
                .isTrial(plan.getIsTrial())
                .modules(moduleResponses)
                .createdAt(plan.getCreatedAt())
                .updatedAt(plan.getUpdatedAt())
                .build();
    }

    private String bumpPlanVersion(String currentVersion) {
        if (currentVersion == null || currentVersion.isBlank()) {
            return "v2";
        }
        try {
            String clean = currentVersion.trim().toLowerCase(Locale.ROOT);
            if (clean.startsWith("v")) {
                int ver = Integer.parseInt(clean.substring(1));
                return "v" + (ver + 1);
            }
        } catch (NumberFormatException ignored) {}
        return currentVersion + "-v2";
    }
}
