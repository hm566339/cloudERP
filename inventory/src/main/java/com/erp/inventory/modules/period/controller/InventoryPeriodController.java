package com.erp.inventory.modules.period.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.period.dto.request.InventoryPeriodRequest;
import com.erp.inventory.modules.period.dto.request.InventoryPeriodFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventoryPeriodResponse;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/inventory-periods")
@RequiredArgsConstructor
public class InventoryPeriodController {

    private final InventoryPeriodService service;

    @PostMapping
    public ResponseEntity<ApiResponse<InventoryPeriodResponse>> create(@RequestBody ApiRequest<InventoryPeriodRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        InventoryPeriodResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "InventoryPeriod created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryPeriodResponse>> getById(@PathVariable UUID id, @RequestParam(required = false) UUID companyId) {
        InventoryPeriodResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryPeriodResponse>>> getAll(InventoryPeriodFilterRequest filter, Pageable pageable, @RequestParam(required = false) UUID companyId) {
        Page<InventoryPeriodResponse> page = service.getAll(filter, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryPeriodResponse>> update(@PathVariable UUID id, @RequestBody ApiRequest<InventoryPeriodRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        InventoryPeriodResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "InventoryPeriod updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("InventoryPeriod deleted successfully"));
    }
}
