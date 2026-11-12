package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.UpdateOrganizationAppearanceRequest;
import com.erp.auth_service.dto.response.OrganizationAppearanceResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.PlatformAdminPrincipal;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAppearanceService;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MembershipStatus;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/sso/organization/appearance", "/api/organization/appearance" })
@Slf4j
public class OrganizationAppearanceController {

    private final OrganizationAppearanceService appearanceService;
    private final com.erp.auth_service.repository.CompanyRepository companyRepository;
    private final com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository;

    public OrganizationAppearanceController(OrganizationAppearanceService appearanceService) {
        this(appearanceService, null, null);
    }

    @Autowired
    public OrganizationAppearanceController(
            OrganizationAppearanceService appearanceService,
            com.erp.auth_service.repository.CompanyRepository companyRepository,
            com.erp.auth_service.repository.OrganizationMemberRepository organizationMemberRepository) {
        this.appearanceService = appearanceService;
        this.companyRepository = companyRepository;
        this.organizationMemberRepository = organizationMemberRepository;
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> getAppearance(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        OrganizationAppearanceResponse response = appearanceService.getAppearance(orgId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PutMapping
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> updateAppearance(
            @Valid @RequestBody(required = false) UpdateOrganizationAppearanceRequest request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        RequestContext.Context context = RequestContext.get();
        UUID userId = context != null ? context.userId() : null;
        UpdateOrganizationAppearanceRequest safeRequest = request != null ? request
                : new UpdateOrganizationAppearanceRequest();
        OrganizationAppearanceResponse response = appearanceService.updateAppearance(
                orgId,
                userId,
                safeRequest);
        return ResponseEntity.ok(ResponseWrapper.success("Appearance settings updated successfully", response));
    }

    @PostMapping("/reset")
    public ResponseEntity<ResponseWrapper<OrganizationAppearanceResponse>> resetAppearance(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        RequestContext.Context context = RequestContext.get();
        UUID userId = context != null ? context.userId() : null;
        OrganizationAppearanceResponse response = appearanceService.resetAppearance(
                orgId,
                userId);
        return ResponseEntity.ok(ResponseWrapper.success("Appearance settings reset to default", response));
    }

    @PostMapping(value = "/upload-asset", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> uploadAsset(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "assetType", required = false, defaultValue = "asset") String assetType,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID orgId = resolveOrgId(organizationId, headerOrgId);
        RequestContext.Context context = RequestContext.get();
        UUID userId = context != null ? context.userId() : null;
        Map<String, Object> result = appearanceService.uploadAsset(orgId, userId, file, assetType);
        return ResponseEntity.ok(ResponseWrapper.success("Branding asset uploaded successfully", result));
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
            log.warn(
                    "[RBAC] Organization appearance context resolution failed: no explicit param, header, or active membership found");
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
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            boolean isElevated = (auth != null && auth.getPrincipal() instanceof PlatformAdminPrincipal)
                    || PlatformSecurityUtil.isElevatedAdmin()
                    || (auth != null && auth.getAuthorities() != null && auth.getAuthorities().stream().anyMatch(a ->
                            "SUPER_ADMIN".equalsIgnoreCase(a.getAuthority())
                            || "ROLE_SUPER_ADMIN".equalsIgnoreCase(a.getAuthority())
                            || "SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                            || "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(a.getAuthority())
                            || "PLATFORM_ADMIN".equalsIgnoreCase(a.getAuthority())
                            || "ROLE_PLATFORM_ADMIN".equalsIgnoreCase(a.getAuthority())));

            if (!isElevated) {
                var memberOpt = organizationMemberRepository
                        .findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE);
                if (memberOpt.isEmpty()) {
                    log.warn("[RBAC] Access denied: User [{}] does not have active membership in organization [{}]", userId,
                            orgId);
                    throw new ForbiddenException("Active organization membership required");
                }
                log.debug("[RBAC] User [{}] verified as [{}] in org [{}] via source [{}]", userId,
                        memberOpt.get().getMemberType(), orgId, source);
            }
        }

        UUID companyId = current != null ? current.companyId() : null;
        UUID clientId = current != null ? current.clientId() : null;
        AccessMode accessMode = current != null && current.accessMode() != null ? current.accessMode()
                : AccessMode.FULL;
        RequestContext.set(userId, orgId, companyId, clientId, accessMode);

        log.debug("[RBAC] Organization appearance context resolved: userId={}, orgId={}, source={}", userId, orgId,
                source);
        return orgId;
    }
}
