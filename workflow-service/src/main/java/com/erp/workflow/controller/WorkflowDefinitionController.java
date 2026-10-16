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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

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
        WorkflowDefinitionResponse response = definitionService.getDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response));
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
            Pageable pageable) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        Page<WorkflowDefinitionResponse> page = definitionService.listDefinitions(effectiveCompanyId, moduleName,
                pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> activateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        if (effectiveCompanyId == null) {
            throw new com.erp.workflow.exception.WorkflowValidationException(
                    "Company ID is required to activate workflow definition");
        }
        definitionService.activateDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition activated"));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> deactivateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        if (effectiveCompanyId == null) {
            throw new com.erp.workflow.exception.WorkflowValidationException(
                    "Company ID is required to deactivate workflow definition");
        }
        definitionService.deactivateDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition deactivated"));
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
