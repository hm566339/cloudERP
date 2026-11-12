package com.erp.auth_service.controller;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.request.AssignRoleRequest;
import com.erp.auth_service.dto.request.CompanyAccessRequest;
import com.erp.auth_service.dto.request.DefaultCompanyRequest;
import com.erp.auth_service.dto.request.InviteMemberRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.dto.response.DefaultCompanyResponse;
import com.erp.auth_service.dto.response.InviteMemberResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.BadRequestException;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import com.erp.auth_service.utility.MembershipStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/sso/organization/members", "/api/organization/members" })
@RequiredArgsConstructor
public class OrganizationAdministrationController {
    private final OrganizationAdministrationService administrationService;

    @Autowired(required = false)
    private OrganizationMemberRepository organizationMemberRepository;

    @PostMapping("/invite")
    public ResponseEntity<ResponseWrapper<InviteMemberResponse>> invite(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            @Valid @RequestBody InviteMemberRequest request) {
        UUID effectiveOrgId = resolveOrgId(organizationId, headerOrgId,
                request != null ? request.getOrganizationId() : null);
        InviteMemberResponse response = administrationService.inviteMember(effectiveOrgId, request);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/{memberId}/resend-invite")
    public ResponseEntity<ResponseWrapper<InviteMemberResponse>> resendInvite(
            @PathVariable UUID memberId,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrgId(organizationId, headerOrgId, null);
        InviteMemberResponse response = administrationService.resendInvitation(effectiveOrgId, memberId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PostMapping("/user/{userId}/resend-invite")
    public ResponseEntity<ResponseWrapper<InviteMemberResponse>> resendInviteByUserId(
            @PathVariable UUID userId,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrgId(organizationId, headerOrgId, null);
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        InviteMemberResponse response = administrationService.resendInvitation(effectiveOrgId, memberId);
        return ResponseEntity.ok(ResponseWrapper.success(response));
    }

    @PatchMapping("/{memberId}/status")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> updateStatus(
            @PathVariable UUID memberId,
            @RequestBody Map<String, String> body) {
        String status = body != null ? body.get("status") : null;
        if (status == null || status.isBlank()) {
            throw new BadRequestException("Status is required");
        }
        administrationService.updateMemberStatus(memberId, status);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Member status updated successfully")));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> deleteMember(
            @PathVariable UUID memberId) {
        administrationService.removeMemberFromOrganization(memberId);
        return ResponseEntity
                .ok(ResponseWrapper.success(Map.of("message", "Member removed from organization successfully")));
    }

    @PostMapping("/{memberId}/companies")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> grant(
            @PathVariable UUID memberId,
            @Valid @RequestBody CompanyAccessRequest request) {
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleIds());
        } else {
            administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleId());
        }
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access granted")));
    }

    @PutMapping("/{memberId}/companies/{companyId}/role")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> updateRole(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        AssignRoleRequest data = request.getData();
        if (data.getRoleIds() != null && !data.getRoleIds().isEmpty()) {
            administrationService.syncCompanyRoles(memberId, companyId, data.getRoleIds());
        } else {
            administrationService.updateCompanyRole(memberId, companyId, data.getRoleId());
        }
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company role updated successfully")));
    }

    @PutMapping("/{memberId}/companies/{companyId}/roles")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> syncRoles(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        AssignRoleRequest data = request.getData();
        List<UUID> roleIds = data.getRoleIds() != null ? data.getRoleIds()
                : (data.getRoleId() != null ? List.of(data.getRoleId()) : List.of());
        administrationService.syncCompanyRoles(memberId, companyId, roleIds);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company roles synchronized successfully")));
    }

    @PostMapping("/{memberId}/companies/{companyId}/roles/{roleId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> addRole(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId,
            @PathVariable UUID roleId) {
        administrationService.addCompanyRole(memberId, companyId, roleId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role assigned to company successfully")));
    }

    @DeleteMapping("/{memberId}/companies/{companyId}/roles/{roleId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> removeRole(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId,
            @PathVariable UUID roleId) {
        administrationService.removeCompanyRole(memberId, companyId, roleId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role revoked from company successfully")));
    }

    @DeleteMapping("/{memberId}/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revoke(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId) {
        administrationService.revokeCompanyAccess(memberId, companyId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access revoked")));
    }

    // ─── USER-BASED ENDPOINTS ───

    @PostMapping("/user/{userId}/companies")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> grantByUserId(
            @PathVariable UUID userId,
            @Valid @RequestBody CompanyAccessRequest request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleIds());
        } else {
            administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleId());
        }
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access granted")));
    }

    @PutMapping("/user/{userId}/companies/{companyId}/role")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> updateRoleByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        AssignRoleRequest data = request.getData();
        if (data.getRoleIds() != null && !data.getRoleIds().isEmpty()) {
            administrationService.syncCompanyRoles(memberId, companyId, data.getRoleIds());
        } else {
            administrationService.updateCompanyRole(memberId, companyId, data.getRoleId());
        }
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company role updated successfully")));
    }

    @PutMapping("/user/{userId}/companies/{companyId}/roles")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> syncRolesByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        AssignRoleRequest data = request.getData();
        List<UUID> roleIds = data.getRoleIds() != null ? data.getRoleIds()
                : (data.getRoleId() != null ? List.of(data.getRoleId()) : List.of());
        administrationService.syncCompanyRoles(memberId, companyId, roleIds);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company roles synchronized successfully")));
    }

    @PostMapping("/user/{userId}/companies/{companyId}/roles/{roleId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> addRoleByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId,
            @PathVariable UUID roleId) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        administrationService.addCompanyRole(memberId, companyId, roleId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role assigned to company successfully")));
    }

    @DeleteMapping("/user/{userId}/companies/{companyId}/roles/{roleId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> removeRoleByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId,
            @PathVariable UUID roleId) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        administrationService.removeCompanyRole(memberId, companyId, roleId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Role revoked from company successfully")));
    }

    @DeleteMapping("/user/{userId}/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revokeByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        administrationService.revokeCompanyAccess(memberId, companyId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access revoked")));
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<PlatformMemberSummaryResponse>>> members() {
        RequestContext.Context context = RequestContext.get();
        return ResponseEntity
                .ok(ResponseWrapper.success(administrationService.organizationMembers(context.organizationId())));
    }

    @GetMapping("/companies")
    public ResponseEntity<ResponseWrapper<List<AccessibleCompanyResponse>>> companies() {
        RequestContext.Context context = RequestContext.get();
        return ResponseEntity
                .ok(ResponseWrapper.success(administrationService.accessibleCompanies(context.organizationId())));
    }

    @GetMapping("/{memberId}/companies/access")
    public ResponseEntity<ResponseWrapper<List<MemberCompanyRoleDto>>> getMemberCompanyAccess(
            @PathVariable UUID memberId) {
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.memberCompanyAccesses(memberId)));
    }

    @GetMapping("/user/{userId}/companies/access")
    public ResponseEntity<ResponseWrapper<List<MemberCompanyRoleDto>>> getUserCompanyAccess(
            @PathVariable UUID userId) {
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.userCompanyAccesses(userId)));
    }

    @GetMapping("/{memberId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> getMemberDefaultCompany(
            @PathVariable UUID memberId) {
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.getDefaultCompany(memberId)));
    }

    @PutMapping("/{memberId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> setMemberDefaultCompany(
            @PathVariable UUID memberId,
            @RequestBody DefaultCompanyRequest request) {
        UUID companyId = request != null ? request.getCompanyId() : null;
        return ResponseEntity.ok(ResponseWrapper.success(
                administrationService.setDefaultCompany(memberId, companyId)));
    }

    @DeleteMapping("/{memberId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> clearMemberDefaultCompany(
            @PathVariable UUID memberId) {
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.clearDefaultCompany(memberId)));
    }

    @GetMapping("/user/{userId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> getUserDefaultCompany(
            @PathVariable UUID userId) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.getDefaultCompany(memberId)));
    }

    @PutMapping("/user/{userId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> setUserDefaultCompany(
            @PathVariable UUID userId,
            @RequestBody DefaultCompanyRequest request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        UUID companyId = request != null ? request.getCompanyId() : null;
        return ResponseEntity.ok(ResponseWrapper.success(
                administrationService.setDefaultCompany(memberId, companyId)));
    }

    @DeleteMapping("/user/{userId}/default-company")
    public ResponseEntity<ResponseWrapper<DefaultCompanyResponse>> clearUserDefaultCompany(
            @PathVariable UUID userId) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.clearDefaultCompany(memberId)));
    }

    private UUID resolveOrgId(UUID explicitOrgId, UUID headerOrgId, UUID bodyOrgId) {
        if (explicitOrgId != null) {
            return explicitOrgId;
        }
        if (bodyOrgId != null) {
            return bodyOrgId;
        }
        if (headerOrgId != null) {
            return headerOrgId;
        }
        RequestContext.Context ctx = RequestContext.get();
        if (ctx != null && ctx.organizationId() != null) {
            return ctx.organizationId();
        }
        if (ctx != null && ctx.userId() != null && organizationMemberRepository != null) {
            var activeMembers = organizationMemberRepository.findByUser_IdAndMembershipStatus(
                    ctx.userId(), MembershipStatus.ACTIVE);
            if (activeMembers.size() == 1) {
                return activeMembers.get(0).getOrganization().getId();
            }
        }
        throw new ForbiddenException("Organization context required");
    }
}
