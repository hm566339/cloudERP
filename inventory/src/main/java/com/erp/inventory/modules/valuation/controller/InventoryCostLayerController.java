package com.erp.inventory.modules.valuation.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerFilterRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryCostLayerResponse;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/inventory-cost-layers")
@RequiredArgsConstructor
public class InventoryCostLayerController {

    private final InventoryCostLayerService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryCostLayerResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        InventoryCostLayerResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryCostLayerResponse>>> getAll(
            InventoryCostLayerFilterRequest filter,
            Pageable pageable,
            @RequestParam(required = false) UUID companyId) {
        Page<InventoryCostLayerResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

}
