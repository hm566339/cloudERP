package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.role_template.OrganizationRoleTemplateDto;
import com.erp.auth_service.dto.role_template.PermissionCatalogDto;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/sso/organization/permissions", "/api/organization/permissions"})
@RequiredArgsConstructor
@Slf4j
public class OrganizationPermissionController {

    private final OrganizationRoleTemplateService roleTemplateService;

    @GetMapping("/catalog")
    public ResponseEntity<ResponseWrapper<PermissionCatalogDto>> getCatalog(
            @RequestParam(required = false) UUID organizationId) {
        UUID orgId = resolveOrgId(organizationId);
        PermissionCatalogDto catalog = roleTemplateService.getPermissionCatalog(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(catalog));
    }

    @GetMapping("/matrix")
    public ResponseEntity<ResponseWrapper<List<OrganizationRoleTemplateDto>>> getMatrix(
            @RequestParam(required = false) UUID organizationId) {
        UUID orgId = resolveOrgId(organizationId);
        List<OrganizationRoleTemplateDto> matrix = roleTemplateService.getOrganizationPermissionMatrix(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(matrix));
    }

    private UUID resolveOrgId(UUID explicitOrgId) {
        if (explicitOrgId != null) {
            return explicitOrgId;
        }
        RequestContext.Context ctx = RequestContext.get();
        if (ctx == null || ctx.organizationId() == null) {
            throw new ForbiddenException("Organization context is required");
        }
        return ctx.organizationId();
    }
}

