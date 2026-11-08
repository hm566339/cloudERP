package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.role_template.OrganizationRoleTemplateDto;
import com.erp.auth_service.dto.role_template.PermissionCatalogDto;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.PlatformAdminPrincipal;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
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
        String source = "UNKNOWN";
        UUID orgId = null;
        if (explicitOrgId != null) {
            orgId = explicitOrgId;
            source = "QUERY_PARAM";
        } else if (headerOrgId != null) {
            orgId = headerOrgId;
            source = "X_ORGANIZATION_ID_HEADER";
        } else {
            RequestContext.Context ctx = RequestContext.get();
            if (ctx != null && ctx.organizationId() != null) {
                orgId = ctx.organizationId();
                source = "REQUEST_CONTEXT";
            } else if (ctx != null && ctx.companyId() != null && companyRepository != null) {
                var compOpt = companyRepository.findById(ctx.companyId());
                if (compOpt.isPresent() && compOpt.get().getOrganization() != null) {
                    orgId = compOpt.get().getOrganization().getId();
                    source = "COMPANY_ORGANIZATION_MAPPING";
                }
            } else if (ctx != null && ctx.userId() != null && organizationMemberRepository != null) {
                var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                        ctx.userId(), MembershipStatus.ACTIVE);
                if (activeMembers.size() == 1) {
                    orgId = activeMembers.get(0).getOrganization().getId();
                    source = "SINGLE_ACTIVE_MEMBERSHIP";
                }
            }
        }

        if (orgId == null) {
            log.warn("[RBAC] Organization permission context resolution failed: no explicit param, header, or active membership found");
            throw new ForbiddenException("Organization context required");
        }

        RequestContext.Context current = RequestContext.get();
        UUID userId = current != null ? current.userId() : null;
        if (userId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud && cud.getUser() != null) {
                userId = cud.getUser().getId();
            } else if (auth != null && auth.getPrincipal() instanceof PlatformAdminPrincipal pap) {
                userId = pap.getAdminId();
            }
        }

        if (userId != null && organizationMemberRepository != null) {
            var memberOpt = organizationMemberRepository
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE);
            if (memberOpt.isEmpty()) {
                log.warn("[RBAC] Access denied: User [{}] does not have active membership in organization [{}]", userId, orgId);
                throw new ForbiddenException("Active organization membership required");
            }
            log.debug("[RBAC] User [{}] verified as [{}] in org [{}] via source [{}]", userId, memberOpt.get().getMemberType(), orgId, source);
        }

        UUID companyId = current != null ? current.companyId() : null;
        UUID clientId = current != null ? current.clientId() : null;
        AccessMode accessMode = current != null && current.accessMode() != null ? current.accessMode() : AccessMode.FULL;
        RequestContext.set(userId, orgId, companyId, clientId, accessMode);

        log.debug("[RBAC] Organization permission context resolved: userId={}, orgId={}, source={}", userId, orgId, source);
        return orgId;
    }
}
