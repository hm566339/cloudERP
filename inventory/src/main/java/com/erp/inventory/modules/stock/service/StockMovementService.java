package com.erp.inventory.modules.stock.service;

import com.erp.inventory.modules.stock.dto.request.StockMovementRequest;
import com.erp.inventory.modules.stock.dto.request.StockMovementFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockMovementService {

    StockMovementResponse getById(UUID id, UUID companyId);

    Page<StockMovementResponse> getAll(StockMovementFilterRequest filter, Pageable pageable, UUID companyId);
}
