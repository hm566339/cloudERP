package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.UpdateGeneralSettingsRequest;
import com.erp.auth_service.dto.request.UpdateLocalizationSettingsRequest;
import com.erp.auth_service.dto.request.UpdateOrganizationSettingsRequest;
import com.erp.auth_service.dto.response.GeneralSettingsResponse;
import com.erp.auth_service.dto.response.LocalizationSettingsResponse;
import com.erp.auth_service.dto.response.OrganizationSettingsResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.GeneralSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/settings", "/api/sso/settings"})
@RequiredArgsConstructor
@Slf4j
public class GeneralSettingsController {

    private final GeneralSettingsService generalSettingsService;

    // =========================================================================
    // 1. Organization Information APIs
    // =========================================================================

    @GetMapping("/organization")
    public ResponseEntity<ResponseWrapper<OrganizationSettingsResponse>> getOrganizationSettings() {
        RequestContext.Context context = requireOrganizationContext();
        OrganizationSettingsResponse response = generalSettingsService.getOrganizationSettings(context.organizationId());
        return ResponseEntity.ok(ResponseWrapper.success("Organization details fetched successfully", response));
    }

    @PutMapping("/organization")
    public ResponseEntity<ResponseWrapper<OrganizationSettingsResponse>> updateOrganizationSettings(
            @Valid @RequestBody(required = false) UpdateOrganizationSettingsRequest request) {
        RequestContext.Context context = requireOrganizationContext();
        UpdateOrganizationSettingsRequest safeRequest = request != null ? request : new UpdateOrganizationSettingsRequest();
        OrganizationSettingsResponse response = generalSettingsService.updateOrganizationSettings(
                context.organizationId(),
                context.userId(),
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("Organization details updated successfully", response));
    }

    // =========================================================================
    // 2. Localization & Formats APIs
    // =========================================================================

    @GetMapping("/localization")
    public ResponseEntity<ResponseWrapper<LocalizationSettingsResponse>> getLocalizationSettings() {
        RequestContext.Context context = requireOrganizationContext();
        LocalizationSettingsResponse response = generalSettingsService.getLocalizationSettings(context.organizationId());
        return ResponseEntity.ok(ResponseWrapper.success("Localization settings fetched successfully", response));
    }

    @PutMapping("/localization")
    public ResponseEntity<ResponseWrapper<LocalizationSettingsResponse>> updateLocalizationSettings(
            @Valid @RequestBody(required = false) UpdateLocalizationSettingsRequest request) {
        RequestContext.Context context = requireOrganizationContext();
        UpdateLocalizationSettingsRequest safeRequest = request != null ? request : new UpdateLocalizationSettingsRequest();
        LocalizationSettingsResponse response = generalSettingsService.updateLocalizationSettings(
                context.organizationId(),
                context.userId(),
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("Localization settings updated successfully", response));
    }

    // =========================================================================
    // 3. Combined General Settings APIs
    // =========================================================================

    @GetMapping({"/general", "", "/"})
    public ResponseEntity<ResponseWrapper<GeneralSettingsResponse>> getGeneralSettings() {
        RequestContext.Context context = requireOrganizationContext();
        GeneralSettingsResponse response = generalSettingsService.getGeneralSettings(context.organizationId());
        return ResponseEntity.ok(ResponseWrapper.success("General settings fetched successfully", response));
    }

    @PutMapping({"/general", "", "/"})
    public ResponseEntity<ResponseWrapper<GeneralSettingsResponse>> updateGeneralSettings(
            @Valid @RequestBody(required = false) UpdateGeneralSettingsRequest request) {
        RequestContext.Context context = requireOrganizationContext();
        UpdateGeneralSettingsRequest safeRequest = request != null ? request : new UpdateGeneralSettingsRequest();
        GeneralSettingsResponse response = generalSettingsService.updateGeneralSettings(
                context.organizationId(),
                context.userId(),
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("General settings updated successfully", response));
    }

    // =========================================================================
    // 4. Legacy Compatibility Endpoint (/api/settings/{companyId})
    // =========================================================================

    @GetMapping("/{companyId:[0-9a-fA-F\\-]{36}}")
    public ResponseEntity<ResponseWrapper<GeneralSettingsResponse>> getSettingsByCompanyId(@PathVariable UUID companyId) {
        RequestContext.Context context = requireOrganizationContext();
        GeneralSettingsResponse response = generalSettingsService.getGeneralSettings(context.organizationId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/{companyId:[0-9a-fA-F\\-]{36}}")
    public ResponseEntity<ResponseWrapper<GeneralSettingsResponse>> updateSettingsByCompanyId(
            @PathVariable UUID companyId,
            @Valid @RequestBody(required = false) UpdateGeneralSettingsRequest request) {
        RequestContext.Context context = requireOrganizationContext();
        UpdateGeneralSettingsRequest safeRequest = request != null ? request : new UpdateGeneralSettingsRequest();
        GeneralSettingsResponse response = generalSettingsService.updateGeneralSettings(
                context.organizationId(),
                context.userId(),
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("Settings updated successfully", response));
    }

    private RequestContext.Context requireOrganizationContext() {
        RequestContext.Context context = RequestContext.get();
        if (context == null || context.organizationId() == null) {
            log.warn("General settings request rejected: missing organization context in session");
            throw new ForbiddenException("Organization context required");
        }
        return context;
    }
}

