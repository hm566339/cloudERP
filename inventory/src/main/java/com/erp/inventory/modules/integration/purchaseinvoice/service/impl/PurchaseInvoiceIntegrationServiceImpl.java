package com.erp.inventory.modules.integration.purchaseinvoice.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInItemRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.response.PurchaseInvoiceStockInResponse;
import com.erp.inventory.modules.integration.purchaseinvoice.service.PurchaseInvoiceIntegrationService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.service.ProductUomConversionService;
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
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseInvoiceIntegrationServiceImpl implements PurchaseInvoiceIntegrationService {

    private final StockMovementRepository stockMovementRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final InventoryStockService inventoryStockService;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryCostLayerService inventoryCostLayerService;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProductUomConversionService productUomConversionService;

    @Override
    public PurchaseInvoiceStockInResponse createStockIn(PurchaseInvoiceStockInRequest request) {
        UUID company = TenantUtils.resolveCompanyId(request.getCompanyId());

        if (!"STOCK_IN".equalsIgnoreCase(request.getMovementType())) {
            throw new BusinessValidationException("Only STOCK_IN movement type is supported for Purchase Invoice Integration");
        }

        // Idempotency check
        Optional<StockMovement> existingMovement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(company, request.getIdempotencyKey());

        if (existingMovement.isPresent()) {
            log.info("Purchase Invoice {} already processed for company {}. Returning existing stock movement details.", request.getInvoiceNumber(), company);
            StockMovement movement = existingMovement.get();
            return mapToResponse(movement, request);
        }

        LocalDateTime movementDate = request.getInvoiceDate() != null ? request.getInvoiceDate().atStartOfDay() : LocalDateTime.now();

        // 1. Create Header with initial DRAFT status
        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(movementDate);
        movement.setMovementType("IN");
        movement.setStatus("DRAFT");
        movement.setReferenceType(ReferenceType.PURCHASE_RECEIPT);
        movement.setReferenceId(request.getInvoiceId());
        movement.setReferenceNumber(request.getInvoiceNumber());
        movement.setRemarks("Stock IN against Purchase Invoice " + request.getInvoiceNumber());
        movement.setTotalQuantity(BigDecimal.ZERO);
        movement.setTotalValue(BigDecimal.ZERO);
        movement.setIdempotencyKey(request.getIdempotencyKey());

        StockMovement savedMovement = stockMovementRepository.saveAndFlush(movement);

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalVal = BigDecimal.ZERO;

        // 2. Process Lines
        for (PurchaseInvoiceStockInItemRequest item : request.getItems()) {
            Product product = productRepository.findByIdAndCompanyId(item.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + item.getProductId()));

            if (!com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE.equals(product.getStatus())) {
                throw new BusinessValidationException("Product is not active: " + item.getProductId());
            }

            Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(item.getWarehouseId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + item.getWarehouseId()));

            WarehouseLocation location = null;
            if (item.getLocationId() != null) {
                location = warehouseLocationRepository.findByIdAndCompanyId(item.getLocationId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Location not found: " + item.getLocationId()));
                if (!location.getWarehouseId().equals(warehouse.getId())) {
                    throw new BusinessValidationException("Location does not belong to the specified warehouse");
                }
            }

            ProductUomConversionService.NormalizedQuantity normalized = productUomConversionService
                    .normalize(product, item.getQuantity(), item.getUnit(), company);
            BigDecimal normalizedUnitCost = productUomConversionService
                    .normalizeUnitCost(item.getUnitPrice(), normalized.conversionFactor());
            BigDecimal lineTotalCost = normalized.normalizedQuantity().multiply(normalizedUnitCost)
                    .setScale(4, RoundingMode.HALF_UP);

            log.info("ABOUT TO UPDATE INVENTORY: productId={}, warehouseId={}, locationId={}, batchId={}, quantity={}, unitCost={}",
                    product.getId(), warehouse.getId(), item.getLocationId(), item.getBatchId(), normalized.normalizedQuantity(), normalizedUnitCost);

            // Add Stock (executes atomic lookup, lock, and immediate flush of INSERT or UPDATE into inventory_stock)
            InventoryStock updatedStock = inventoryStockService.addStock(
                    product.getId(),
                    warehouse.getId(),
                    item.getLocationId(),
                    item.getBatchId(),
                    normalized.normalizedQuantity(),
                    normalizedUnitCost,
                    company
            );

            log.info("INVENTORY SAVE COMPLETE: updatedStockId={}, resultingQuantity={}",
                    updatedStock.getId(), updatedStock.getQuantity());

            BigDecimal newQty = updatedStock.getQuantity();
            BigDecimal oldQty = newQty.subtract(normalized.normalizedQuantity());
            if (oldQty.compareTo(BigDecimal.ZERO) < 0) {
                oldQty = BigDecimal.ZERO;
            }

            // Create Movement Line
            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setBatchId(item.getBatchId());
            movementLine.setSerialId(item.getSerialId());
            movementLine.setUomId(normalized.stockUomId());
            movementLine.setTransactionUomId(normalized.transactionUomId());
            movementLine.setTransactionQuantity(normalized.transactionQuantity());
            movementLine.setConversionFactor(normalized.conversionFactor());
            movementLine.setTransactionUnitCost(item.getUnitPrice());
            movementLine.setQuantity(normalized.normalizedQuantity());
            movementLine.setQuantityBefore(oldQty);
            movementLine.setQuantityAfter(newQty);
            movementLine.setUnitCost(normalizedUnitCost);
            movementLine.setTotalCost(lineTotalCost);
            movementLine.setDestinationWarehouseId(warehouse.getId());
            movementLine.setDestinationLocationId(item.getLocationId());

            StockMovementLine savedLine = stockMovementLineRepository.saveAndFlush(movementLine);

            // Process Cost Layer
            inventoryCostLayerService.processInboundCost(savedLine, company);

            totalQty = totalQty.add(item.getQuantity());
            totalVal = totalVal.add(lineTotalCost);
        }

        // 3. Mark Header POSTED only after all lines and inventory stocks are successfully updated
        savedMovement.setStatus("POSTED");
        savedMovement.setPostedAt(LocalDateTime.now());
        if (com.erp.inventory.common.security.CurrentUserContext.getUserId() != null) {
            savedMovement.setPostedBy(com.erp.inventory.common.security.CurrentUserContext.getUserId());
        }
        savedMovement.setTotalQuantity(totalQty);
        savedMovement.setTotalValue(totalVal);
        stockMovementRepository.saveAndFlush(savedMovement);

        return mapToResponse(savedMovement, request);
    }

    private PurchaseInvoiceStockInResponse mapToResponse(StockMovement movement, PurchaseInvoiceStockInRequest request) {
        return PurchaseInvoiceStockInResponse.builder()
                .transactionId(movement.getId())
                .status("SUCCESS")
                .message("Stock-in processed successfully")
                .build();
    }

    @Override
    public PurchaseInvoiceStockInResponse getExistingStockIn(UUID companyId, UUID idempotencyKey, PurchaseInvoiceStockInRequest request) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        
        PurchaseInvoiceStockInResponse response = mapToResponse(movement, request);
        response.setMessage("Stock-in already processed");
        return response;
    }
}
