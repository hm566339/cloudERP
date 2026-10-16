package com.erp.workflow.controller;

import com.erp.workflow.common.dto.ApiRequest;
import com.erp.workflow.common.dto.ApiResponse;
import com.erp.workflow.dto.flow.DocumentFlowConfigDto;
import com.erp.workflow.dto.flow.DocumentFlowTabsResponse;
import com.erp.workflow.dto.flow.DocumentFlowTransitionDto;
import com.erp.workflow.registry.DocumentTypeCapability;
import com.erp.workflow.registry.DocumentTypeRegistry;
import com.erp.workflow.security.SecurityUtils;
import com.erp.workflow.service.DocumentFlowConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workflow")
@RequiredArgsConstructor
@Tag(name = "Document Flow Configuration", description = "Company-specific Document Flow and dynamic tabs configuration")
public class DocumentFlowConfigController {

    private final DocumentFlowConfigService flowConfigService;
    private final DocumentTypeRegistry documentTypeRegistry;

    @GetMapping("/document-flows")
    @Operation(summary = "Get document flow configuration for authenticated company and module")
    public ResponseEntity<ApiResponse<DocumentFlowConfigDto>> getFlowConfig(
            @RequestParam(defaultValue = "SALES") String moduleName,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        DocumentFlowConfigDto config = flowConfigService.getFlowConfig(effectiveCompanyId, moduleName);
        return ResponseEntity.ok(ApiResponse.success(config));
    }

    @PostMapping("/document-flows")
    @Operation(summary = "Create or update document flow configuration for company")
    public ResponseEntity<ApiResponse<DocumentFlowConfigDto>> saveFlowConfig(
            @Valid @RequestBody ApiRequest<DocumentFlowConfigDto> request) {
        DocumentFlowConfigDto data = request.getData();
        UUID effectiveCompanyId = resolveCompanyId(data.getCompanyId());
        DocumentFlowConfigDto saved = flowConfigService.saveFlowConfig(effectiveCompanyId, data);
        return ResponseEntity.ok(ApiResponse.success(saved, "Document flow configuration saved successfully"));
    }

    @GetMapping("/document-flows/tabs")
    @Operation(summary = "Get dynamic document tabs for frontend based on company configuration")
    public ResponseEntity<ApiResponse<DocumentFlowTabsResponse>> getDynamicTabs(
            @RequestParam(defaultValue = "SALES") String moduleName,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        DocumentFlowTabsResponse tabs = flowConfigService.getTabs(effectiveCompanyId, moduleName);
        return ResponseEntity.ok(ApiResponse.success(tabs));
    }

    @GetMapping("/document-flows/transitions")
    @Operation(summary = "Get allowed next transitions for a source document type")
    public ResponseEntity<ApiResponse<List<DocumentFlowTransitionDto>>> getAllowedTransitions(
            @RequestParam String sourceDocType,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        List<DocumentFlowTransitionDto> transitions = flowConfigService.getAllowedTransitions(effectiveCompanyId, sourceDocType);
        return ResponseEntity.ok(ApiResponse.success(transitions));
    }

    @GetMapping("/document-types")
    @Operation(summary = "Get all registered ERP document types and their workflow capabilities")
    public ResponseEntity<ApiResponse<List<DocumentTypeCapability>>> getAllDocumentTypes() {
        List<DocumentTypeCapability> types = documentTypeRegistry.getAll();
        return ResponseEntity.ok(ApiResponse.success(types));
    }

    private UUID resolveCompanyId(UUID requestCompanyId) {
        boolean isPrivileged = SecurityUtils.hasRole("SYSTEM_ADMIN") || SecurityUtils.hasRole("OWNER");
        if (isPrivileged && requestCompanyId != null) {
            return requestCompanyId;
        }
        return SecurityUtils.getCurrentCompanyId().orElse(requestCompanyId);
    }
}
