package com.erp.crm.modules.pipeline.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.pipeline.dto.request.PipelineRequest;
import com.erp.crm.modules.pipeline.dto.response.PipelineResponse;
import com.erp.crm.modules.pipeline.service.CrmPipelineService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/pipelines")
@RequiredArgsConstructor
@Tag(name = "Pipeline Management", description = "Endpoints for Multi-Pipeline Sales Funnels & Configurable Stages")
public class CrmPipelineController {

    private final CrmPipelineService pipelineService;

    @PostMapping
    @Operation(summary = "Create Sales Pipeline with Stages")
    public ResponseEntity<ApiResponse<PipelineResponse>> createPipeline(
            @RequestBody @Valid ApiRequest<PipelineRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        PipelineResponse response = pipelineService.createPipeline(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Pipeline created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Pipeline Details by ID")
    public ResponseEntity<ApiResponse<PipelineResponse>> getPipelineById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PipelineResponse response = pipelineService.getPipelineById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List All Pipelines for Company")
    public ResponseEntity<ApiResponse<List<PipelineResponse>>> getAllPipelines(
            @RequestParam(required = false) UUID companyId) {
        List<PipelineResponse> list = pipelineService.getAllPipelines(companyId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }
}

