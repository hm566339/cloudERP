package com.erp.inventory.modules.integration.deliverychallan.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutItemRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.response.DeliveryChallanStockOutResponse;
import com.erp.inventory.modules.integration.deliverychallan.service.DeliveryChallanIntegrationService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DeliveryChallanIntegrationServiceImpl implements DeliveryChallanIntegrationService {

    private final StockMovementRepository stockMovementRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final InventoryStockService inventoryStockService;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryCostLayerService inventoryCostLayerService;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;

    @Override
    public DeliveryChallanStockOutResponse createStockOut(DeliveryChallanStockOutRequest request) {
        log.info("STOCK OUT PROCESS START - DC Number: {}, Delivery Challan ID: {}", request.getDcNumber(), request.getDeliveryChallanId());
        UUID company = CurrentUserContext.hasCompanyId() ? TenantUtils.resolveCompanyId(request.getCompanyId()) : request.getCompanyId();
        if (company == null) {
            company = request.getCompanyId();
        }

        if (!"OUT".equalsIgnoreCase(request.getMovementType())) {
            throw new BusinessValidationException("Only OUT movement type is supported for Delivery Challan Integration");
        }

        // 1. Idempotency and Duplicate Protection Check
        Optional<StockMovement> existingMovement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(company, request.getIdempotencyKey());
        if (existingMovement.isEmpty()) {
            existingMovement = stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(
                    company, ReferenceType.DELIVERY_CHALLAN, request.getDeliveryChallanId());
        }

        if (existingMovement.isPresent()) {
            StockMovement movement = existingMovement.get();
            log.info("Delivery Challan {} already processed for company {}. Returning existing stock movement details. Stock Movement ID: {}",
                    request.getDcNumber(), company, movement.getId());
            return mapToResponse(movement, request, "Delivery Challan stock-out already processed (Idempotent)");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessValidationException("Delivery Challan must have at least one item for stock-out");
        }

        // 2. Pre-validation Phase: Validate all products, warehouses, locations, and stock sufficiency BEFORE creating any records
        for (DeliveryChallanStockOutItemRequest item : request.getItems()) {
            log.info("PROCESSING ITEM - DC Number: {}, Product ID: {}, Warehouse ID: {}, Location ID: {}, Quantity Out: {}",
                    request.getDcNumber(), item.getProductId(), item.getWarehouseId(), item.getLocationId(), item.getQuantity());

            Product product = productRepository.findByIdAndCompanyId(item.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            if (!ProductStatus.ACTIVE.equals(product.getStatus())) {
                throw new BusinessValidationException("Product is not active: " + item.getProductId());
            }

            Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(item.getWarehouseId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + item.getWarehouseId()));

            if (item.getLocationId() == null) {
                List<InventoryStock> stocks = inventoryStockRepository.findAllByProductIdAndCompanyId(item.getProductId(), company);
                stocks.stream()
                        .filter(s -> item.getWarehouseId().equals(s.getWarehouseId()) && s.getLocationId() != null)
                        .findFirst()
                        .ifPresent(s -> item.setLocationId(s.getLocationId()));
            }

            if (item.getLocationId() != null) {
                WarehouseLocation location = warehouseLocationRepository.findByIdAndCompanyId(item.getLocationId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + item.getLocationId()));
                if (!location.getWarehouseId().equals(warehouse.getId())) {
                    throw new BusinessValidationException("Location does not belong to the specified warehouse");
                }
            }

            log.info("INVENTORY LOOKUP - DC Number: {}, Product ID: {}, Warehouse ID: {}, Location ID: {}",
                    request.getDcNumber(), item.getProductId(), item.getWarehouseId(), item.getLocationId());

            InventoryStock currentStock = inventoryStockRepository.findUniqueStock(
                    item.getProductId(), item.getWarehouseId(), item.getLocationId(), item.getBatchId(), company)
                    .orElseThrow(() -> new BusinessValidationException(
                            String.format("Cannot remove stock: Inventory stock does not exist for Product ID: %s in Warehouse: %s",
                                    item.getProductId(), item.getWarehouseId())));

            BigDecimal oldAvailable = currentStock.getAvailableQuantity() != null ? currentStock.getAvailableQuantity() : BigDecimal.ZERO;
            BigDecimal oldQuantity = currentStock.getQuantity() != null ? currentStock.getQuantity() : BigDecimal.ZERO;

            log.info("CURRENT STOCK - DC Number: {}, Product ID: {}, Warehouse ID: {}, Location ID: {}, Quantity Before: {}, Available: {}",
                    request.getDcNumber(), item.getProductId(), item.getWarehouseId(), item.getLocationId(), oldQuantity, oldAvailable);

            if (item.getQuantity().compareTo(oldAvailable) > 0) {
                log.error("INSUFFICIENT STOCK - DC Number: {}, Product ID: {}, Requested: {}, Available: {}",
                        request.getDcNumber(), item.getProductId(), item.getQuantity(), oldAvailable);
                throw new BusinessValidationException(String.format(
                        "Insufficient available stock for product '%s' (ID: %s). Available: %s, Requested: %s",
                        product.getProductName() != null ? product.getProductName() : product.getId().toString(),
                        item.getProductId(), oldAvailable, item.getQuantity()));
            }

            log.info("STOCK SUFFICIENT - DC Number: {}, Product ID: {}, Requested: {}, Available: {}",
                    request.getDcNumber(), item.getProductId(), item.getQuantity(), oldAvailable);
        }

        // 3. Create Stock Movement Header
        log.info("CREATING OUT MOVEMENT - DC Number: {}, ReferenceType: {}, MovementType: {}",
                request.getDcNumber(), ReferenceType.DELIVERY_CHALLAN, "OUT");

        LocalDateTime movementDate = request.getDcDate() != null ? request.getDcDate().atStartOfDay() : LocalDateTime.now();

        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(movementDate);
        movement.setMovementType("OUT");
        movement.setStatus("POSTED");
        movement.setReferenceType(ReferenceType.DELIVERY_CHALLAN);
        movement.setReferenceId(request.getDeliveryChallanId());
        movement.setReferenceNumber(request.getDcNumber());
        movement.setRemarks("Stock OUT against Delivery Challan " + request.getDcNumber());
        movement.setTotalQuantity(BigDecimal.ZERO);
        movement.setTotalValue(BigDecimal.ZERO);
        movement.setIdempotencyKey(request.getIdempotencyKey());
        movement.setPostedAt(LocalDateTime.now());
        if (CurrentUserContext.getUserId() != null) {
            movement.setPostedBy(CurrentUserContext.getUserId());
        }

        StockMovement savedMovement = stockMovementRepository.saveAndFlush(movement);
        UUID stockMovementId = savedMovement.getId();

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalVal = BigDecimal.ZERO;

        // 4. Process Items: Deduct Inventory, Create Movement Lines, and Outbound Cost Layers
        for (DeliveryChallanStockOutItemRequest item : request.getItems()) {
            Product product = productRepository.findByIdAndCompanyId(item.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(item.getWarehouseId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + item.getWarehouseId()));

            InventoryStock stockBefore = inventoryStockRepository.findUniqueStock(
                    item.getProductId(), item.getWarehouseId(), item.getLocationId(), item.getBatchId(), company)
                    .orElseThrow();

            BigDecimal oldQty = stockBefore.getQuantity() != null ? stockBefore.getQuantity() : BigDecimal.ZERO;
            BigDecimal avgCost = stockBefore.getAverageCost() != null ? stockBefore.getAverageCost() : BigDecimal.ZERO;
            BigDecimal lineTotalCost = item.getQuantity().multiply(avgCost).setScale(4, RoundingMode.HALF_UP);

            log.info("UPDATING INVENTORY - DC Number: {}, Stock Movement ID: {}, Product ID: {}, Warehouse ID: {}, Location ID: {}, Quantity Before: {}, Quantity Out: {}",
                    request.getDcNumber(), stockMovementId, item.getProductId(), item.getWarehouseId(), item.getLocationId(), oldQty, item.getQuantity());

            // Deduct Stock atomically
            inventoryStockService.removeStock(
                    item.getProductId(),
                    item.getWarehouseId(),
                    item.getLocationId(),
                    item.getBatchId(),
                    item.getQuantity(),
                    company
            );

            // Fetch updated stock row for accurate before/after movement line tracking
            InventoryStock stockAfter = inventoryStockRepository.findUniqueStock(
                    item.getProductId(), item.getWarehouseId(), item.getLocationId(), item.getBatchId(), company)
                    .orElseThrow();

            BigDecimal newQty = stockAfter.getQuantity();

            log.info("INVENTORY UPDATED - DC Number: {}, Stock Movement ID: {}, Product ID: {}, Warehouse ID: {}, Location ID: {}, Quantity Before: {}, Quantity Out: {}, Quantity After: {}",
                    request.getDcNumber(), stockMovementId, item.getProductId(), item.getWarehouseId(), item.getLocationId(), oldQty, item.getQuantity(), newQty);

            // Create Movement Line
            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setBatchId(item.getBatchId());
            movementLine.setSerialId(item.getSerialId());
            movementLine.setUomId(product.getBaseUomId());
            movementLine.setQuantity(item.getQuantity());
            movementLine.setQuantityBefore(oldQty);
            movementLine.setQuantityAfter(newQty);
            movementLine.setUnitCost(avgCost);
            movementLine.setTotalCost(lineTotalCost);
            movementLine.setSourceWarehouseId(warehouse.getId());
            movementLine.setSourceLocationId(item.getLocationId());

            StockMovementLine savedLine = stockMovementLineRepository.saveAndFlush(movementLine);

            // Process Outbound Cost Layer
            inventoryCostLayerService.processOutboundCost(savedLine, company);

            totalQty = totalQty.add(item.getQuantity());
            totalVal = totalVal.add(lineTotalCost);
        }

        // 5. Update Movement Header Totals
        savedMovement.setTotalQuantity(totalQty);
        savedMovement.setTotalValue(totalVal);
        stockMovementRepository.saveAndFlush(savedMovement);

        log.info("STOCK OUT POSTED - Stock Movement ID: {}, DC Number: {}, Total Quantity: {}, Total Value: {}",
                stockMovementId, request.getDcNumber(), totalQty, totalVal);

        return mapToResponse(savedMovement, request, "Delivery Challan stock issued successfully");
    }

    private DeliveryChallanStockOutResponse mapToResponse(StockMovement movement, DeliveryChallanStockOutRequest request, String message) {
        return DeliveryChallanStockOutResponse.builder()
                .inventoryTransactionId(movement.getId())
                .movementId(movement.getId())
                .companyId(movement.getCompanyId())
                .deliveryChallanId(request.getDeliveryChallanId())
                .dcNumber(request.getDcNumber())
                .movementType(movement.getMovementType())
                .totalQuantity(movement.getTotalQuantity())
                .totalValue(movement.getTotalValue())
                .status(movement.getStatus())
                .message(message)
                .build();
    }

    @Override
    public DeliveryChallanStockOutResponse getExistingStockOut(UUID companyId, UUID idempotencyKey, DeliveryChallanStockOutRequest request) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .or(() -> stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(
                        companyId, ReferenceType.DELIVERY_CHALLAN, request.getDeliveryChallanId()))
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        return mapToResponse(movement, request, "Delivery Challan stock-out already processed (Idempotent response)");
    }
}
