package com.erp.inventory.modules.valuation.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationFilterRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryValuationResponse;
import com.erp.inventory.modules.valuation.service.InventoryValuationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/inventory-valuations")
@RequiredArgsConstructor
public class InventoryValuationController {

    private final InventoryValuationService service;

@PostMapping
public ResponseEntity<ApiResponse<InventoryValuationResponse>> create(
@RequestBody ApiRequest<InventoryValuationRequest> apiRequest,
@RequestParam(required = false) UUID companyId) {
InventoryValuationResponse response = service.create(apiRequest.getData(),
companyId);
return ResponseEntity.ok(ApiResponse.success(response, "InventoryValuation created successfully"));
}

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryValuationResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        InventoryValuationResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

@GetMapping
public ResponseEntity<ApiResponse<List<InventoryValuationResponse>>> getAll(
InventoryValuationFilterRequest filter,
Pageable pageable,
@RequestParam(required = false) UUID companyId) {
Page<InventoryValuationResponse> page = service.getAll(filter, companyId,
pageable);
return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
}

@PutMapping("/{id}")
public ResponseEntity<ApiResponse<InventoryValuationResponse>> update(
@PathVariable UUID id,
@RequestBody ApiRequest<InventoryValuationRequest> apiRequest,
@RequestParam(required = false) UUID companyId) {
InventoryValuationResponse response = service.update(id,
apiRequest.getData(), companyId);
return ResponseEntity.ok(ApiResponse.success(response, "InventoryValuation updated successfully"));
}

@DeleteMapping("/{id}")
public ResponseEntity<ApiResponse<Void>> delete(
@PathVariable UUID id,
@RequestParam(required = false) UUID companyId) {
service.delete(id, companyId);
return ResponseEntity.ok(ApiResponse.success("InventoryValuation deleted successfully"));
}
}
