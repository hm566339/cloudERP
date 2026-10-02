package com.erp.inventory.modules.integration.production.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutCostResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockOutCostIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/integration/production/stock-out")
@RequiredArgsConstructor
public class ProductionStockOutCostIntegrationController {
    private final ProductionStockOutCostIntegrationService service;

    @GetMapping("/{inventoryMovementId}/cost")
    public ResponseEntity<ApiResponse<ProductionStockOutCostResponse>> getCost(
            @PathVariable UUID inventoryMovementId,
            @RequestParam UUID productionOrderId,
            @RequestParam UUID productionOrderMaterialId,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.getCost(inventoryMovementId,
                TenantUtils.resolveCompanyId(companyId), productionOrderId, productionOrderMaterialId)));
    }
}