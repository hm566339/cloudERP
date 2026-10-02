package com.erp.inventory.modules.stock.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.stock.dto.request.StockMovementLineRequest;
import com.erp.inventory.modules.stock.dto.request.StockMovementLineFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementLineResponse;
import com.erp.inventory.modules.stock.service.StockMovementLineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/stock-movement-lines")
@RequiredArgsConstructor
public class StockMovementLineController {

    private final StockMovementLineService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockMovementLineResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockMovementLineResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockMovementLineResponse>>> getAll(StockMovementLineFilterRequest filter,
            Pageable pageable) {
        Page<StockMovementLineResponse> page = service.getAll(filter, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }
}
