package com.erp.inventory.modules.product.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.product.dto.request.ProductRequest;
import com.erp.inventory.modules.product.dto.request.ProductFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductDetailResponse;
import com.erp.inventory.modules.product.dto.response.ProductResponse;
import com.erp.inventory.modules.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @RequestBody @jakarta.validation.Valid ApiRequest<ProductRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Product created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductDetailResponse response = service.getProductDetailById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getAll(ProductFilterRequest filter,
            @RequestParam(required = false) UUID companyId, Pageable pageable) {
        Page<ProductResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(@PathVariable UUID id,
            @RequestBody @jakarta.validation.Valid ApiRequest<ProductRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully"));
    }
}
