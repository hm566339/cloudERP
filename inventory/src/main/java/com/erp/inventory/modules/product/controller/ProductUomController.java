package com.erp.inventory.modules.product.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.product.dto.request.ProductUomRequest;
import com.erp.inventory.modules.product.dto.request.ProductUomFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductUomResponse;
import com.erp.inventory.modules.product.service.ProductUomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/product-uoms")
@RequiredArgsConstructor
public class ProductUomController {

    private final ProductUomService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductUomResponse>> create(@RequestBody ApiRequest<ProductUomRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductUomResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductUom created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductUomResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductUomResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductUomResponse>>> getAll(ProductUomFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<ProductUomResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductUomResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<ProductUomRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductUomResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductUom updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("ProductUom deleted successfully"));
    }
}
