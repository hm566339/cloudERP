package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.CreateWorkflowDefinitionRequest;
import com.erp.workflow.dto.response.WorkflowDefinitionResponse;
import com.erp.workflow.dto.response.WorkflowFormSchema;
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
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Workflow definition created"));
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
                ? definitionService.getActiveDefinitionByModuleAndDocumentType(effectiveCompanyId, moduleName, documentType)
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
        Page<WorkflowDefinitionResponse> page = definitionService.listDefinitions(effectiveCompanyId, moduleName, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> activateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        definitionService.activateDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition activated"));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a workflow definition")
    public ResponseEntity<ApiResponse<Void>> deactivateDefinition(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        definitionService.deactivateDefinition(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(null, "Workflow definition deactivated"));
    }

    @GetMapping("/schemas")
    @Operation(summary = "Get dynamic form schema for ERP document type")
    public ResponseEntity<ApiResponse<WorkflowFormSchema>> getFormSchema(
            @RequestParam(defaultValue = "GENERAL") String documentType) {
        WorkflowFormSchema schema = formSchemaService.getSchemaForDocumentType(documentType);
        return ResponseEntity.ok(ApiResponse.success(schema));
    }

    private UUID resolveCompanyId(UUID requestCompanyId) {
        boolean isSystemAdmin = SecurityUtils.hasRole("SYSTEM_ADMIN");
        if (isSystemAdmin && requestCompanyId != null) {
            return requestCompanyId;
        }
        return SecurityUtils.getCurrentCompanyId().orElse(requestCompanyId);
    }
}
