package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.OrganizationSubscriptionResponse;
import com.erp.auth_service.dto.response.OrganizationSubscriptionUsageResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping({"/api/sso/subscription", "/api/subscription"})
@RequiredArgsConstructor
@Slf4j
public class OrganizationSubscriptionController {

    private final OrganizationSettingsService settingsService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<OrganizationSubscriptionResponse>> getSubscription(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        RequestContext.Context ctx = RequestContext.get();
        UUID orgId = organizationId != null ? organizationId : (headerOrgId != null ? headerOrgId : (ctx != null ? ctx.organizationId() : null));
        UUID userId = ctx != null ? ctx.userId() : null;
        if (orgId == null) {
            throw new BadRequestException("Organization context is required");
        }
        OrganizationSubscriptionResponse response = settingsService.getSubscription(orgId, userId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/usage")
    public ResponseEntity<ResponseWrapper<OrganizationSubscriptionUsageResponse>> getSubscriptionUsage(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        RequestContext.Context ctx = RequestContext.get();
        UUID orgId = organizationId != null ? organizationId : (headerOrgId != null ? headerOrgId : (ctx != null ? ctx.organizationId() : null));
        UUID userId = ctx != null ? ctx.userId() : null;
        if (orgId == null) {
            throw new BadRequestException("Organization context is required");
        }
        OrganizationSubscriptionUsageResponse response = settingsService.getSubscriptionUsage(orgId, userId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }
}

