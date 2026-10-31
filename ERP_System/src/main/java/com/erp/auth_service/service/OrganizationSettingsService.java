package com.erp.auth_service.service;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;

import java.util.UUID;

public interface OrganizationSettingsService {

    // 1. Organization Profile
    OrganizationProfileResponse getProfile(UUID organizationId, UUID actorUserId);
    OrganizationProfileResponse updateProfile(UUID organizationId, UUID actorUserId, UpdateOrganizationProfileRequest request);

    // 2. Dedicated Login Portal
    OrganizationLoginPortalResponse getLoginPortal(UUID organizationId, UUID actorUserId);

    // 3. Regional & Fiscal Defaults
    OrganizationRegionalSettingsResponse getRegionalSettings(UUID organizationId, UUID actorUserId);
    OrganizationRegionalSettingsResponse updateRegionalSettings(UUID organizationId, UUID actorUserId, UpdateRegionalSettingsRequest request);

    // 4. Security & Compliance
    OrganizationSecuritySettingsResponse getSecuritySettings(UUID organizationId, UUID actorUserId);
    OrganizationSecuritySettingsResponse updateSecuritySettings(UUID organizationId, UUID actorUserId, UpdateSecuritySettingsRequest request);

    // 5. Multi-Company Management
    OrganizationCompanyListResponse getCompanies(UUID organizationId, UUID actorUserId);
    OrganizationCompanyResponse createCompany(UUID organizationId, UUID actorUserId, CreateOrganizationCompanyRequest request);
    OrganizationCompanyResponse getCompanyById(UUID organizationId, UUID companyId, UUID actorUserId);
    OrganizationCompanyResponse updateCompany(UUID organizationId, UUID companyId, UUID actorUserId, UpdateOrganizationCompanyRequest request);
    void deleteCompany(UUID organizationId, UUID companyId, UUID actorUserId);

    // 6. Subscription & Usage
    OrganizationSubscriptionResponse getSubscription(UUID organizationId, UUID actorUserId);
    OrganizationSubscriptionUsageResponse getSubscriptionUsage(UUID organizationId, UUID actorUserId);

    // 7. Entitled Modules
    OrganizationModulesResponse getModules(UUID organizationId, UUID actorUserId);
    OrganizationModulesResponse updateModules(UUID organizationId, UUID actorUserId, UpdateOrganizationModulesRequest request);
    CompanyModulesResponse getCompanyModules(UUID organizationId, UUID companyId, UUID actorUserId);
    CompanyModulesResponse updateCompanyModules(UUID organizationId, UUID companyId, UUID actorUserId, UpdateCompanyModulesRequest request);
}

