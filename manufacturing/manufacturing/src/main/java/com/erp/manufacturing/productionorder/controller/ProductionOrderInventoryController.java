package com.erp.manufacturing.productionorder.controller;

import com.erp.manufacturing.integration.inventory.dto.MaterialAvailabilityResponse;
import com.erp.manufacturing.integration.inventory.service.ProductionOrderInventoryService;
import com.erp.manufacturing.util.TenantUtils;
import com.erp.manufacturing.security.annotation.RequireFeature;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/manufacturing/production-orders")
@RequireFeature("MANUFACTURING")
@RequiredArgsConstructor
public class ProductionOrderInventoryController {

    private final ProductionOrderInventoryService productionOrderInventoryService;

    @GetMapping("/{id}/material-availability")
    public ResponseEntity<List<MaterialAvailabilityResponse>> getMaterialAvailability(@PathVariable UUID id) {
        return ResponseEntity.ok(productionOrderInventoryService.getMaterialAvailability(id,
                TenantUtils.getCurrentCompanyId()));
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<Void> reserve(@PathVariable UUID id) {
        productionOrderInventoryService.reserve(id, TenantUtils.getCurrentCompanyId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/release-reservation")
    public ResponseEntity<Void> releaseReservations(@PathVariable UUID id) {
        productionOrderInventoryService.releaseReservations(id, TenantUtils.getCurrentCompanyId());
        return ResponseEntity.ok().build();
    }
}
