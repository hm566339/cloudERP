package com.erp.inventory.modules.integration.stock.service.impl;

import com.erp.inventory.modules.integration.stock.dto.response.LocationStockIntegrationResponse;
import com.erp.inventory.modules.integration.stock.dto.response.ProductStockIntegrationResponse;
import com.erp.inventory.modules.integration.stock.dto.response.WarehouseStockIntegrationResponse;
import com.erp.inventory.modules.integration.stock.service.StockIntegrationService;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.InventoryStockSpecification;
import com.erp.inventory.modules.stock.dto.request.InventoryStockFilterRequest;
import com.erp.inventory.common.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockIntegrationServiceImpl implements StockIntegrationService {

    private final InventoryStockRepository inventoryStockRepository;

    @Override
    public List<ProductStockIntegrationResponse> getGroupedStock(UUID companyId, UUID productId, String search) {
        UUID company = TenantUtils.resolveCompanyId(companyId);

        InventoryStockFilterRequest filter = new InventoryStockFilterRequest();
        filter.setCompanyId(company);
        if (productId != null) {
            filter.setProductId(productId);
        }
        if (search != null && !search.trim().isEmpty()) {
            filter.setSearchKey(search);
        }

        List<InventoryStock> stocks = inventoryStockRepository.findAll(
                InventoryStockSpecification.getFilterSpecification(filter, company));

        Map<UUID, List<InventoryStock>> stockByProduct = stocks.stream()
                .collect(Collectors.groupingBy(InventoryStock::getProductId));

        return stockByProduct.entrySet().stream().map(productEntry -> {
            UUID pId = productEntry.getKey();
            List<InventoryStock> productStocks = productEntry.getValue();
            
            // Get product name from the first stock entry
            String pName = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getProductName())
                    .orElse("Unknown Product");

            Map<UUID, List<InventoryStock>> stockByWarehouse = productStocks.stream()
                    .collect(Collectors.groupingBy(InventoryStock::getWarehouseId));

            List<WarehouseStockIntegrationResponse> warehouseResponses = stockByWarehouse.entrySet().stream().map(warehouseEntry -> {
                UUID wId = warehouseEntry.getKey();
                List<InventoryStock> warehouseStocks = warehouseEntry.getValue();
                
                String wName = warehouseStocks.stream()
                        .filter(s -> s.getWarehouse() != null)
                        .findFirst()
                        .map(s -> s.getWarehouse().getWarehouseName())
                        .orElse("Unknown Warehouse");

                List<LocationStockIntegrationResponse> locationResponses = warehouseStocks.stream()
                        .filter(s -> s.getLocationId() != null)
                        .map(s -> LocationStockIntegrationResponse.builder()
                                .locationId(s.getLocationId())
                                .locationName(s.getLocation() != null ? s.getLocation().getLocationName() : "Unknown Location")
                                .batchId(s.getBatchId())
                                .batchCode(s.getBatch() != null ? s.getBatch().getBatchNumber() : null)
                                .quantity(s.getQuantity() != null ? s.getQuantity() : BigDecimal.ZERO)
                                .reservedQuantity(s.getReservedQuantity() != null ? s.getReservedQuantity() : BigDecimal.ZERO)
                                .availableQuantity(s.getAvailableQuantity() != null ? s.getAvailableQuantity() : BigDecimal.ZERO)
                                .build())
                        .collect(Collectors.toList());

                BigDecimal totalWarehouseQty = locationResponses.stream()
                        .map(LocationStockIntegrationResponse::getQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal totalWarehouseAvailable = locationResponses.stream()
                        .map(LocationStockIntegrationResponse::getAvailableQuantity)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                return WarehouseStockIntegrationResponse.builder()
                        .warehouseId(wId)
                        .warehouseName(wName)
                        .totalQuantity(totalWarehouseQty)
                        .availableQuantity(totalWarehouseAvailable)
                        .locations(locationResponses)
                        .build();
            }).collect(Collectors.toList());

            BigDecimal totalProductQty = warehouseResponses.stream()
                    .map(WarehouseStockIntegrationResponse::getTotalQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalProductAvailable = warehouseResponses.stream()
                    .map(WarehouseStockIntegrationResponse::getAvailableQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            UUID pHsnSacId = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getHsnSacId())
                    .orElse(null);

            String pHsnSacCode = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getHsnSacCode())
                    .orElse(null);

            String pHsnSacName = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getHsnSacName())
                    .orElse(null);

            BigDecimal pSellingPrice = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getSellingPrice())
                    .orElse(null);

            BigDecimal pPurchasePrice = productStocks.stream()
                    .filter(s -> s.getProduct() != null)
                    .findFirst()
                    .map(s -> s.getProduct().getStandardCost())
                    .orElse(null);

            return ProductStockIntegrationResponse.builder()
                    .productId(pId)
                    .productName(pName)
                    .totalQuantity(totalProductQty)
                    .availableQuantity(totalProductAvailable)
                    .hsnSacId(pHsnSacId)
                    .hsnSacCode(pHsnSacCode)
                    .hsnSacName(pHsnSacName)
                    .sellingPrice(pSellingPrice)
                    .purchasePrice(pPurchasePrice)
                    .warehouses(warehouseResponses)
                    .build();
        }).collect(Collectors.toList());
    }
}
