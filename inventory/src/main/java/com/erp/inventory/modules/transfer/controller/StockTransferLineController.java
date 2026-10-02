package com.erp.inventory.modules.transfer.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferLineResponse;
import com.erp.inventory.modules.transfer.service.StockTransferLineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/stock-transfer-lines")
@RequiredArgsConstructor
public class StockTransferLineController {

    private final StockTransferLineService service;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockTransferLineResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockTransferLineResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockTransferLineResponse>>> getAll(
            StockTransferLineFilterRequest filter, 
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<StockTransferLineResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }
}
