package com.erp.inventory.modules.stock.service;

import com.erp.inventory.modules.stock.dto.request.InventoryStockRequest;
import com.erp.inventory.modules.stock.dto.request.InventoryStockFilterRequest;
import com.erp.inventory.modules.stock.dto.response.InventoryStockResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InventoryStockService {

    InventoryStockResponse getById(UUID id, UUID companyId);

    Page<InventoryStockResponse> getAll(InventoryStockFilterRequest filter, Pageable pageable);

    com.erp.inventory.modules.stock.entity.InventoryStock addStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, java.math.BigDecimal quantity, java.math.BigDecimal unitCost, UUID companyId);

    void removeStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, java.math.BigDecimal quantity, UUID companyId);

    void reserveStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, java.math.BigDecimal quantity, UUID companyId);

    void releaseReservedStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, java.math.BigDecimal quantity, UUID companyId);

    void consumeReservedStock(UUID productId, UUID warehouseId, UUID locationId, UUID batchId, java.math.BigDecimal quantity, UUID companyId);
}
