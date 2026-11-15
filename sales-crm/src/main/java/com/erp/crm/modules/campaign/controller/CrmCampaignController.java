package com.erp.crm.modules.campaign.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.campaign.dto.*;
import com.erp.crm.modules.campaign.service.CrmCampaignService;
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
@RequestMapping("/api/crm/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaign & Marketing Attribution", description = "Endpoints for Marketing Campaigns, Spend Tracking, ROI & Multi-Touch Attribution")
public class CrmCampaignController {

    private final CrmCampaignService campaignService;

    @GetMapping
    @Operation(summary = "List Campaigns (Paginated)")
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> getCampaigns(
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<CampaignResponse> page = campaignService.getAllCampaigns(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Campaigns fetched successfully"));
    }

    @PostMapping
    @Operation(summary = "Create Marketing Campaign")
    public ResponseEntity<ApiResponse<CampaignResponse>> createCampaign(
            @RequestBody @Valid ApiRequest<CampaignRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        CampaignResponse response = campaignService.createCampaign(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Campaign created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Campaign Details by ID")
    public ResponseEntity<ApiResponse<CampaignResponse>> getCampaignById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        CampaignResponse response = campaignService.getCampaignById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update Campaign Details")
    public ResponseEntity<ApiResponse<CampaignResponse>> updateCampaign(
            @PathVariable UUID id,
            @RequestBody @Valid ApiRequest<CampaignRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        CampaignResponse response = campaignService.updateCampaign(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Campaign updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete Campaign")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        campaignService.deleteCampaign(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Campaign deleted successfully"));
    }

    @GetMapping("/{id}/performance")
    @Operation(summary = "Get Campaign Performance, Spend, CPL, CPA & ROI")
    public ResponseEntity<ApiResponse<CampaignPerformanceResponse>> getCampaignPerformance(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        CampaignPerformanceResponse response = campaignService.getCampaignPerformance(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/attribution")
    @Operation(summary = "Get Multi-Touch Attribution Breakdown for Campaign")
    public ResponseEntity<ApiResponse<CampaignAttributionResponse>> getCampaignAttribution(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        CampaignAttributionResponse response = campaignService.getCampaignAttribution(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

