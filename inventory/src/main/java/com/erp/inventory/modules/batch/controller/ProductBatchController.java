package com.erp.inventory.modules.batch.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.batch.dto.request.ProductBatchRequest;
import com.erp.inventory.modules.batch.dto.request.ProductBatchFilterRequest;
import com.erp.inventory.modules.batch.dto.response.ProductBatchResponse;
import com.erp.inventory.modules.batch.service.ProductBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/product-batches")
@RequiredArgsConstructor
public class ProductBatchController {

    private final ProductBatchService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductBatchResponse>> create(
            @RequestBody ApiRequest<ProductBatchRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductBatchResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductBatch created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductBatchResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductBatchResponse>>> getAll(ProductBatchFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<ProductBatchResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductBatchResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<ProductBatchRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductBatchResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductBatch updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("ProductBatch deleted successfully"));
    }
}
