package com.erp.inventory.modules.integration.salesinvoice.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutItemRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.response.SalesInvoiceStockOutResponse;
import com.erp.inventory.modules.integration.salesinvoice.service.SalesInvoiceIntegrationService;
import com.erp.inventory.modules.product.entity.Product;
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
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SalesInvoiceIntegrationServiceImpl implements SalesInvoiceIntegrationService {

    private final StockMovementRepository stockMovementRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final InventoryStockService inventoryStockService;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryCostLayerService inventoryCostLayerService;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;

    @Override
    public SalesInvoiceStockOutResponse createStockOut(SalesInvoiceStockOutRequest request) {
        UUID company = TenantUtils.resolveCompanyId(request.getCompanyId());

        if (!"OUT".equalsIgnoreCase(request.getMovementType())) {
            throw new BusinessValidationException("Only OUT movement type is supported for Sales Invoice Integration");
        }

        // Idempotency check
        Optional<StockMovement> existingMovement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(company, request.getIdempotencyKey());

        if (existingMovement.isPresent()) {
            log.info("Sales Invoice {} already processed for company {}. Returning existing stock movement details.", request.getInvoiceNumber(), company);
            StockMovement movement = existingMovement.get();
            return mapToResponse(movement, request);
        }

        LocalDateTime movementDate = request.getInvoiceDate() != null ? request.getInvoiceDate().atStartOfDay() : LocalDateTime.now();

        // 1. Create Header
        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(movementDate);
        movement.setMovementType("OUT");
        movement.setStatus("POSTED"); // Assuming auto-posted for integration
        movement.setReferenceType(ReferenceType.SALES_INVOICE);
        movement.setReferenceId(request.getInvoiceId());
        movement.setReferenceNumber(request.getInvoiceNumber());
        movement.setRemarks("Stock OUT against Sales Invoice " + request.getInvoiceNumber());
        movement.setTotalQuantity(BigDecimal.ZERO);
        movement.setTotalValue(BigDecimal.ZERO);
        movement.setIdempotencyKey(request.getIdempotencyKey());

        StockMovement savedMovement = stockMovementRepository.saveAndFlush(movement);

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalVal = BigDecimal.ZERO;

        // 2. Process Lines
        for (SalesInvoiceStockOutItemRequest item : request.getItems()) {
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

            // Capture stock snapshot before deduction for movement lines
            InventoryStock stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), item.getLocationId(), item.getBatchId(), company)
                    .orElseThrow(() -> new BusinessValidationException("Stock not found for product: " + product.getId()));

            BigDecimal oldQty = stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;
            BigDecimal avgCost = stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;
            BigDecimal lineTotalCost = item.getQuantity().multiply(avgCost).setScale(4, RoundingMode.HALF_UP);

            // Deduct Stock
            inventoryStockService.removeStock(
                    product.getId(),
                    warehouse.getId(),
                    item.getLocationId(),
                    item.getBatchId(),
                    item.getQuantity(),
                    company
            );

            // Fetch updated stock for movement line tracking
            stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), item.getLocationId(), item.getBatchId(), company)
                    .orElseThrow();
            BigDecimal newQty = stock.getQuantity();

            // Create Movement Line
            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setBatchId(item.getBatchId());
            movementLine.setSerialId(item.getSerialId());
            movementLine.setUomId(product.getBaseUomId()); // Using base UOM from product
            movementLine.setQuantity(item.getQuantity());
            movementLine.setQuantityBefore(oldQty);
            movementLine.setQuantityAfter(newQty);
            movementLine.setUnitCost(avgCost);
            movementLine.setTotalCost(lineTotalCost);
            movementLine.setSourceWarehouseId(warehouse.getId());
            movementLine.setSourceLocationId(item.getLocationId());

            stockMovementLineRepository.save(movementLine);

            // Process Cost Layer
            inventoryCostLayerService.processOutboundCost(movementLine, company);

            totalQty = totalQty.add(item.getQuantity());
            totalVal = totalVal.add(lineTotalCost);
        }

        // 3. Update Header Totals
        savedMovement.setTotalQuantity(totalQty);
        savedMovement.setTotalValue(totalVal);
        stockMovementRepository.save(savedMovement);

        return mapToResponse(savedMovement, request);
    }

    private SalesInvoiceStockOutResponse mapToResponse(StockMovement movement, SalesInvoiceStockOutRequest request) {
        return SalesInvoiceStockOutResponse.builder()
                .inventoryTransactionId(movement.getId())
                .movementId(movement.getId())
                .companyId(movement.getCompanyId())
                .invoiceId(request.getInvoiceId())
                .invoiceNumber(request.getInvoiceNumber())
                .movementType(movement.getMovementType())
                .totalQuantity(movement.getTotalQuantity())
                .totalValue(movement.getTotalValue())
                .status(movement.getStatus())
                .build();
    }

    @Override
    public SalesInvoiceStockOutResponse getExistingStockOut(UUID companyId, UUID idempotencyKey, SalesInvoiceStockOutRequest request) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        return mapToResponse(movement, request);
    }
}

