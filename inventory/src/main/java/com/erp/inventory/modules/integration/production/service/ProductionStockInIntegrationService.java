package com.erp.inventory.modules.integration.production.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInResponse;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInCostedRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInCostedResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.ProductUom;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductionStockInIntegrationService {

    private final StockMovementRepository stockMovementRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final InventoryStockService inventoryStockService;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryCostLayerService inventoryCostLayerService;
    private final ProductRepository productRepository;
    private final ProductUomRepository productUomRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductSerialRepository productSerialRepository;

    public ProductionStockInResponse createStockIn(ProductionStockInRequest request, UUID requestCompanyId) {
        return createStockIn(request, requestCompanyId, null);
    }

    public ProductionStockInCostedResponse createCostedStockIn(ProductionStockInCostedRequest request, UUID requestCompanyId) {
        if (request.getProductionCostPerUnit() == null || request.getProductionCostPerUnit().signum() < 0
                || request.getProductionTotalCost() == null || request.getProductionTotalCost().signum() < 0
                || request.getProductionTotalCost().compareTo(request.getQuantity().multiply(request.getProductionCostPerUnit())) != 0) {
            throw new BusinessValidationException("Production cost is invalid or inconsistent with quantity");
        }
        ProductionStockInRequest base = ProductionStockInRequest.builder().productionOrderId(request.getProductionOrderId())
                .productionOrderOutputId(request.getProductionOrderOutputId()).productId(request.getProductId())
                .quantity(request.getQuantity()).uomId(request.getUomId()).warehouseId(request.getWarehouseId())
                .locationId(request.getLocationId()).batchId(request.getBatchId()).serialId(request.getSerialId())
                .idempotencyKey(request.getIdempotencyKey()).build();
        ProductionStockInResponse response = createStockIn(base, requestCompanyId, request.getProductionCostPerUnit());
        return ProductionStockInCostedResponse.builder().inventoryMovementId(response.getInventoryMovementId())
                .movementType(response.getMovementType()).referenceType(response.getReferenceType())
                .referenceId(response.getReferenceId()).referenceLineId(response.getReferenceLineId())
                .companyId(response.getCompanyId()).quantity(response.getQuantity()).uomId(response.getUomId())
                .unitCost(request.getProductionCostPerUnit()).totalCost(request.getProductionTotalCost())
                .status(response.getStatus()).build();
    }

    private ProductionStockInResponse createStockIn(ProductionStockInRequest request, UUID requestCompanyId,
                                                     BigDecimal suppliedUnitCost) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        validateQuantity(request.getQuantity());

        Optional<StockMovement> existing = stockMovementRepository
                .findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey());
        if (existing.isPresent()) {
            return response(existing.get(), request, companyId, request.getQuantity(), request.getUomId());
        }

        Product product = productRepository.findByIdAndCompanyId(request.getProductId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or belongs to another company"));
        if (product.getStatus() == null || !product.getStatus().name().equals("ACTIVE")
                || Boolean.TRUE.equals(product.getIsDeleted())) {
            throw new BusinessValidationException("Product is inactive or deleted");
        }
        BigDecimal unitCost = suppliedUnitCost == null ? product.getStandardCost() : suppliedUnitCost;
        if (unitCost == null || unitCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Product standard cost is required for production stock-in");
        }

        UnitOfMeasure transactionUom = unitOfMeasureRepository.findByIdAndCompanyId(request.getUomId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("UOM not found or belongs to another company"));
        if (!Boolean.TRUE.equals(transactionUom.getIsActive()) || Boolean.TRUE.equals(transactionUom.getIsDeleted())) {
            throw new BusinessValidationException("UOM is inactive");
        }
        BigDecimal conversionFactor = resolveConversionFactor(product, request.getUomId(), companyId);
        BigDecimal stockQuantity = request.getQuantity().multiply(conversionFactor);

        var warehouse = warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found or belongs to another company"));
        if ("INACTIVE".equalsIgnoreCase(warehouse.getStatus()) || Boolean.TRUE.equals(warehouse.getIsDeleted())) {
            throw new BusinessValidationException("Warehouse is inactive");
        }
        var location = warehouseLocationRepository.findByIdAndCompanyId(request.getLocationId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found or belongs to another company"));
        if (!request.getWarehouseId().equals(location.getWarehouseId()) || !Boolean.TRUE.equals(location.getIsActive())
                || Boolean.TRUE.equals(location.getIsDeleted())) {
            throw new BusinessValidationException("Location is invalid for the warehouse");
        }
        validateTracking(product, request, companyId);

        InventoryStock stock = inventoryStockRepository.findUniqueStock(product.getId(), request.getWarehouseId(),
                request.getLocationId(), request.getBatchId(), companyId).orElse(null);
        BigDecimal oldQuantity = stock == null || stock.getQuantity() == null ? BigDecimal.ZERO : stock.getQuantity();
        BigDecimal totalCost = stockQuantity.multiply(unitCost).setScale(4, RoundingMode.HALF_UP);

        StockMovement movement = new StockMovement();
        movement.setCompanyId(companyId);
        movement.setMovementDate(LocalDateTime.now());
        movement.setMovementType("PRODUCTION_IN");
        movement.setStatus("POSTED");
        movement.setReferenceType(ReferenceType.PRODUCTION);
        movement.setReferenceId(request.getProductionOrderId());
        movement.setReferenceNumber(request.getProductionOrderId().toString());
        movement.setRemarks("Production output receipt");
        movement.setTotalQuantity(stockQuantity);
        movement.setTotalValue(totalCost);
        movement.setIdempotencyKey(request.getIdempotencyKey());
        StockMovement saved = stockMovementRepository.saveAndFlush(movement);

        inventoryStockService.addStock(product.getId(), request.getWarehouseId(), request.getLocationId(),
                request.getBatchId(), stockQuantity, unitCost, companyId);

        StockMovementLine line = new StockMovementLine();
        line.setCompanyId(companyId);
        line.setStockMovementId(saved.getId());
        line.setProductId(product.getId());
        line.setBatchId(request.getBatchId());
        line.setSerialId(request.getSerialId());
        line.setUomId(product.getBaseUomId());
        line.setTransactionUomId(request.getUomId());
        line.setTransactionQuantity(request.getQuantity());
        line.setConversionFactor(conversionFactor);
        line.setTransactionUnitCost(unitCost.multiply(conversionFactor));
        line.setQuantity(stockQuantity);
        line.setQuantityBefore(oldQuantity);
        line.setQuantityAfter(oldQuantity.add(stockQuantity));
        line.setUnitCost(unitCost);
        line.setTotalCost(totalCost);
        line.setDestinationWarehouseId(request.getWarehouseId());
        line.setDestinationLocationId(request.getLocationId());
        line.setReferenceLineId(request.getProductionOrderOutputId());
        StockMovementLine savedLine = stockMovementLineRepository.save(line);
        inventoryCostLayerService.processInboundCost(savedLine, companyId);

        return response(saved, request, companyId, request.getQuantity(), request.getUomId());
    }

    public ProductionStockInResponse getExistingStockIn(UUID companyId, UUID idempotencyKey,
                                                         ProductionStockInRequest request) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        return response(movement, request, companyId, request.getQuantity(), request.getUomId());
    }

    private BigDecimal resolveConversionFactor(Product product, UUID uomId, UUID companyId) {
        if (uomId.equals(product.getBaseUomId())) return BigDecimal.ONE;
        ProductUom mapping = productUomRepository.findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(
                        product.getId(), uomId, companyId)
                .orElseThrow(() -> new BusinessValidationException("UOM is not compatible with product"));
        if (mapping.getConversionFactor() == null || mapping.getConversionFactor().signum() <= 0) {
            throw new BusinessValidationException("Invalid product UOM conversion factor");
        }
        return mapping.getConversionFactor();
    }

    private void validateTracking(Product product, ProductionStockInRequest request, UUID companyId) {
        TrackingType tracking = product.getTrackingType() == null ? TrackingType.NONE : product.getTrackingType();
        if ((tracking == TrackingType.BATCH || tracking == TrackingType.BATCH_AND_SERIAL) && request.getBatchId() == null) {
            throw new BusinessValidationException("Batch ID is required");
        }
        if (request.getBatchId() != null) {
            var batch = productBatchRepository.findByIdAndCompanyId(request.getBatchId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found or belongs to another company"));
            if (!product.getId().equals(batch.getProductId()) || !"ACTIVE".equalsIgnoreCase(batch.getStatus())) {
                throw new BusinessValidationException("Batch is invalid for product");
            }
        }
        if ((tracking == TrackingType.SERIAL || tracking == TrackingType.BATCH_AND_SERIAL) && request.getSerialId() == null) {
            throw new BusinessValidationException("Serial ID is required");
        }
        if (request.getSerialId() != null) {
            var serial = productSerialRepository.findByIdAndCompanyId(request.getSerialId(), companyId)
                    .orElseThrow(() -> new ResourceNotFoundException("Serial not found or belongs to another company"));
            if (!product.getId().equals(serial.getProductId())
                    || (request.getBatchId() != null && serial.getBatchId() != null
                    && !request.getBatchId().equals(serial.getBatchId()))) {
                throw new BusinessValidationException("Serial is invalid for product or batch");
            }
        }
        if (tracking == TrackingType.NONE && (request.getBatchId() != null || request.getSerialId() != null)) {
            throw new BusinessValidationException("Batch or serial is not allowed for untracked product");
        }
    }

    private void validateQuantity(BigDecimal quantity) {
        if (quantity == null || quantity.signum() <= 0) {
            throw new BusinessValidationException("Quantity must be greater than zero");
        }
    }

    private ProductionStockInResponse response(StockMovement movement, ProductionStockInRequest request,
                                                UUID companyId, BigDecimal quantity, UUID uomId) {
        return ProductionStockInResponse.builder()
                .inventoryMovementId(movement.getId())
                .movementType(movement.getMovementType())
                .referenceType(movement.getReferenceType().name())
                .referenceId(movement.getReferenceId())
                .referenceLineId(request.getProductionOrderOutputId())
                .companyId(companyId)
                .quantity(quantity)
                .uomId(uomId)
                .status(movement.getStatus())
                .build();
    }
}