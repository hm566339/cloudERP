package com.erp.inventory.modules.serial.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.serial.dto.request.ProductSerialRequest;
import com.erp.inventory.modules.serial.dto.request.ProductSerialFilterRequest;
import com.erp.inventory.modules.serial.dto.response.ProductSerialResponse;
import com.erp.inventory.modules.serial.service.ProductSerialService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/product-serials")
@RequiredArgsConstructor
public class ProductSerialController {

    private final ProductSerialService service;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductSerialResponse>> create(
            @RequestBody ApiRequest<ProductSerialRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductSerialResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductSerial created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductSerialResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ProductSerialResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductSerialResponse>>> getAll(ProductSerialFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<ProductSerialResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductSerialResponse>> update(@PathVariable UUID id,
            @RequestBody ApiRequest<ProductSerialRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductSerialResponse response = service.update(id, apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "ProductSerial updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        service.delete(id, companyId);
        return ResponseEntity.ok(ApiResponse.success("ProductSerial deleted successfully"));
    }
}
