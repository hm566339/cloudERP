package com.erp.crm.modules.integration.service;

import com.erp.crm.modules.integration.dto.*;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface TwoTierIntegrationService {

    // --- Layer 1: SystemAdmin Global Configuration ---
    List<AdminProviderResponse> listAllProvidersForAdmin();

    AdminProviderResponse getProviderForAdmin(IntegrationProviderCode code);

    default AdminProviderResponse getProviderForAdmin(String code) {
        return getProviderForAdmin(IntegrationProviderCode.fromString(code));
    }

    AdminProviderResponse updateProvider(IntegrationProviderCode code, AdminProviderUpdateRequest request);

    default AdminProviderResponse updateProvider(String code, AdminProviderUpdateRequest request) {
        return updateProvider(IntegrationProviderCode.fromString(code), request);
    }

    AdminProviderResponse createProvider(AdminProviderCreateRequest request);

    // --- Layer 2: Authorized Tenant User Operations ---
    List<AvailableProviderResponse> listAvailableProviders();

    default String getOAuthAuthorizeUrl(IntegrationProviderCode code, String customRedirectUri) {
        return getOAuthAuthorizeUrl(code, customRedirectUri, null, null);
    }

    default String getOAuthAuthorizeUrl(IntegrationProviderCode code, String customRedirectUri, String returnUrl) {
        return getOAuthAuthorizeUrl(code, customRedirectUri, returnUrl, null);
    }

    String getOAuthAuthorizeUrl(IntegrationProviderCode code, String customRedirectUri, String returnUrl, UUID companyId);

    String handleOAuthCallbackRedirect(IntegrationProviderCode code, String authCode, String state, String error, String errorDescription);

    OAuthCallbackResponse handleOAuthCallback(IntegrationProviderCode code, OAuthCallbackRequest request);

    ConnectionTestResponse testConnection(ConnectionTestRequest request);

    TenantIntegrationDetailResponse connect(TenantIntegrationConnectRequest request, UUID companyId);

    void disconnect(UUID id, UUID companyId);

    List<TenantIntegrationDetailResponse> getTenantIntegrations(UUID companyId);

    TenantIntegrationDetailResponse getTenantIntegration(UUID id, UUID companyId);

    default SyncTriggerResponse triggerSync(UUID id) {
        return triggerSync(id, null);
    }

    SyncTriggerResponse triggerSync(UUID id, UUID companyId);

    // --- Facebook / Instagram Lead Ads Specialization ---
    Map<String, Object> subscribeFacebookPage(String pageId, boolean subscribe, UUID companyId);

    Map<String, Object> updateFacebookPageMapping(String pageId, java.util.Map<String, Object> mappingRequest,
            UUID companyId);

    OAuthCallbackResponse getFacebookAccountDetails(UUID companyId);

    String verifyFacebookWebhook(String mode, String challenge, String verifyToken);

    WebhookAckResponse handleFacebookWebhook(String rawPayload, String sourceIp, Map<String, String> headers);
}
