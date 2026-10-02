package com.erp.inventory.modules.pricing.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.pricing.dto.request.ProductPriceRequest;
import com.erp.inventory.modules.pricing.dto.request.ProductPriceFilterRequest;
import com.erp.inventory.modules.pricing.dto.response.ProductPriceResponse;
import com.erp.inventory.modules.pricing.service.ProductPriceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/product-prices")
@RequiredArgsConstructor
public class ProductPriceController {

    private final ProductPriceService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductPriceResponse>> create(
            @RequestBody @jakarta.validation.Valid ApiRequest<ProductPriceRequest> apiRequest, @RequestParam(required = false) UUID companyId) {
        ProductPriceResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductPrice created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductPriceResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductPriceResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductPriceResponse>>> getAll(ProductPriceFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<ProductPriceResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductPriceResponse>> update(@PathVariable UUID id,
            @RequestBody @jakarta.validation.Valid ApiRequest<ProductPriceRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductPriceResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductPrice updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("ProductPrice deleted successfully"));
    }
}
