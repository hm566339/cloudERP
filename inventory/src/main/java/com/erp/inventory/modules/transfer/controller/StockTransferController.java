package com.erp.inventory.modules.transfer.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.dto.request.ApiRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferResponse;
import com.erp.inventory.modules.transfer.service.StockTransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/inventory/stock-transfers")
@RequiredArgsConstructor
public class StockTransferController {

    private final StockTransferService service;

    @PostMapping
    public ResponseEntity<ApiResponse<StockTransferResponse>> create(
            @RequestBody ApiRequest<StockTransferRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        StockTransferResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockTransfer created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockTransferResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockTransferResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockTransferResponse>>> getAll(
            StockTransferFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<StockTransferResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PostMapping("/{id}/reverse")
    public ResponseEntity<ApiResponse<StockTransferResponse>> reverse(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockTransferResponse response = service.reverse(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockTransfer reversed successfully"));
    }
}
