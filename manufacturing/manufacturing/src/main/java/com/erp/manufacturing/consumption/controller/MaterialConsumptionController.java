package com.erp.manufacturing.consumption.controller;

import com.erp.manufacturing.consumption.dto.request.MaterialConsumptionRequest;
import com.erp.manufacturing.consumption.dto.response.MaterialConsumptionResponse;
import com.erp.manufacturing.consumption.service.MaterialConsumptionService;
import com.erp.manufacturing.util.TenantUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/manufacturing/production-orders")
@RequiredArgsConstructor
public class MaterialConsumptionController {

    private final MaterialConsumptionService materialConsumptionService;

    @PostMapping("/{productionOrderId}/consume-material")
    public ResponseEntity<MaterialConsumptionResponse> consumeMaterial(
            @PathVariable UUID productionOrderId,
            @Valid @RequestBody MaterialConsumptionRequest request) {
        return ResponseEntity.ok(materialConsumptionService.consumeMaterial(productionOrderId, request, TenantUtils.getCurrentCompanyId()));
    }
}
