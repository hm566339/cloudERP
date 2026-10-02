package com.erp.account.modules.dashboard.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.dashboard.dto.response.DashboardResponse;
import com.erp.account.modules.dashboard.dto.response.DashboardWidget;
import com.erp.account.modules.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping({"", "/{module}"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard(
            @PathVariable(required = false) String module,
            @RequestParam(required = false) UUID companyId) {
        DashboardResponse response = dashboardService.getDashboard(companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Dashboard fetched successfully"));
    }

    @GetMapping("/cards")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getCards(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> cards = dashboardService.getCards(companyId);
        return ResponseEntity.ok(ApiResponse.success(cards, "Dashboard cards fetched successfully"));
    }

    @GetMapping("/charts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getCharts(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> charts = dashboardService.getCharts(companyId);
        return ResponseEntity.ok(ApiResponse.success(charts, "Dashboard charts fetched successfully"));
    }

    @GetMapping("/navigation")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getNavigation(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> navigation = dashboardService.getNavigation(companyId);
        return ResponseEntity.ok(ApiResponse.success(navigation, "Dashboard navigation fetched successfully"));
    }

    @GetMapping("/activities")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getActivities(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> activities = dashboardService.getActivities(companyId);
        return ResponseEntity.ok(ApiResponse.success(activities, "Dashboard activities fetched successfully"));
    }

    @GetMapping("/alerts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getAlerts(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> alerts = dashboardService.getAlerts(companyId);
        return ResponseEntity.ok(ApiResponse.success(alerts, "Dashboard alerts fetched successfully"));
    }

    @GetMapping("/approvals")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getApprovals(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> approvals = dashboardService.getApprovals(companyId);
        return ResponseEntity.ok(ApiResponse.success(approvals, "Dashboard approvals fetched successfully"));
    }

    @GetMapping("/quick-actions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DashboardWidget>>> getQuickActions(
            @RequestParam(required = false) UUID companyId) {
        List<DashboardWidget> quickActions = dashboardService.getQuickActions(companyId);
        return ResponseEntity.ok(ApiResponse.success(quickActions, "Dashboard quick actions fetched successfully"));
    }
}
