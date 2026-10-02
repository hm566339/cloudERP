package com.erp.inventory.modules.valuation.service;

import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerFilterRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryCostLayerResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.erp.inventory.modules.stock.entity.StockMovementLine;
import java.util.UUID;

public interface InventoryCostLayerService {

    InventoryCostLayerResponse getById(UUID id, UUID companyId);

    Page<InventoryCostLayerResponse> getAll(InventoryCostLayerFilterRequest filter, UUID companyId, Pageable pageable);

    void processInboundCost(StockMovementLine movementLine, UUID companyId);

    void processOutboundCost(StockMovementLine movementLine, UUID companyId);
}
