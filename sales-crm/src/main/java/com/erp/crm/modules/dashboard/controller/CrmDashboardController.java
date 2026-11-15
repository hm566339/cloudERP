package com.erp.crm.modules.dashboard.controller;

import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.dashboard.dto.CrmDashboardSummaryResponse;
import com.erp.crm.modules.dashboard.service.CrmDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/crm/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Analytics", description = "Endpoints for CRM KPI Metrics, Funnel Health & Executive Overview")
public class CrmDashboardController {

    private final CrmDashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get CRM Executive KPI Summary")
    public ResponseEntity<ApiResponse<CrmDashboardSummaryResponse>> getDashboardSummary(
            @RequestParam(required = false) UUID companyId) {
        CrmDashboardSummaryResponse summary = dashboardService.getDashboardSummary(companyId);
        return ResponseEntity.ok(ApiResponse.success(summary));
    }
}

