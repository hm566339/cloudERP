package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.SubscriptionPlanRequest;
import com.erp.auth_service.dto.response.CompanySubscriptionResponse;
import com.erp.auth_service.dto.response.SubscriptionPlanResponse;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.CompanySubscription;
import com.erp.auth_service.model.SubscriptionPlan;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SubscriptionPlanService {

    List<SubscriptionPlanResponse> getAllPlans(Boolean active, String search);

    SubscriptionPlanResponse getPlanById(UUID id);

    SubscriptionPlanResponse getPlanByCode(String code);

    SubscriptionPlanResponse createPlan(SubscriptionPlanRequest request);

    SubscriptionPlanResponse updatePlan(UUID id, SubscriptionPlanRequest request);

    void deletePlan(UUID id);

    SubscriptionPlanResponse togglePlanStatus(UUID id, Boolean active);

    SubscriptionPlanResponse assignModulesToPlan(UUID planId, List<UUID> moduleIds);

    SubscriptionPlanResponse removeModuleFromPlan(UUID planId, UUID moduleId);

    CompanySubscriptionResponse getCurrentCompanySubscription(UUID companyId);

    CompanySubscription provisionCompanySubscription(Company company, SubscriptionPlan plan, LocalDateTime startAt);

    boolean isCompanyEntitledToModule(UUID companyId, String moduleName);
}
