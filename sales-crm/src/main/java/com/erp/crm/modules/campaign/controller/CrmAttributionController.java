package com.erp.crm.modules.campaign.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.campaign.dto.MultiTouchAttributionResponse;
import com.erp.crm.modules.campaign.service.CrmAttributionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/crm/attribution")
@RequiredArgsConstructor
@Tag(name = "Multi-Touch Revenue Attribution", description = "Endpoints for Cross-Channel Algorithmic Attribution")
public class CrmAttributionController {

    private final CrmAttributionService attributionService;

    @GetMapping({"", "/", "/overview"})
    @Operation(summary = "Get Company Multi-Touch Revenue Attribution Overview")
    public ResponseEntity<ApiResponse<MultiTouchAttributionResponse>> getOverview(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false, defaultValue = "U_SHAPED") String model) {
        MultiTouchAttributionResponse response = attributionService.getMultiTouchAttributionOverview(companyId, model);
        return ResponseEntity.ok(ApiResponse.success(response, "Multi-touch attribution calculated successfully"));
    }
}
