package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.*;
import com.erp.auth_service.dto.response.*;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/organization", "/api/sso/organization"})
@RequiredArgsConstructor
@Slf4j
public class OrganizationSettingsController {

    private final OrganizationSettingsService settingsService;

    // ─────────────────────────────────────────────────────────────────────────
    // 1. Organization Profile
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public ResponseEntity<ResponseWrapper<OrganizationProfileResponse>> getProfile() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationProfileResponse response = settingsService.getProfile(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/profile")
    public ResponseEntity<ResponseWrapper<OrganizationProfileResponse>> updateProfile(
            @Valid @RequestBody(required = false) UpdateOrganizationProfileRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationProfileResponse response = settingsService.updateProfile(ctx.organizationId(), ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. Dedicated Login Portal
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/login-portal")
    public ResponseEntity<ResponseWrapper<OrganizationLoginPortalResponse>> getLoginPortal() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationLoginPortalResponse response = settingsService.getLoginPortal(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. Regional & Fiscal Defaults
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/regional-settings")
    public ResponseEntity<ResponseWrapper<OrganizationRegionalSettingsResponse>> getRegionalSettings() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationRegionalSettingsResponse response = settingsService.getRegionalSettings(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/regional-settings")
    public ResponseEntity<ResponseWrapper<OrganizationRegionalSettingsResponse>> updateRegionalSettings(
            @Valid @RequestBody(required = false) UpdateRegionalSettingsRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationRegionalSettingsResponse response = settingsService.updateRegionalSettings(ctx.organizationId(), ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. Security & Compliance
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/security")
    public ResponseEntity<ResponseWrapper<OrganizationSecuritySettingsResponse>> getSecuritySettings() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationSecuritySettingsResponse response = settingsService.getSecuritySettings(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/security")
    public ResponseEntity<ResponseWrapper<OrganizationSecuritySettingsResponse>> updateSecuritySettings(
            @Valid @RequestBody(required = false) UpdateSecuritySettingsRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationSecuritySettingsResponse response = settingsService.updateSecuritySettings(ctx.organizationId(), ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. Multi-Company Management
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/companies")
    public ResponseEntity<ResponseWrapper<OrganizationCompanyListResponse>> getCompanies() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationCompanyListResponse response = settingsService.getCompanies(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/companies")
    public ResponseEntity<ResponseWrapper<OrganizationCompanyResponse>> createCompany(
            @Valid @RequestBody CreateOrganizationCompanyRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationCompanyResponse response = settingsService.createCompany(ctx.organizationId(), ctx.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.success(response));
    }

    @GetMapping("/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<OrganizationCompanyResponse>> getCompanyById(@PathVariable UUID companyId) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationCompanyResponse response = settingsService.getCompanyById(ctx.organizationId(), companyId, ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<OrganizationCompanyResponse>> updateCompany(
            @PathVariable UUID companyId,
            @Valid @RequestBody UpdateOrganizationCompanyRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationCompanyResponse response = settingsService.updateCompany(ctx.organizationId(), companyId, ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @DeleteMapping("/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> deleteCompany(@PathVariable UUID companyId) {
        RequestContext.Context ctx = getRequiredContext();
        settingsService.deleteCompany(ctx.organizationId(), companyId, ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company archived successfully")));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. Subscription Plan & Usage
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/subscription")
    public ResponseEntity<ResponseWrapper<OrganizationSubscriptionResponse>> getSubscription() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationSubscriptionResponse response = settingsService.getSubscription(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/subscription/usage")
    public ResponseEntity<ResponseWrapper<OrganizationSubscriptionUsageResponse>> getSubscriptionUsage() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationSubscriptionUsageResponse response = settingsService.getSubscriptionUsage(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. Entitled Modules
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/modules")
    public ResponseEntity<ResponseWrapper<OrganizationModulesResponse>> getModules() {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationModulesResponse response = settingsService.getModules(ctx.organizationId(), ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/modules")
    public ResponseEntity<ResponseWrapper<OrganizationModulesResponse>> updateModules(
            @Valid @RequestBody(required = false) UpdateOrganizationModulesRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        OrganizationModulesResponse response = settingsService.updateModules(ctx.organizationId(), ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/companies/{companyId}/modules")
    public ResponseEntity<ResponseWrapper<CompanyModulesResponse>> getCompanyModules(@PathVariable UUID companyId) {
        RequestContext.Context ctx = getRequiredContext();
        CompanyModulesResponse response = settingsService.getCompanyModules(ctx.organizationId(), companyId, ctx.userId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping("/companies/{companyId}/modules")
    public ResponseEntity<ResponseWrapper<CompanyModulesResponse>> updateCompanyModules(
            @PathVariable UUID companyId,
            @Valid @RequestBody(required = false) UpdateCompanyModulesRequest request) {
        RequestContext.Context ctx = getRequiredContext();
        CompanyModulesResponse response = settingsService.updateCompanyModules(ctx.organizationId(), companyId, ctx.userId(), request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private RequestContext.Context getRequiredContext() {
        RequestContext.Context ctx = RequestContext.get();
        if (ctx == null || ctx.organizationId() == null) {
            throw new ForbiddenException("Organization context is required. Please authenticate into an active organization.");
        }
        return ctx;
    }
}

