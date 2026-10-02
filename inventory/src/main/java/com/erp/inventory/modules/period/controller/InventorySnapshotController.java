package com.erp.inventory.modules.period.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.period.dto.request.InventorySnapshotRequest;
import com.erp.inventory.modules.period.dto.request.InventorySnapshotFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventorySnapshotResponse;
import com.erp.inventory.modules.period.service.InventorySnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/inventory-snapshots")
@RequiredArgsConstructor
public class InventorySnapshotController {

    private final InventorySnapshotService service;

    @PostMapping
    public ResponseEntity<ApiResponse<List<InventorySnapshotResponse>>> create(
            @RequestBody ApiRequest<InventorySnapshotRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        List<InventorySnapshotResponse> response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "InventorySnapshot created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventorySnapshotResponse>> getById(@PathVariable UUID id, @RequestParam(required = false) UUID companyId) {
        InventorySnapshotResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventorySnapshotResponse>>> getAll(InventorySnapshotFilterRequest filter, Pageable pageable, @RequestParam(required = false) UUID companyId) {
        Page<InventorySnapshotResponse> page = service.getAll(filter, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InventorySnapshotResponse>> update(@PathVariable UUID id, @RequestBody ApiRequest<InventorySnapshotRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        InventorySnapshotResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "InventorySnapshot updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id, @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("InventorySnapshot deleted successfully"));
    }
}
