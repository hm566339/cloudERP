package com.erp.crm.modules.integration.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.integration.dto.TenantIntegrationRequest;
import com.erp.crm.modules.integration.dto.TenantIntegrationResponse;
import com.erp.crm.modules.integration.dto.WebhookAckResponse;
import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.service.CrmIntegrationService;
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
@Tag(name = "Integration & Ingestion", description = "Endpoints for Marketplace Connectors (IndiaMART, TradeIndia, Meta Ads) & Inbound Webhooks")
public class CrmIntegrationController {

    private final CrmIntegrationService integrationService;

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

    @GetMapping
    @Operation(summary = "List Tenant Active Integrations")
    public ResponseEntity<ApiResponse<List<TenantIntegrationResponse>>> getTenantIntegrations(
            @RequestParam(required = false) UUID companyId) {
        List<TenantIntegrationResponse> list = integrationService.getTenantIntegrations(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    @Operation(summary = "Create / Connect Tenant Integration")
    public ResponseEntity<ApiResponse<TenantIntegrationResponse>> createTenantIntegration(
            @RequestBody @Valid ApiRequest<TenantIntegrationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        TenantIntegrationResponse response = integrationService.createTenantIntegration(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Integration created successfully"));
    }

    @PostMapping("/{id}/sync")
    @Operation(summary = "Trigger Manual Pull Sync for Polling Channels")
    public ResponseEntity<ApiResponse<com.erp.crm.modules.integration.dto.SyncTriggerResponse>> triggerSync(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        com.erp.crm.modules.integration.dto.SyncTriggerResponse response = integrationService.triggerSync(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sync triggered successfully"));
    }
}

