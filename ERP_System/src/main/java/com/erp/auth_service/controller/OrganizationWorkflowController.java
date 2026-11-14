package com.erp.auth_service.controller;

import com.erp.auth_service.client.WorkflowProvisioningClient;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.exception.ForbiddenException;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.repository.CompanyRepository;
import com.erp.auth_service.repository.OrganizationMemberRepository;
import com.erp.auth_service.repository.RoleRepository;
import com.erp.auth_service.security.CustomUserDetails;
import com.erp.auth_service.security.PlatformAdminPrincipal;
import com.erp.auth_service.security.RequestContext;
import com.erp.auth_service.utility.AccessMode;
import com.erp.auth_service.utility.MemberType;
import com.erp.auth_service.utility.MembershipStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({ "/api/sso/organization/workflows", "/api/organization/workflows" })
@RequiredArgsConstructor
@Slf4j
public class OrganizationWorkflowController {

    private final WorkflowProvisioningClient workflowProvisioningClient;
    private final CompanyRepository companyRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final RoleRepository roleRepository;

    @PostMapping("/reconcile")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> reconcileWorkflows(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            @RequestHeader(value = "Authorization", required = false) String token,
            @RequestParam(defaultValue = "false") boolean forceUpdateCustomized) {

        UUID orgId = resolveAndAuthorizeOrgAdmin(organizationId, headerOrgId);

        List<Company> companies = companyRepository.findByOrganization_Id(orgId);
        List<UUID> companyIds = companies.stream()
                .filter(c -> Boolean.TRUE.equals(c.getActive()))
                .map(Company::getId)
                .toList();

        boolean result = workflowProvisioningClient.reconcileOrganizationWorkflows(
                orgId, companyIds, forceUpdateCustomized, token);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("organizationId", orgId);
        responseData.put("companyCount", companyIds.size());
        responseData.put("success", result);
        responseData.put("forceUpdateCustomized", forceUpdateCustomized);

        return ResponseEntity.ok(ResponseWrapper.success(responseData));
    }

    @PostMapping("/provision-company/{companyId}")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> provisionCompany(
            @PathVariable UUID companyId,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            @RequestHeader(value = "Authorization", required = false) String token) {

        UUID orgId = resolveAndAuthorizeOrgAdmin(organizationId, headerOrgId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        if (company.getOrganization() == null || !company.getOrganization().getId().equals(orgId)) {
            throw new ForbiddenException("Company does not belong to the authorized organization");
        }

        List<Role> roles = roleRepository.findByCompany_Id(companyId);
        Map<String, UUID> roleMap = roles != null ? roles.stream()
                .filter(r -> r.getName() != null)
                .collect(Collectors.toMap(
                        r -> r.getName().toUpperCase(),
                        Role::getId,
                        (existing, duplicate) -> existing
                )) : Collections.emptyMap();

        boolean success = workflowProvisioningClient.provisionCompanyWorkflow(orgId, companyId, roleMap, token);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("organizationId", orgId);
        responseData.put("companyId", companyId);
        responseData.put("success", success);

        return ResponseEntity.ok(ResponseWrapper.success(responseData));
    }

    @PostMapping("/provision-from-platform")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> provisionFromPlatform(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            @RequestHeader(value = "Authorization", required = false) String token) {

        UUID orgId = resolveAndAuthorizeOrgAdmin(organizationId, headerOrgId);

        boolean result = workflowProvisioningClient.provisionOrganizationWorkflows(orgId, token);

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("organizationId", orgId);
        responseData.put("success", result);

        return ResponseEntity.ok(ResponseWrapper.success(responseData));
    }

    private UUID resolveAndAuthorizeOrgAdmin(UUID organizationId, UUID headerOrgId) {
        UUID orgId = organizationId != null ? organizationId : headerOrgId;
        RequestContext.Context ctx = RequestContext.get();

        if (orgId == null && ctx != null && ctx.organizationId() != null) {
            orgId = ctx.organizationId();
        }

        if (orgId == null) {
            throw new ForbiddenException("Organization context required");
        }

        UUID userId = ctx != null ? ctx.userId() : null;
        if (userId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud && cud.getUser() != null) {
                userId = cud.getUser().getId();
            } else if (auth != null && auth.getPrincipal() instanceof PlatformAdminPrincipal pap) {
                userId = pap.getAdminId();
            }
        }

        if (userId != null) {
            var memberOpt = organizationMemberRepository
                    .findByOrganization_IdAndUser_IdAndMembershipStatus(orgId, userId, MembershipStatus.ACTIVE);
            if (memberOpt.isEmpty()) {
                throw new ForbiddenException("Active organization membership required");
            }
            MemberType memberType = memberOpt.get().getMemberType();
            if (memberType != MemberType.OWNER && memberType != MemberType.ADMIN) {
                throw new ForbiddenException("Only Organization Owners or Admins can perform this action");
            }
        }

        return orgId;
    }
}
