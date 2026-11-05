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
@RequestMapping({ "/api/sso/organization/permissions", "/api/organization/permissions" })
@RequiredArgsConstructor
@Slf4j
public class OrganizationPermissionController {

    private final OrganizationRoleTemplateService roleTemplateService;
    private final com.erp.auth_service.repository.CompanyRepository companyRepository;
    private final com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository;

    @GetMapping("/catalog")
    public ResponseEntity<ResponseWrapper<PermissionCatalogDto>> getCatalog(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        PermissionCatalogDto catalog = roleTemplateService.getPermissionCatalog(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(catalog));
    }

    @GetMapping("/matrix")
    public ResponseEntity<ResponseWrapper<List<OrganizationRoleTemplateDto>>> getMatrix(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        List<OrganizationRoleTemplateDto> matrix = roleTemplateService.getOrganizationPermissionMatrix(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(matrix));
    }


    private UUID resolveOrgId(UUID explicitOrgId, UUID headerOrgId) {
        if (explicitOrgId != null) {
            return explicitOrgId;
        }
        if (headerOrgId != null) {
            return headerOrgId;
        }
        RequestContext.Context ctx = RequestContext.get();
        if (ctx != null && ctx.organizationId() != null) {
            return ctx.organizationId();
        }
        if (ctx != null && ctx.companyId() != null && companyRepository != null) {
            var compOpt = companyRepository.findById(ctx.companyId());
            if (compOpt.isPresent() && compOpt.get().getOrganization() != null) {
                return compOpt.get().getOrganization().getId();
            }
        }
        if (ctx != null && ctx.userId() != null && organizationMemberRepository != null) {
            var memberOpt = organizationMemberRepository.findFirstByUser_IdAndMembershipStatus(
                    ctx.userId(), com.erp.auth_service.utility.MembershipStatus.ACTIVE);
            if (memberOpt.isPresent()) {
                return memberOpt.get().getOrganization().getId();
            }
        }
        throw new ForbiddenException("Organization context is required");
    }
}
