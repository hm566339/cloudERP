package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAppearanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sso/organization/appearance")
@RequiredArgsConstructor
@Slf4j
public class OrganizationAppearanceController {

    private final OrganizationAppearanceService appearanceService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> getAppearance() {
        RequestContext.Context context = requireOrganizationContext();
        OrganizationAppearanceResponse response = appearanceService.getAppearance(context.organizationId());
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> updateAppearance(
            @Valid @RequestBody(required = false) UpdateOrganizationAppearanceRequest request) {
        RequestContext.Context context = requireOrganizationContext();
        UpdateOrganizationAppearanceRequest safeRequest = request != null ? request : new UpdateOrganizationAppearanceRequest();
        OrganizationAppearanceResponse response = appearanceService.updateAppearance(
                context.organizationId(),
                context.userId(),
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("Appearance settings updated successfully", response));
    }

    @PostMapping("/reset")
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> resetAppearance() {
        RequestContext.Context context = requireOrganizationContext();
        OrganizationAppearanceResponse response = appearanceService.resetAppearance(
                context.organizationId(),
                context.userId());
        return ResponseEntity.ok(ResponseWrapper.success("Appearance settings reset to default", response));
    }

    private RequestContext.Context requireOrganizationContext() {
        RequestContext.Context context = RequestContext.get();
        if (context == null || context.organizationId() == null) {
            log.warn("Organization appearance request rejected: missing organization context in session");
            throw new ForbiddenException("Organization context required");
        }
        return context;
    }
}

