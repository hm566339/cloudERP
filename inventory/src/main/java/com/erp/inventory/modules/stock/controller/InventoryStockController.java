package com.erp.inventory.modules.stock.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.stock.dto.request.InventoryStockRequest;
import com.erp.inventory.modules.stock.dto.request.InventoryStockFilterRequest;
import com.erp.inventory.modules.stock.dto.response.InventoryStockResponse;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/inventory-stocks")
@RequiredArgsConstructor
public class InventoryStockController {

    private final InventoryStockService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryStockResponse>> getById(@PathVariable UUID id, @RequestParam UUID companyId) {
        InventoryStockResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getAll(InventoryStockFilterRequest filter, Pageable pageable) {
        Page<InventoryStockResponse> page = service.getAll(filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }
}
