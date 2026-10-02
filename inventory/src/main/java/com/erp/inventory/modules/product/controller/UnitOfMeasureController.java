package com.erp.inventory.modules.product.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.product.dto.request.UnitOfMeasureRequest;
import com.erp.inventory.modules.product.dto.request.UnitOfMeasureFilterRequest;
import com.erp.inventory.modules.product.dto.response.UnitOfMeasureResponse;
import com.erp.inventory.modules.product.service.UnitOfMeasureService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/unit-of-measures")
@RequiredArgsConstructor
public class UnitOfMeasureController {

    private final UnitOfMeasureService service;

    @PostMapping
    public ResponseEntity<ApiResponse<UnitOfMeasureResponse>> create(
            @RequestBody ApiRequest<UnitOfMeasureRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        UnitOfMeasureResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "UnitOfMeasure created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UnitOfMeasureResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UnitOfMeasureResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UnitOfMeasureResponse>>> getAll(UnitOfMeasureFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<UnitOfMeasureResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UnitOfMeasureResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<UnitOfMeasureRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        UnitOfMeasureResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "UnitOfMeasure updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("UnitOfMeasure deleted successfully"));
    }
}
