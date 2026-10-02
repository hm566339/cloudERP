package com.erp.inventory.modules.warehouse.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseAccountRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseAccountResponse;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseResponse;
import com.erp.inventory.modules.warehouse.service.WarehouseAccountService;
import com.erp.inventory.modules.warehouse.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/warehouses")
@RequiredArgsConstructor
public class WarehouseController {

    private final WarehouseService service;
    private final WarehouseAccountService warehouseAccountService;

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@RequestBody ApiRequest<WarehouseRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        WarehouseResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Warehouse created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        WarehouseResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WarehouseResponse>>> getAll(WarehouseFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<WarehouseResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarehouseResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<WarehouseRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        WarehouseResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Warehouse updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Warehouse deleted successfully"));
    }

    @PostMapping("/getWarehouseAccount")
    public ResponseEntity<ApiResponse<WarehouseAccountResponse>> getWarehouseAccount(
            @RequestBody ApiRequest<WarehouseAccountRequest> apiRequest) {
        WarehouseAccountResponse response = warehouseAccountService.getWarehouseAccount(apiRequest.getData());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

}
