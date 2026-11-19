package com.erp.crm.modules.integration.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.integration.dto.AdminProviderResponse;
import com.erp.crm.modules.integration.dto.AdminProviderUpdateRequest;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import com.erp.crm.modules.integration.service.TwoTierIntegrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Layer 1: SystemAdmin Controller for Global Provider Configurations.
 * Requires ROLE_SYSTEM_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/integrations/providers")
@RequiredArgsConstructor
@Tag(name = "Admin Integration Providers", description = "SystemAdmin APIs for Global OAuth & Marketplace Provider Configurations")
public class AdminIntegrationProviderController {

    private final TwoTierIntegrationService integrationService;

    @GetMapping
    @Operation(summary = "SystemAdmin: List Global Integration Providers & Configs")
    public ResponseEntity<ApiResponse<List<AdminProviderResponse>>> listAllProviders() {
        List<AdminProviderResponse> providers = integrationService.listAllProvidersForAdmin();
        return ResponseEntity.ok(ApiResponse.success(providers));
    }

    @PutMapping("/{code}")
    @Operation(summary = "SystemAdmin: Update Global Provider Configuration (OAuth keys, base URLs, mappings)")
    public ResponseEntity<ApiResponse<AdminProviderResponse>> updateProvider(
            @PathVariable IntegrationProviderCode code,
            @RequestBody @Valid ApiRequest<AdminProviderUpdateRequest> request) {
        AdminProviderUpdateRequest data = request != null && request.getData() != null
                ? request.getData()
                : new AdminProviderUpdateRequest();
        AdminProviderResponse response = integrationService.updateProvider(code, data);
        return ResponseEntity.ok(ApiResponse.success(response, "Provider updated successfully"));
    }
}
