package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.CreateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.request.ProvisionCompanyWorkflowRequest;
import com.erp.workflow.dto.request.UpdateOrgWorkflowTemplateRequest;
import com.erp.workflow.dto.response.OrgWorkflowProvisionLogDto;
import com.erp.workflow.dto.response.OrgWorkflowProvisionResultDto;
import com.erp.workflow.dto.response.OrgWorkflowTemplateResponse;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.OrganizationWorkflowTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/workflow/organization-templates")
@RequiredArgsConstructor
@Tag(name = "Organization Workflow Templates", description = "Manage centralized default workflow templates and company provisioning")
public class OrganizationWorkflowTemplateController {

    private final OrganizationWorkflowTemplateService templateService;

    @PostMapping
    @Operation(summary = "Create an organization-level default workflow template")
    public ResponseEntity<ApiResponse<OrgWorkflowTemplateResponse>> createTemplate(
            @Valid @RequestBody ApiRequest<CreateOrgWorkflowTemplateRequest> request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        CreateOrgWorkflowTemplateRequest data = request.getData();
        UUID effectiveOrgId = resolveOrganizationId(data.getOrganizationId(), organizationId, headerOrgId);
        data.setOrganizationId(effectiveOrgId);

        OrgWorkflowTemplateResponse response = templateService.createTemplate(effectiveOrgId, data);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Organization workflow template created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an organization workflow template and propagate to companies")
    public ResponseEntity<ApiResponse<OrgWorkflowTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<UpdateOrgWorkflowTemplateRequest> request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        UpdateOrgWorkflowTemplateRequest data = request.getData();
        if (data != null) {
            assertAdminOrOwnerForForceUpdate(data.isForceUpdateCustomized());
        }
        OrgWorkflowTemplateResponse response = templateService.updateTemplate(effectiveOrgId, id, data);
        return ResponseEntity.ok(ApiResponse.success(response, "Organization workflow template updated and propagated"));
    }

    @GetMapping
    @Operation(summary = "List organization workflow templates")
    public ResponseEntity<ApiResponse<Page<OrgWorkflowTemplateResponse>>> listTemplates(
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            Pageable pageable) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        Page<OrgWorkflowTemplateResponse> page = templateService.getTemplates(effectiveOrgId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an organization workflow template by ID")
    public ResponseEntity<ApiResponse<OrgWorkflowTemplateResponse>> getTemplate(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        OrgWorkflowTemplateResponse response = templateService.getTemplateById(effectiveOrgId, id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/default")
    @Operation(summary = "Get active default template for document type")
    public ResponseEntity<ApiResponse<OrgWorkflowTemplateResponse>> getDefaultTemplate(
            @RequestParam String documentType,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        OrgWorkflowTemplateResponse response = templateService.getDefaultTemplate(effectiveOrgId, documentType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an organization workflow template")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        templateService.deleteTemplate(effectiveOrgId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Organization workflow template deleted"));
    }

    @PostMapping("/provision-company")
    @Operation(summary = "Provision organization default workflow to a specific company")
    public ResponseEntity<ApiResponse<OrgWorkflowProvisionResultDto>> provisionCompany(
            @Valid @RequestBody ApiRequest<ProvisionCompanyWorkflowRequest> request,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        ProvisionCompanyWorkflowRequest data = request.getData();
        UUID effectiveOrgId = resolveOrganizationId(data.getOrganizationId(), organizationId, headerOrgId);
        data.setOrganizationId(effectiveOrgId);

        OrgWorkflowProvisionResultDto result = templateService.provisionToCompany(data);
        return ResponseEntity.ok(ApiResponse.success(result, "Company workflow provisioned"));
    }

    @PostMapping("/{id}/propagate")
    @Operation(summary = "Propagate template updates to associated companies")
    public ResponseEntity<ApiResponse<OrgWorkflowProvisionResultDto>> propagate(
            @PathVariable UUID id,
            @RequestParam(required = false) List<UUID> companyIds,
            @RequestParam(defaultValue = "false") boolean forceUpdateCustomized,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        assertAdminOrOwnerForForceUpdate(forceUpdateCustomized);
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        OrgWorkflowProvisionResultDto result = templateService.propagateTemplate(effectiveOrgId, id, companyIds, forceUpdateCustomized);
        return ResponseEntity.ok(ApiResponse.success(result, "Template propagated successfully"));
    }

    @PostMapping("/reconcile")
    @Operation(summary = "Reconcile missing default workflows for companies under the organization")
    public ResponseEntity<ApiResponse<OrgWorkflowProvisionResultDto>> reconcile(
            @RequestBody(required = false) List<UUID> companyIds,
            @RequestParam(defaultValue = "false") boolean forceUpdateCustomized,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId) {
        assertAdminOrOwnerForForceUpdate(forceUpdateCustomized);
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        OrgWorkflowProvisionResultDto result = templateService.reconcileWorkflows(effectiveOrgId, companyIds, forceUpdateCustomized);
        return ResponseEntity.ok(ApiResponse.success(result, "Workflows reconciled successfully"));
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "Get audit logs for template provisioning")
    public ResponseEntity<ApiResponse<Page<OrgWorkflowProvisionLogDto>>> getLogs(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID organizationId,
            @RequestHeader(value = "X-Organization-Id", required = false) UUID headerOrgId,
            Pageable pageable) {
        UUID effectiveOrgId = resolveOrganizationId(null, organizationId, headerOrgId);
        Page<OrgWorkflowProvisionLogDto> page = templateService.getLogs(effectiveOrgId, id, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    private void assertAdminOrOwnerForForceUpdate(boolean forceUpdateCustomized) {
        if (!forceUpdateCustomized) {
            return;
        }
        boolean isAuthorized = SecurityUtils.isSystemAdmin()
                || SecurityUtils.hasRole("OWNER")
                || SecurityUtils.hasRole("ADMIN")
                || SecurityUtils.hasRole("ORGANIZATION_OWNER")
                || SecurityUtils.hasRole("ORGANIZATION_ADMIN");
        if (!isAuthorized) {
            throw new UnauthorizedWorkflowActionException("Only Organization Owners or Admins are authorized to force-update customized company workflows.");
        }
    }

    private UUID resolveOrganizationId(UUID bodyOrgId, UUID paramOrgId, UUID headerOrgId) {
        boolean isPrivileged = SecurityUtils.isSystemAdmin() || SecurityUtils.hasRole("OWNER");
        if (bodyOrgId != null && (isPrivileged || SecurityUtils.getCurrentOrganizationId().map(bodyOrgId::equals).orElse(false))) {
            return bodyOrgId;
        }
        if (paramOrgId != null && (isPrivileged || SecurityUtils.getCurrentOrganizationId().map(paramOrgId::equals).orElse(false))) {
            return paramOrgId;
        }
        if (headerOrgId != null && (isPrivileged || SecurityUtils.getCurrentOrganizationId().map(headerOrgId::equals).orElse(false))) {
            return headerOrgId;
        }
        return SecurityUtils.getCurrentOrganizationId()
                .orElseThrow(() -> new WorkflowValidationException("Organization context is required"));
    }
}

