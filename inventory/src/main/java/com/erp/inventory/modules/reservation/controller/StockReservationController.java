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

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import com.erp.inventory.common.util.TenantUtils;

@Slf4j
@RestController
@RequestMapping("/api/inventory/stock-reservations")
@RequiredArgsConstructor
public class StockReservationController {

    private final StockReservationService service;

    @PostMapping
    public ResponseEntity<ApiResponse<StockReservationResponse>> create(
            @RequestBody ApiRequest<StockReservationRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        StockReservationRequest request = apiRequest.getData();
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        try {
            StockReservationResponse response = service.create(request, resolvedCompanyId);
            return ResponseEntity.ok(ApiResponse.success(response, "StockReservation created successfully"));
        } catch (DataIntegrityViolationException exception) {
            String message = exception.getMessage() == null ? "" : exception.getMessage();
            String causeMessage = exception.getCause() == null || exception.getCause().getMessage() == null
                    ? "" : exception.getCause().getMessage();
            if ((message.contains("uk_stock_reservation_idempotency") || causeMessage.contains("uk_stock_reservation_idempotency"))
                    && request.getIdempotencyKey() != null) {
                log.warn("Concurrent duplicate stock reservation for idempotencyKey: {}", request.getIdempotencyKey());
                StockReservationResponse response = service.getExistingReservation(resolvedCompanyId, request.getIdempotencyKey(), request);
                return ResponseEntity.ok(ApiResponse.success(response, "StockReservation already processed"));
            }
            throw exception;
        }
    }

    @GetMapping("/by-idempotency/{idempotencyKey}")
    public ResponseEntity<ApiResponse<StockReservationResponse>> getByIdempotencyKey(
            @PathVariable UUID idempotencyKey,
            @RequestParam(required = false) UUID companyId) {
        StockReservationResponse response = service.getByIdempotencyKey(idempotencyKey, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
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
