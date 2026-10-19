package com.erp.inventory.modules.reservation.service;

import com.erp.inventory.modules.reservation.dto.request.StockReservationRequest;
import com.erp.inventory.modules.reservation.dto.request.StockReservationFilterRequest;
import com.erp.inventory.modules.reservation.dto.response.StockReservationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockReservationService {

    StockReservationResponse create(StockReservationRequest request, UUID companyId);

    StockReservationResponse getById(UUID id, UUID companyId);

    Page<StockReservationResponse> getAll(StockReservationFilterRequest filter, UUID companyId, Pageable pageable);

    StockReservationResponse releaseReservation(UUID id, UUID companyId);

    StockReservationResponse consumeReservation(UUID id, java.math.BigDecimal consumeQuantity, UUID companyId);

    StockReservationResponse getExistingReservation(UUID companyId, UUID idempotencyKey, StockReservationRequest request);

    StockReservationResponse getByIdempotencyKey(UUID idempotencyKey, UUID companyId);
}
