package com.erp.inventory.modules.warehouse.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseLocationResponse;
import com.erp.inventory.modules.warehouse.service.WarehouseLocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/warehouse-locations")
@RequiredArgsConstructor
public class WarehouseLocationController {

    private final WarehouseLocationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> create(
            @RequestBody ApiRequest<WarehouseLocationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        WarehouseLocationResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "WarehouseLocation created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        WarehouseLocationResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseLocationResponse>>> getAll(WarehouseLocationFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<WarehouseLocationResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseLocationResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<WarehouseLocationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        WarehouseLocationResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "WarehouseLocation updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("WarehouseLocation deleted successfully"));
    }
}
