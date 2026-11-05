package com.erp.auth_service.controller;

import com.erp.auth_service.dto.request.CompanyAccessRequest;
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

@RestController @RequestMapping("/api/sso/organization/members") @RequiredArgsConstructor
public class OrganizationAdministrationController {
    private final OrganizationAdministrationService administrationService;

    @PostMapping("/{memberId}/companies")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> grant(@PathVariable UUID memberId,
            @Valid @RequestBody CompanyAccessRequest request) {
        administrationService.grantCompanyAccess(memberId, request.getCompanyId());
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access granted")));
    }

    @DeleteMapping("/{memberId}/companies/{companyId}")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> revoke(@PathVariable UUID memberId, @PathVariable UUID companyId) {
        administrationService.revokeCompanyAccess(memberId, companyId);
        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Company access revoked")));
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<com.erp.auth_service.dto.platform.PlatformMemberSummaryResponse>>> members() {
        RequestContext.Context context = RequestContext.get();
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.organizationMembers(context.organizationId())));
    }

    @GetMapping("/companies")
    public ResponseEntity<ResponseWrapper<List<AccessibleCompanyResponse>>> companies() {
        RequestContext.Context context = RequestContext.get();
        return ResponseEntity.ok(ResponseWrapper.success(administrationService.accessibleCompanies(context.organizationId())));
    }
}