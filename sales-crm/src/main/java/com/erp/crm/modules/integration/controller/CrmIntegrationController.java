package com.erp.crm.modules.integration.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.integration.dto.*;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.enums.TenantIntegrationStatus;
import com.erp.crm.modules.integration.service.CrmIntegrationService;
import com.erp.crm.modules.integration.service.TwoTierIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/crm/integrations")
@RequiredArgsConstructor
@Tag(name = "Integration & Ingestion", description = "2-Tier Multi-Tenant Marketplace Connectors (Facebook, IndiaMART, TradeIndia, Custom Webhook)")
public class CrmIntegrationController {

    private final CrmIntegrationService integrationService;
    private final TwoTierIntegrationService twoTierIntegrationService;

    // =========================================================================
    // LAYER 2: AUTHORIZED TENANT USER ENDPOINTS
    // =========================================================================

    @GetMapping("/available")
    @Operation(summary = "Authorized User: List Enabled Integration Providers (NEVER exposes secrets)")
    public ResponseEntity<ApiResponse<List<AvailableProviderResponse>>> getAvailableProviders() {
        List<AvailableProviderResponse> list = twoTierIntegrationService.listAvailableProviders();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/oauth/{providerCode}/authorize")
    @Operation(summary = "Authorized User: Get OAuth2 Authorization URL for Provider (e.g. Facebook)")
    public ResponseEntity<ApiResponse<Map<String, String>>> getOAuthAuthorizeUrl(
            @PathVariable IntegrationProviderCode providerCode,
            @RequestParam(required = false) String redirectUri) {
        String url = twoTierIntegrationService.getOAuthAuthorizeUrl(providerCode, redirectUri);
        return ResponseEntity.ok(ApiResponse.success(Map.of("authorizeUrl", url)));
    }

    @PostMapping("/oauth/{providerCode}/callback")
    @Operation(summary = "Authorized User: Handle OAuth2 Callback and Retrieve Facebook Pages/Lead Forms")
    public ResponseEntity<ApiResponse<OAuthCallbackResponse>> handleOAuthCallback(
            @PathVariable IntegrationProviderCode providerCode,
            @RequestBody @Valid ApiRequest<OAuthCallbackRequest> request) {
        OAuthCallbackRequest data = request != null && request.getData() != null
                ? request.getData()
                : new OAuthCallbackRequest();
        OAuthCallbackResponse response = twoTierIntegrationService.handleOAuthCallback(providerCode, data);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/facebook/pages/{pageId}/subscribe")
    @Operation(summary = "Authorized User: Toggle Meta Webhook Leadgen Subscription for Facebook Page")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subscribeFacebookPage(
            @PathVariable String pageId,
            @RequestParam(defaultValue = "true") boolean subscribe,
            @RequestParam(required = false) UUID companyId) {
        Map<String, Object> response = twoTierIntegrationService.subscribeFacebookPage(pageId, subscribe, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/facebook/pages/{pageId}/mapping")
    @Operation(summary = "Authorized User: Update Page and Lead Form Routing Mapping")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateFacebookPageMapping(
            @PathVariable String pageId,
            @RequestBody @Valid ApiRequest<Map<String, Object>> request,
            @RequestParam(required = false) UUID companyId) {
        Map<String, Object> data = request != null && request.getData() != null
                ? request.getData()
                : new HashMap<>();
        Map<String, Object> response = twoTierIntegrationService.updateFacebookPageMapping(pageId, data, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/facebook/account")
    @Operation(summary = "Authorized User: Get Connected Facebook Account Details and Managed Pages")
    public ResponseEntity<ApiResponse<OAuthCallbackResponse>> getFacebookAccountDetails(
            @RequestParam(required = false) UUID companyId) {
        OAuthCallbackResponse response = twoTierIntegrationService.getFacebookAccountDetails(companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/test-connection")
    @Operation(summary = "Authorized User: Validate Provider Credentials (e.g. IndiaMART CRM key) Before Saving")
    public ResponseEntity<ApiResponse<ConnectionTestResponse>> testConnection(
            @RequestBody @Valid ApiRequest<ConnectionTestRequest> request) {
        ConnectionTestRequest data = request != null && request.getData() != null
                ? request.getData()
                : new ConnectionTestRequest();
        ConnectionTestResponse response = twoTierIntegrationService.testConnection(data);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/connect")
    @Operation(summary = "Authorized User: Connect Tenant Integration Channel with Encrypted Credentials & Routing")
    public ResponseEntity<ApiResponse<TenantIntegrationDetailResponse>> connectIntegration(
            @RequestBody @Valid ApiRequest<TenantIntegrationConnectRequest> request,
            @RequestParam(required = false) UUID companyId) {
        TenantIntegrationConnectRequest data = request != null && request.getData() != null
                ? request.getData()
                : new TenantIntegrationConnectRequest();
        TenantIntegrationDetailResponse response = twoTierIntegrationService.connect(data, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Integration connected successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Authorized User: Disconnect / Delete Tenant Integration")
    public ResponseEntity<ApiResponse<Void>> deleteIntegration(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        twoTierIntegrationService.disconnect(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Integration deleted successfully"));
    }

    @PostMapping("/{id}/disconnect")
    @Operation(summary = "Authorized User: Disconnect / Deactivate Tenant Integration (POST alternative)")
    public ResponseEntity<ApiResponse<Void>> disconnectIntegrationPost(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        twoTierIntegrationService.disconnect(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Integration disconnected successfully"));
    }

    @PostMapping("/batch-delete")
    @Operation(summary = "Authorized User: Batch Delete / Disconnect Tenant Integrations")
    public ResponseEntity<ApiResponse<Map<String, Object>>> batchDeleteIntegrations(
            @RequestBody @Valid ApiRequest<List<UUID>> request,
            @RequestParam(required = false) UUID companyId) {
        List<UUID> ids = request != null && request.getData() != null ? request.getData() : Collections.emptyList();
        int count = 0;
        for (UUID id : ids) {
            try {
                twoTierIntegrationService.disconnect(id, companyId);
                count++;
            } catch (Exception e) {
                // Ignore individual deletion errors in batch
            }
        }
        return ResponseEntity.ok(ApiResponse.success(Map.of("deletedCount", count), "Integrations deleted successfully"));
    }

    @GetMapping
    @Operation(summary = "List Tenant Active Integrations")
    public ResponseEntity<ApiResponse<List<TenantIntegrationDetailResponse>>> getTenantIntegrations(
            @RequestParam(required = false) UUID companyId) {
        List<TenantIntegrationDetailResponse> list = twoTierIntegrationService.getTenantIntegrations(companyId);
        if (list.isEmpty()) {
            List<TenantIntegrationResponse> legacy = integrationService.getTenantIntegrations(companyId);
            if (!legacy.isEmpty()) {
                List<TenantIntegrationDetailResponse> converted = legacy.stream()
                        .map(l -> TenantIntegrationDetailResponse.builder()
                                .id(l.getId())
                                .tenantId(l.getCompanyId())
                                .integrationName(l.getConnectionName())
                                .status(TenantIntegrationStatus.CONNECTED)
                                .webhookSlug(l.getWebhookSlug())
                                .webhookUrl(l.getWebhookUrl())
                                .lastSyncedAt(l.getLastSyncAt())
                                .createdAt(l.getCreatedAt())
                                .build())
                        .toList();
                return ResponseEntity.ok(ApiResponse.success(converted));
            }
        }
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @Operation(summary = "Create / Connect Tenant Integration (Legacy Endpoint)")
    public ResponseEntity<ApiResponse<TenantIntegrationResponse>> createTenantIntegration(
            @RequestBody @Valid ApiRequest<TenantIntegrationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        TenantIntegrationResponse response = integrationService.createTenantIntegration(apiRequest.getData(),
                companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Integration created successfully"));
    }

    // =========================================================================
    // PUBLIC INBOUND WEBHOOK LISTENERS & SYNC TRIGGER
    // =========================================================================

    @GetMapping(value = "/webhook/{slug}", produces = org.springframework.http.MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Meta Ads / Webhook Verification Handshake (hub.challenge)")
    public ResponseEntity<String> verifyWebhook(
            @PathVariable String slug,
            @RequestParam(name = "hub.mode", required = false) String hubMode,
            @RequestParam(name = "hub.challenge", required = false) String hubChallenge,
            @RequestParam(name = "hub.verify_token", required = false) String hubVerifyToken,
            @RequestParam(name = "hub_mode", required = false) String altMode,
            @RequestParam(name = "hub_challenge", required = false) String altChallenge,
            @RequestParam(name = "hub_verify_token", required = false) String altVerifyToken) {
        String mode = hubMode != null ? hubMode : altMode;
        String challenge = hubChallenge != null ? hubChallenge : altChallenge;
        String verifyToken = hubVerifyToken != null ? hubVerifyToken : altVerifyToken;

        String result = integrationService.verifyWebhook(slug, mode, challenge, verifyToken);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/webhook/{slug}")
    @Operation(summary = "Public Inbound Webhook Listener (IndiaMART, Meta, Google, etc.)")
    public ResponseEntity<WebhookAckResponse> handleWebhook(
            @PathVariable String slug,
            @RequestBody String rawPayload,
            HttpServletRequest request) {
        Map<String, String> headers = new HashMap<>();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames != null && headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            headers.put(name, request.getHeader(name));
        }

        WebhookAckResponse ack = integrationService.handleWebhook(slug, rawPayload, request.getRemoteAddr(), headers);
        return ResponseEntity.ok(ack);
    }

    @GetMapping("/channels")
    @Operation(summary = "List Master Integration Channels Catalog")
    public ResponseEntity<ApiResponse<List<CrmIntegrationChannel>>> listAvailableChannels() {
        List<CrmIntegrationChannel> list = integrationService.listAvailableChannels();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/{id}/sync")
    @Operation(summary = "Trigger Manual Pull Sync for Polling Channels")
    public ResponseEntity<ApiResponse<com.erp.crm.modules.integration.dto.SyncTriggerResponse>> triggerSync(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        com.erp.crm.modules.integration.dto.SyncTriggerResponse response = integrationService.triggerSync(id,
                companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sync triggered successfully"));
    }
}
