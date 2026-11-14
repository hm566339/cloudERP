package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.request.CreatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.request.RolloutPlatformTemplateRequest;
import com.erp.workflow.dto.request.UpdatePlatformWorkflowTemplateRequest;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutLogDto;
import com.erp.workflow.dto.response.PlatformWorkflowRolloutResultDto;
import com.erp.workflow.dto.response.PlatformWorkflowTemplateResponse;
import com.erp.workflow.exception.UnauthorizedWorkflowActionException;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.PlatformWorkflowTemplateService;
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
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/workflow/platform-templates")
@RequiredArgsConstructor
@Tag(name = "Platform Workflow Templates", description = "Platform-Level centralized workflow templates and global organization rollout (SystemAdmin)")
public class PlatformWorkflowTemplateController {

    private final PlatformWorkflowTemplateService platformTemplateService;

    @PostMapping
    @Operation(summary = "Create a platform-level default workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> createTemplate(
            @Valid @RequestBody ApiRequest<CreatePlatformWorkflowTemplateRequest> request) {
        enforceSystemAdmin();
        PlatformWorkflowTemplateResponse response = platformTemplateService.createTemplate(request.getData());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Platform workflow template created successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a platform-level workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<UpdatePlatformWorkflowTemplateRequest> request) {
        enforceSystemAdmin();
        PlatformWorkflowTemplateResponse response = platformTemplateService.updateTemplate(id, request.getData());
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow template updated successfully"));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish a new version of the platform workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> publishNewVersion(
            @PathVariable UUID id,
            @RequestParam(required = false) String comment) {
        enforceSystemAdmin();
        PlatformWorkflowTemplateResponse response = platformTemplateService.publishNewVersion(id, comment);
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow template published as new version"));
    }

    @GetMapping
    @Operation(summary = "Get all platform workflow templates")
    public ResponseEntity<ApiResponse<List<PlatformWorkflowTemplateResponse>>> getAllTemplates() {
        List<PlatformWorkflowTemplateResponse> response = platformTemplateService.getAllTemplates();
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow templates retrieved"));
    }

    @GetMapping("/page")
    @Operation(summary = "Get paginated platform workflow templates")
    public ResponseEntity<ApiResponse<Page<PlatformWorkflowTemplateResponse>>> getTemplatesPaged(Pageable pageable) {
        Page<PlatformWorkflowTemplateResponse> response = platformTemplateService.getAllTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow templates retrieved"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get platform workflow template by ID")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> getTemplateById(@PathVariable UUID id) {
        PlatformWorkflowTemplateResponse response = platformTemplateService.getTemplateById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow template details retrieved"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a platform workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        enforceSystemAdmin();
        platformTemplateService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Platform workflow template deleted successfully"));
    }

    @PostMapping("/{id}/activate")
    @Operation(summary = "Activate a platform workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> activateTemplate(@PathVariable UUID id) {
        enforceSystemAdmin();
        PlatformWorkflowTemplateResponse response = platformTemplateService.toggleActive(id, true);
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow template activated"));
    }

    @PostMapping("/{id}/deactivate")
    @Operation(summary = "Deactivate a platform workflow template (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowTemplateResponse>> deactivateTemplate(@PathVariable UUID id) {
        enforceSystemAdmin();
        PlatformWorkflowTemplateResponse response = platformTemplateService.toggleActive(id, false);
        return ResponseEntity.ok(ApiResponse.success(response, "Platform workflow template deactivated"));
    }

    @PostMapping("/{id}/rollout")
    @Operation(summary = "Rollout platform template to organizations (SystemAdmin)")
    public ResponseEntity<ApiResponse<PlatformWorkflowRolloutResultDto>> rolloutTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody ApiRequest<RolloutPlatformTemplateRequest> request) {
        enforceSystemAdmin();
        PlatformWorkflowRolloutResultDto result = platformTemplateService.rolloutTemplate(id, request.getData());
        return ResponseEntity.ok(ApiResponse.success(result, "Platform workflow template rollout completed"));
    }

    @PostMapping("/provision-organization")
    @Operation(summary = "Provision all active platform default workflow templates to an organization")
    public ResponseEntity<ApiResponse<Map<String, Object>>> provisionOrganization(
            @RequestParam UUID organizationId) {
        int count = platformTemplateService.provisionTemplatesToOrganization(organizationId);
        return ResponseEntity.ok(ApiResponse.success(
                Map.of("organizationId", organizationId, "templatesProvisioned", count),
                "Organization default workflows provisioned successfully"
        ));
    }

    @GetMapping("/{id}/rollout-logs")
    @Operation(summary = "Get rollout audit logs for a platform workflow template")
    public ResponseEntity<ApiResponse<Page<PlatformWorkflowRolloutLogDto>>> getRolloutLogs(
            @PathVariable UUID id,
            Pageable pageable) {
        Page<PlatformWorkflowRolloutLogDto> logs = platformTemplateService.getRolloutLogs(id, pageable);
        return ResponseEntity.ok(ApiResponse.success(logs, "Platform template rollout logs retrieved"));
    }

    private void enforceSystemAdmin() {
        if (!SecurityUtils.isSystemAdmin()) {
            throw new UnauthorizedWorkflowActionException("SYSTEM_ADMIN role required for platform workflow template management");
        }
    }
}

