package com.erp.auth_service.controller;

import com.erp.auth_service.dto.platform.MemberCompanyRoleDto;
import com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse;
import com.erp.auth_service.dto.request.AssignRoleRequest;
import com.erp.auth_service.dto.request.CompanyAccessRequest;
import com.erp.auth_service.dto.request.RequestWrapper;
import com.erp.auth_service.dto.response.AccessibleCompanyResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.service.OrganizationAdministrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/organization/members")
@RequiredArgsConstructor
public class OrganizationAdministrationController {
    private final OrganizationAdministrationService administrationService;

    @PostMapping("/{memberId}/companies")

    public ResponseEntity<ResponseWrapper<Map<String, String>>> grant(
            @PathVariable UUID memberId,
            @Valid @RequestBody CompanyAccessRequest request) {
        administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access granted")));
    }

    @PutMapping("/{memberId}/companies/{companyId}/role")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> updateRole(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        administrationService.updateCompanyRole(memberId, companyId, request.getData().getRoleId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company role updated successfully")));
    }

    @DeleteMapping("/{memberId}/companies/{companyId}")

    public ResponseEntity<ResponseWrapper<Map<String, String>>> revoke(
            @PathVariable UUID memberId,
            @PathVariable UUID companyId) {
        administrationService.revokeCompanyAccess(memberId, companyId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access revoked")));
    }

    @PostMapping("/user/{userId}/companies")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> grantByUserId(
            @PathVariable UUID userId,
            @Valid @RequestBody CompanyAccessRequest request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        administrationService.grantCompanyAccess(memberId, request.getCompanyId(), request.getRoleId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access granted")));
    }

    @PutMapping("/user/{userId}/companies/{companyId}/role")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> updateRoleByUserId(
            @PathVariable UUID userId,
            @PathVariable UUID companyId,
            @Valid @RequestBody RequestWrapper<AssignRoleRequest> request) {
        UUID memberId = administrationService.resolveMemberIdByUserId(userId);
        administrationService.updateCompanyRole(memberId, companyId, request.getData().getRoleId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company role updated successfully")));
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
}