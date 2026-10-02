package com.erp.inventory.modules.stock.service;

import com.erp.inventory.modules.stock.dto.request.StockMovementLineRequest;
import com.erp.inventory.modules.stock.dto.request.StockMovementLineFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementLineResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockMovementLineService {

    StockMovementLineResponse getById(UUID id, UUID companyId);

    Page<StockMovementLineResponse> getAll(StockMovementLineFilterRequest filter, Pageable pageable);
}
