package com.erp.crm.modules.activity.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.activity.dto.request.ActivityRequest;
import com.erp.crm.modules.activity.dto.response.ActivityResponse;
import com.erp.crm.modules.activity.service.CrmActivityService;
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
@RequestMapping("/api/crm/activities")
@RequiredArgsConstructor
@Tag(name = "Activity Management", description = "Endpoints for Customer Interaction Logging & Chronological Timelines")
public class CrmActivityController {

    private final CrmActivityService activityService;

    @PostMapping
    @Operation(summary = "Log Activity (Call, Email, Note, Meeting)")
    public ResponseEntity<ApiResponse<ActivityResponse>> logActivity(
            @RequestBody @Valid ApiRequest<ActivityRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ActivityResponse response = activityService.logActivity(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Activity logged successfully"));
    }

    @GetMapping
    @Operation(summary = "Get Chronological Activity Timeline for an Entity")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getTimeline(
            @RequestParam String entityType,
            @RequestParam UUID entityId,
            @RequestParam(required = false) UUID companyId) {
        List<ActivityResponse> timeline = activityService.getTimeline(entityType, entityId, companyId);
        return ResponseEntity.ok(ApiResponse.success(timeline));
    }
}

