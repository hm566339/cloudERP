package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.dto.role_template.*;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationRoleTemplateService;
import com.erp.auth_service.utility.MembershipStatus;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/sso/organization/role-templates", "/api/organization/role-templates" })
@RequiredArgsConstructor
@Slf4j
public class OrganizationRoleTemplateController {

    private final OrganizationRoleTemplateService roleTemplateService;
    private final com.erp.auth_service.repository.CompanyRepository companyRepository;
    private final com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<OrganizationRoleTemplateDto>>> getTemplates(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        List<OrganizationRoleTemplateDto> response = roleTemplateService.getTemplates(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/{templateId}")
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> getTemplateById(
            @PathVariable UUID templateId,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.getTemplateById(orgId, templateId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> createTemplate(
            @Valid @RequestBody CreateRoleTemplateRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.createTemplate(orgId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.success(response));
    }

    @PutMapping("/{templateId}")
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> updateTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody UpdateRoleTemplateRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.updateTemplate(orgId, templateId, request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/{templateId}/duplicate")
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> duplicateTemplate(
            @PathVariable UUID templateId,
            @RequestParam(required = false) String newName,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.duplicateTemplate(orgId, templateId, newName);
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.success(response));
    }

    @PatchMapping("/{templateId}/status")
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> updateTemplateStatus(
            @PathVariable UUID templateId,
            @RequestParam boolean status,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.updateTemplateStatus(orgId, templateId, status);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @DeleteMapping("/{templateId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> deleteTemplate(
            @PathVariable UUID templateId,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        roleTemplateService.deleteTemplate(orgId, templateId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role template deleted successfully")));
    }

    @PostMapping("/{templateId}/preview")
    public ResponseEntity<ResponseWrapper<TemplateApplyPreviewDto>> previewApply(
            @PathVariable UUID templateId,
            @Valid @RequestBody ApplyTemplateRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        TemplateApplyPreviewDto response = roleTemplateService.previewApply(orgId, templateId, request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/{templateId}/apply")
    public ResponseEntity<ResponseWrapper<ApplyTemplateResultDto>> applyTemplate(
            @PathVariable UUID templateId,
            @Valid @RequestBody ApplyTemplateRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        ApplyTemplateResultDto response = roleTemplateService.applyTemplate(orgId, templateId, request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @GetMapping("/compare")
    public ResponseEntity<ResponseWrapper<RoleComparisonDto>> compareRole(
            @RequestParam String roleName,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        RoleComparisonDto response = roleTemplateService.compareRoleAcrossCompanies(orgId, roleName);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/import")
    public ResponseEntity<ResponseWrapper<OrganizationRoleTemplateDto>> importCompanyRole(
            @Valid @RequestBody ImportRoleTemplateRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationRoleTemplateDto response = roleTemplateService.importCompanyRoleAsTemplate(
                orgId, request.getCompanyId(), request.getRoleId(), request.getTemplateName(),
                request.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(ResponseWrapper.success(response));
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
                        ctx.userId(), MembershipStatus.ACTIVE);
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
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE)
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
