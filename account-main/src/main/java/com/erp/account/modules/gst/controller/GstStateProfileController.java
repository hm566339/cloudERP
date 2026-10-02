package com.erp.account.modules.gst.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.gst.dto.profile.*;
import com.erp.account.modules.gst.service.GstStateProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/account/gst/master/states")
@RequiredArgsConstructor
@Tag(name = "GST State Master", description = "Enterprise Profile APIs for GST State Management")
public class GstStateProfileController {

    private final GstStateProfileService profileService;

    @Operation(summary = "Get Full GST State Profile", description = "Retrieves the complete GST State Profile with Country, Address Metadata, and Audit info.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GstStateProfileDto>> getGstStateProfile(@PathVariable UUID id) {
        GstStateProfileDto data = profileService.getGstStateProfile(id);
        return ResponseEntity.ok(ApiResponse.success(data, "GST State retrieved successfully."));
    }

    @Operation(summary = "Get GST State Statistics", description = "Retrieves related entity counts (Customers, Vendors, etc.) optimally.")
    @GetMapping("/{id}/statistics")
    public ResponseEntity<ApiResponse<GstStateStatisticsDto>> getGstStateStatistics(@PathVariable UUID id) {
        GstStateStatisticsDto data = profileService.getGstStateStatistics(id);
        return ResponseEntity.ok(ApiResponse.success(data, "GST State statistics retrieved successfully."));
    }

    @Operation(summary = "Get GST State Overview", description = "Retrieves full profile combined with statistics for dashboards.")
    @GetMapping("/{id}/overview")
    public ResponseEntity<ApiResponse<GstStateOverviewDto>> getGstStateOverview(@PathVariable UUID id) {
        GstStateOverviewDto data = profileService.getGstStateOverview(id);
        return ResponseEntity.ok(ApiResponse.success(data, "GST State overview retrieved successfully."));
    }

    @Operation(summary = "Get GST State Relations", description = "Retrieves lightweight summary lists of related entities.")
    @GetMapping("/{id}/relations")
    public ResponseEntity<ApiResponse<GstStateRelationsDto>> getGstStateRelations(@PathVariable UUID id) {
        GstStateRelationsDto data = profileService.getGstStateRelations(id);
        return ResponseEntity.ok(ApiResponse.success(data, "GST State relations retrieved successfully."));
    }
}
