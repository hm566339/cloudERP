package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.dto.response.WorkflowFormSchema;
import com.erp.workflow.exception.WorkflowValidationException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.WorkflowDefinitionService;
import com.erp.workflow.service.WorkflowFormSchemaService;
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

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/workflow/definitions")
@RequiredArgsConstructor
@Tag(name = "Workflow Definitions", description = "Manage reusable workflow definitions across all ERP modules")
public class WorkflowDefinitionController {

    private final WorkflowDefinitionService definitionService;
    private final WorkflowFormSchemaService formSchemaService;

    @PostMapping
    @Operation(summary = "Create a workflow definition with stages, approvers, transitions and SLA")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> createDefinition(
            @Valid @RequestBody ApiRequest<CreateWorkflowDefinitionRequest> request) {
        CreateWorkflowDefinitionRequest data = request.getData();
        data.setCompanyId(resolveCompanyId(data.getCompanyId()));
        WorkflowDefinitionResponse response = definitionService.createDefinition(data);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Workflow definition created"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing workflow definition with stages and transitions")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> updateDefinition(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<CreateWorkflowDefinitionRequest> request) {
        CreateWorkflowDefinitionRequest data = request.getData();
        data.setCompanyId(resolveCompanyId(data.getCompanyId()));
        WorkflowDefinitionResponse response = definitionService.updateDefinition(id, data);
        return ResponseEntity.ok(ApiResponse.success(response, "Workflow definition updated"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a workflow definition by ID")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> getDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        log.info("[WF_CTRL] [GET_START] method=GET endpoint=/api/v1/workflow/definitions/{} definitionId={} requestedCompanyId={} effectiveCompanyId={} companyResolutionSuccess={} userId={} roles={}",
                id, id, companyId, effectiveCompanyId, effectiveCompanyId != null,
                SecurityUtils.getCurrentUserId().orElse(null), SecurityUtils.getCurrentRoles());
        try {
            WorkflowDefinitionResponse response = definitionService.getDefinition(id, effectiveCompanyId);
            log.info("[WF_CTRL] [GET_SUCCESS] definitionId={} effectiveCompanyId={} workflowCode='{}' moduleName='{}' documentType='{}' isActive={}",
                    id, effectiveCompanyId, response.getWorkflowCode(), response.getModuleName(), response.getDocumentType(), response.getIsActive());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            log.error("[WF_CTRL] [GET_ERROR] definitionId={} effectiveCompanyId={} error={}",
                    id, effectiveCompanyId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/active")
    @Operation(summary = "Get active workflow definition for document type")
    public ResponseEntity<ApiResponse<WorkflowDefinitionResponse>> getActiveDefinition(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String moduleName,
            @RequestParam String documentType) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        WorkflowDefinitionResponse response = moduleName != null
                ? definitionService.getActiveDefinitionByModuleAndDocumentType(effectiveCompanyId, moduleName,
                        documentType)
                : definitionService.getActiveDefinitionByDocumentType(effectiveCompanyId, documentType);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List workflow definitions with pagination")
    public ResponseEntity<ApiResponse<Page<WorkflowDefinitionResponse>>> listDefinitions(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String moduleName,
            @RequestParam(required = false) String documentType,
            Pageable pageable) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        log.info("[WF_CTRL] [LIST_START] method=GET endpoint=/api/v1/workflow/definitions requestedCompanyId={} effectiveCompanyId={} companyResolutionSuccess={} moduleName='{}' documentType='{}' page={} size={} sort={} userId={} roles={}",
                companyId, effectiveCompanyId, effectiveCompanyId != null, moduleName, documentType,
                pageable.getPageNumber(), pageable.getPageSize(), pageable.getSort(),
                SecurityUtils.getCurrentUserId().orElse(null), SecurityUtils.getCurrentRoles());
        try {
            Page<WorkflowDefinitionResponse> page = definitionService.listDefinitions(effectiveCompanyId, moduleName, documentType,
                    pageable);
            log.info("[WF_CTRL] [LIST_SUCCESS] effectiveCompanyId={} totalElements={} returnedElements={}",
                    effectiveCompanyId, page.getTotalElements(), page.getNumberOfElements());
            return ResponseEntity.ok(ApiResponse.success(page));
        } catch (Exception e) {
            log.error("[WF_CTRL] [LIST_ERROR] method=GET endpoint=/api/v1/workflow/definitions effectiveCompanyId={} error={}",
                    effectiveCompanyId, e.getMessage(), e);
            throw e;
        }
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> activateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        String method = "PATCH";
        String endpoint = "/api/v1/workflow/definitions/" + id + "/activate";
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        java.util.List<String> currentRoles = SecurityUtils.getCurrentRoles();
        log.info("WorkflowDefinitionController -> [{}] {} started. definitionId={}, requestedCompanyId={}, userId={}, username={}, roles={}",
                method, endpoint, id, companyId, currentUserId, currentUsername, currentRoles);

        UUID effectiveCompanyId = resolveCompanyId(companyId);
        boolean companyResolved = effectiveCompanyId != null;
        log.info("WorkflowDefinitionController -> Company resolution for [{}] {}: requestedCompanyId={}, effectiveCompanyId={}, resolvedSuccess={}",
                method, endpoint, companyId, effectiveCompanyId, companyResolved);

        if (!companyResolved) {
            log.warn("WorkflowDefinitionController -> Company ID resolution failed for [{}] {}: definitionId={}, requestedCompanyId={}",
                    method, endpoint, id, companyId);
            throw new com.erp.workflow.exception.WorkflowValidationException(
                    "Company ID is required to activate workflow definition");
        }

        try {
            log.info("WorkflowDefinitionController -> Invoking definitionService.activateDefinition(definitionId={}, effectiveCompanyId={}) for [{}] {}",
                    id, effectiveCompanyId, method, endpoint);
            definitionService.activateDefinition(id, effectiveCompanyId);
            log.info("WorkflowDefinitionController -> Successfully activated workflow definition id={} for effectiveCompanyId={}",
                    id, effectiveCompanyId);
            return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition activated"));
        } catch (Exception ex) {
            log.error("WorkflowDefinitionController -> Exception in activateDefinition(definitionId={}, effectiveCompanyId={}): {}",
                    id, effectiveCompanyId, ex.getMessage(), ex);
            throw ex;
        }
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> deactivateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        String method = "PATCH";
        String endpoint = "/api/v1/workflow/definitions/" + id + "/deactivate";
        UUID currentUserId = SecurityUtils.getCurrentUserId().orElse(null);
        String currentUsername = SecurityUtils.getCurrentUsername();
        java.util.List<String> currentRoles = SecurityUtils.getCurrentRoles();
        log.info("WorkflowDefinitionController -> [{}] {} started. definitionId={}, requestedCompanyId={}, userId={}, username={}, roles={}",
                method, endpoint, id, companyId, currentUserId, currentUsername, currentRoles);

        UUID effectiveCompanyId = resolveCompanyId(companyId);
        boolean companyResolved = effectiveCompanyId != null;
        log.info("WorkflowDefinitionController -> Company resolution for [{}] {}: requestedCompanyId={}, effectiveCompanyId={}, resolvedSuccess={}",
                method, endpoint, companyId, effectiveCompanyId, companyResolved);

        if (!companyResolved) {
            log.warn("WorkflowDefinitionController -> Company ID resolution failed for [{}] {}: definitionId={}, requestedCompanyId={}",
                    method, endpoint, id, companyId);
            throw new com.erp.workflow.exception.WorkflowValidationException(
                    "Company ID is required to deactivate workflow definition");
        }

        try {
            log.info("WorkflowDefinitionController -> Invoking definitionService.deactivateDefinition(definitionId={}, effectiveCompanyId={}) for [{}] {}",
                    id, effectiveCompanyId, method, endpoint);
            definitionService.deactivateDefinition(id, effectiveCompanyId);
            log.info("WorkflowDefinitionController -> Successfully deactivated workflow definition id={} for effectiveCompanyId={}",
                    id, effectiveCompanyId);
            return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition deactivated"));
        } catch (Exception ex) {
            log.error("WorkflowDefinitionController -> Exception in deactivateDefinition(definitionId={}, effectiveCompanyId={}): {}",
                    id, effectiveCompanyId, ex.getMessage(), ex);
            throw ex;
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a workflow definition")
    public ResponseEntity<ApiResponse<Void>> deleteDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        if (effectiveCompanyId == null) {
            throw new WorkflowValidationException("Company ID is required to delete workflow definition");
        }
        definitionService.deleteDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition deleted"));
    }

    @GetMapping("/schemas")
    @Operation(summary = "Get dynamic form schema for ERP document type")
    public ResponseEntity<ApiResponse<WorkflowFormSchema>> getFormSchema(
            @RequestParam(defaultValue = "GENERAL") String documentType) {
        WorkflowFormSchema schema = formSchemaService.getSchemaForDocumentType(documentType);
        return ResponseEntity.ok(ApiResponse.success(schema));
    }

    private UUID resolveCompanyId(UUID requestCompanyId) {
        boolean isPrivileged = SecurityUtils.hasRole("SYSTEM_ADMIN") || SecurityUtils.hasRole("OWNER");
        if (isPrivileged && requestCompanyId != null) {
            return requestCompanyId;
        }
        return SecurityUtils.getCurrentCompanyId().orElse(requestCompanyId);
    }
}
