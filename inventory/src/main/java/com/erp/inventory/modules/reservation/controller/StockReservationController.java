package com.erp.inventory.modules.reservation.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.reservation.dto.request.StockReservationRequest;
import com.erp.inventory.modules.reservation.dto.request.StockReservationFilterRequest;
import com.erp.inventory.modules.reservation.dto.response.StockReservationResponse;
import com.erp.inventory.modules.reservation.service.StockReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/stock-reservations")
@RequiredArgsConstructor
public class StockReservationController {

    private final StockReservationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<StockReservationResponse>> create(
            @RequestBody ApiRequest<StockReservationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        StockReservationResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockReservation created successfully"));
    }

    @PostMapping("/{id}/release")
    public ResponseEntity<ApiResponse<StockReservationResponse>> release(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockReservationResponse response = service.releaseReservation(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockReservation released successfully"));
    }

    @PostMapping("/{id}/consume")
    public ResponseEntity<ApiResponse<StockReservationResponse>> consume(
            @PathVariable UUID id,
            @RequestParam BigDecimal quantity,
            @RequestParam(required = false) UUID companyId) {
        StockReservationResponse response = service.consumeReservation(id, quantity, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockReservation consumed successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockReservationResponse>> getById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockReservationResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockReservationResponse>>> getAll(
            StockReservationFilterRequest filter,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<StockReservationResponse> page = service.getAll(filter, companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

}
