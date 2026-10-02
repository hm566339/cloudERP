package com.erp.inventory.modules.openingstock.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockFilterRequest;
import com.erp.inventory.modules.openingstock.dto.response.OpeningStockResponse;
import com.erp.inventory.modules.openingstock.service.OpeningStockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/opening-stocks")
@RequiredArgsConstructor
public class OpeningStockController {

    private final OpeningStockService service;

    @PostMapping
    public ResponseEntity<ApiResponse<OpeningStockResponse>> create(
            @RequestBody ApiRequest<OpeningStockRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        OpeningStockResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "OpeningStock created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OpeningStockResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        OpeningStockResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OpeningStockResponse>>> getAll(OpeningStockFilterRequest filter,
            Pageable pageable, @RequestParam(required = false) UUID companyId) {
        Page<OpeningStockResponse> page = service.getAll(filter, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

}
