package com.erp.inventory.modules.adjustment.service;

import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentRequest;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentFilterRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockAdjustmentService {

    StockAdjustmentResponse create(StockAdjustmentRequest request, UUID companyId);

    StockAdjustmentResponse getById(UUID id, UUID companyId);

    Page<StockAdjustmentResponse> getAll(StockAdjustmentFilterRequest filter, Pageable pageable, UUID companyId);

    StockAdjustmentResponse submitForApproval(UUID id, UUID companyId, String comments);

    StockAdjustmentResponse approveAdjustment(UUID id, UUID companyId);

    StockAdjustmentResponse rejectAdjustment(UUID id, UUID companyId, String reason);

    StockAdjustmentResponse cancelAdjustment(UUID id, UUID companyId);

    void processStockAdjustmentMovement(UUID id, UUID companyId);
}
