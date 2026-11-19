package com.erp.crm.modules.integration.service;

import com.erp.crm.modules.integration.dto.*;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface TwoTierIntegrationService {

    // --- Layer 1: SystemAdmin Global Configuration ---
    List<AdminProviderResponse> listAllProvidersForAdmin();

    AdminProviderResponse updateProvider(IntegrationProviderCode code, AdminProviderUpdateRequest request);

    // --- Layer 2: Authorized Tenant User Operations ---
    List<AvailableProviderResponse> listAvailableProviders();

    String getOAuthAuthorizeUrl(IntegrationProviderCode code, String customRedirectUri);

    OAuthCallbackResponse handleOAuthCallback(IntegrationProviderCode code, OAuthCallbackRequest request);

    ConnectionTestResponse testConnection(ConnectionTestRequest request);

    TenantIntegrationDetailResponse connect(TenantIntegrationConnectRequest request, UUID companyId);

    void disconnect(UUID id, UUID companyId);

    List<TenantIntegrationDetailResponse> getTenantIntegrations(UUID companyId);

    TenantIntegrationDetailResponse getTenantIntegration(UUID id, UUID companyId);

    // --- Facebook / Instagram Lead Ads Specialization ---
    Map<String, Object> subscribeFacebookPage(String pageId, boolean subscribe, UUID companyId);

    Map<String, Object> updateFacebookPageMapping(String pageId, java.util.Map<String, Object> mappingRequest,
            UUID companyId);

    OAuthCallbackResponse getFacebookAccountDetails(UUID companyId);
}
