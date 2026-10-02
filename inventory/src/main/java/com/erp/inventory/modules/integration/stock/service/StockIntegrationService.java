package com.erp.inventory.modules.integration.stock.service;

import com.erp.inventory.modules.integration.stock.dto.response.ProductStockIntegrationResponse;

import java.util.List;
import java.util.UUID;

public interface StockIntegrationService {
    List<ProductStockIntegrationResponse> getGroupedStock(UUID companyId, UUID productId, String search);
}
