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
        UUID orgId = null;
        if (explicitOrgId != null) {
            orgId = explicitOrgId;
        } else if (headerOrgId != null) {
            orgId = headerOrgId;
        } else {
            RequestContext.Context ctx = RequestContext.get();
            if (ctx != null && ctx.organizationId() != null) {
                orgId = ctx.organizationId();
            } else if (ctx != null && ctx.companyId() != null && companyRepository != null) {
                var compOpt = companyRepository.findById(ctx.companyId());
                if (compOpt.isPresent() && compOpt.get().getOrganization() != null) {
                    orgId = compOpt.get().getOrganization().getId();
                }
            } else if (ctx != null && ctx.userId() != null && organizationMemberRepository != null) {
                var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                        ctx.userId(), com.erp.auth_service.utility.MembershipStatus.ACTIVE);
                if (activeMembers.size() == 1) {
                    orgId = activeMembers.get(0).getOrganization().getId();
                }
            }
        }

        if (orgId == null) {
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context current = RequestContext.get();
        UUID userId = current != null ? current.userId() : null;
        if (userId != null && organizationMemberRepository != null) {
            boolean isMember = organizationMemberRepository
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, com.erp.auth_service.utility.MembershipStatus.ACTIVE)
                    .isPresent();
            if (!isMember) {
                throw new ForbiddenException("Active organization membership required");
            }
        }

        if (current != null && (current.organizationId() == null || !current.organizationId().equals(orgId))) {
            RequestContext.set(current.userId(), orgId, current.companyId(), current.clientId(), current.accessMode());
        }

        return orgId;
    }
}
