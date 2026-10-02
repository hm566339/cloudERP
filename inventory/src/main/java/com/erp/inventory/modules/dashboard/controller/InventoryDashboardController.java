package com.erp.inventory.modules.dashboard.controller;

import com.erp.inventory.modules.dashboard.dto.InventoryDashboardResponse;
import com.erp.inventory.modules.dashboard.service.InventoryDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/dashboard")
@RequiredArgsConstructor
public class InventoryDashboardController {

    private final InventoryDashboardService inventoryDashboardService;

    @GetMapping
    public ResponseEntity<InventoryDashboardResponse> getDashboard(
            @RequestParam UUID companyId,
            @RequestParam(required = false, defaultValue = "EMPLOYEE") String role) {
        
        InventoryDashboardResponse response = inventoryDashboardService.getDashboardMetrics(companyId, role);
        return ResponseEntity.ok(response);
    }
}
