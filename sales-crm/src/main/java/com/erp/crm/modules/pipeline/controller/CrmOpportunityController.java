package com.erp.crm.modules.pipeline.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCloseRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityCreateRequest;
import com.erp.crm.modules.pipeline.dto.request.OpportunityStageUpdateRequest;
import com.erp.crm.modules.pipeline.dto.response.KanbanViewResponse;
import com.erp.crm.modules.pipeline.dto.response.OpportunityResponse;
import com.erp.crm.modules.pipeline.service.CrmOpportunityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/opportunities")
@RequiredArgsConstructor
@Tag(name = "Opportunity Management", description = "Endpoints for Deals, Kanban View, Stage Progression & Win/Loss Tracking")
public class CrmOpportunityController {

    private final CrmOpportunityService opportunityService;

    @PostMapping
    @Operation(summary = "Create Opportunity Deal")
    public ResponseEntity<ApiResponse<OpportunityResponse>> createOpportunity(
            @RequestBody @Valid ApiRequest<OpportunityCreateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        OpportunityResponse response = opportunityService.createOpportunity(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Opportunity created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Opportunity by ID")
    public ResponseEntity<ApiResponse<OpportunityResponse>> getOpportunityById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        OpportunityResponse response = opportunityService.getOpportunityById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List Opportunities (Paginated)")
    public ResponseEntity<ApiResponse<List<OpportunityResponse>>> getAllOpportunities(
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<OpportunityResponse> page = opportunityService.getAllOpportunities(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Opportunities fetched successfully"));
    }

    @GetMapping("/kanban")
    @Operation(summary = "Get Kanban View Grouped by Pipeline Stages")
    public ResponseEntity<ApiResponse<KanbanViewResponse>> getKanbanView(
            @RequestParam UUID pipelineId,
            @RequestParam(required = false) UUID companyId) {
        KanbanViewResponse response = opportunityService.getKanbanView(pipelineId, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/stage")
    @Operation(summary = "Move Opportunity Stage (Drag & Drop in Kanban)")
    public ResponseEntity<ApiResponse<OpportunityResponse>> updateStage(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<OpportunityStageUpdateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        OpportunityResponse response = opportunityService.updateStage(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Stage updated successfully"));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "Mark Opportunity Closed Won / Lost")
    public ResponseEntity<ApiResponse<OpportunityResponse>> closeOpportunity(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<OpportunityCloseRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        OpportunityResponse response = opportunityService.closeOpportunity(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Opportunity closed successfully"));
    }
}

