package com.erp.inventory.modules.product.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.product.dto.request.ProductCategoryRequest;
import com.erp.inventory.modules.product.dto.request.ProductCategoryFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductCategoryResponse;
import com.erp.inventory.modules.product.service.ProductCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/product-categories")
@RequiredArgsConstructor
public class ProductCategoryController {

    private final ProductCategoryService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> create(
            @RequestBody ApiRequest<ProductCategoryRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductCategoryResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductCategory created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductCategoryResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductCategoryResponse>>> getAll(ProductCategoryFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<ProductCategoryResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductCategoryResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<ProductCategoryRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductCategoryResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductCategory updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("ProductCategory deleted successfully"));
    }
}
