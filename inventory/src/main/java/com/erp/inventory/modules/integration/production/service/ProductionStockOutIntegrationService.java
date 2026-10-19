package com.erp.inventory.modules.integration.production.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.ProductUom;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.reservation.entity.StockReservation;
import com.erp.inventory.modules.reservation.enums.ReservationStatus;
import com.erp.inventory.modules.reservation.repository.StockReservationRepository;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductionStockOutIntegrationService {

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
    private final StockReservationRepository stockReservationRepository;
    private final ProductBatchRepository productBatchRepository;
    private final ProductSerialRepository productSerialRepository;

    public ProductionStockOutResponse createStockOut(ProductionStockOutRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        validateQuantity(request.getQuantity());

        Optional<StockMovement> existing = stockMovementRepository
                .findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey());
        if (existing.isPresent()) {
            validateStockOutPayload(existing.get(), request);
            return response(existing.get(), request, companyId, request.getQuantity(), request.getUomId());
        }

        Product product = productRepository.findByIdAndCompanyId(request.getProductId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or belongs to another company"));
        if (product.getStatus() == null || !product.getStatus().name().equals("ACTIVE") || Boolean.TRUE.equals(product.getIsDeleted())) {
            throw new BusinessValidationException("Product is inactive or deleted");
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

        StockReservation reservation = stockReservationRepository.findByIdAndCompanyId(request.getReservationId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found or belongs to another company"));
        validateReservation(reservation, request, companyId, stockQuantity);

        InventoryStock stock = inventoryStockRepository.findUniqueStock(product.getId(), request.getWarehouseId(),
                request.getLocationId(), request.getBatchId(), companyId)
                .orElseThrow(() -> new BusinessValidationException("Inventory stock not found"));
        BigDecimal oldQuantity = nonNull(stock.getQuantity());
        BigDecimal unitCost = nonNull(stock.getAverageCost());
        BigDecimal totalCost = stockQuantity.multiply(unitCost).setScale(4, RoundingMode.HALF_UP);

        StockMovement movement = new StockMovement();
        movement.setCompanyId(companyId);
        movement.setMovementDate(LocalDateTime.now());
        movement.setMovementType("PRODUCTION_OUT");
        movement.setStatus("POSTED");
        movement.setReferenceType(ReferenceType.PRODUCTION);
        movement.setReferenceId(request.getProductionOrderId());
        movement.setReferenceNumber(request.getProductionOrderId().toString());
        movement.setRemarks("Production material consumption");
        movement.setTotalQuantity(stockQuantity);
        movement.setTotalValue(totalCost);
        movement.setIdempotencyKey(request.getIdempotencyKey());
        StockMovement saved = stockMovementRepository.saveAndFlush(movement);

        inventoryStockService.consumeReservedStock(product.getId(), request.getWarehouseId(), request.getLocationId(),
                request.getBatchId(), stockQuantity, companyId);

        StockMovementLine line = new StockMovementLine();
        line.setCompanyId(companyId);
        line.setStockMovementId(saved.getId());
        line.setProductId(product.getId());
        line.setSourceWarehouseId(request.getWarehouseId());
        line.setSourceLocationId(request.getLocationId());
        line.setBatchId(request.getBatchId());
        line.setSerialId(request.getSerialId());
        line.setUomId(product.getBaseUomId());
        line.setTransactionUomId(request.getUomId());
        line.setTransactionQuantity(request.getQuantity());
        line.setConversionFactor(conversionFactor);
        line.setQuantity(stockQuantity);
        line.setQuantityBefore(oldQuantity);
        line.setQuantityAfter(oldQuantity.subtract(stockQuantity));
        line.setUnitCost(unitCost);
        line.setTotalCost(totalCost);
        line.setReferenceLineId(request.getProductionOrderMaterialId());
        stockMovementLineRepository.save(line);
        inventoryCostLayerService.processOutboundCost(line, companyId);

        BigDecimal consumedReservation = nonNull(reservation.getReleasedQuantity()).add(stockQuantity);
        reservation.setReleasedQuantity(consumedReservation);
        reservation.setStatus(consumedReservation.compareTo(reservation.getReservedQuantity()) >= 0
                ? ReservationStatus.CONSUMED.name() : ReservationStatus.PARTIALLY_CONSUMED.name());
        stockReservationRepository.save(reservation);
        return response(saved, request, companyId, request.getQuantity(), request.getUomId());
    }

    private void validateReservation(StockReservation reservation, ProductionStockOutRequest request, UUID companyId,
                                     BigDecimal stockQuantity) {
        if (reservation.getReferenceType() != ReferenceType.PRODUCTION
                || !request.getProductionOrderId().equals(reservation.getReferenceId())
                || !request.getProductionOrderMaterialId().equals(reservation.getReferenceLineId())
                || !request.getProductId().equals(reservation.getProductId())
                || !companyId.equals(reservation.getCompanyId())) {
            throw new BusinessValidationException("Reservation does not belong to the production material");
        }
        BigDecimal remaining = nonNull(reservation.getReservedQuantity()).subtract(nonNull(reservation.getReleasedQuantity()));
        if (!ReservationStatus.RESERVED.name().equals(reservation.getStatus())
                && !ReservationStatus.PARTIALLY_CONSUMED.name().equals(reservation.getStatus())) {
            throw new BusinessValidationException("Reservation is not consumable");
        }
        if (stockQuantity.compareTo(remaining) > 0) {
            throw new BusinessValidationException("Consumption exceeds reserved quantity");
        }
    }

    private BigDecimal resolveConversionFactor(Product product, UUID uomId, UUID companyId) {
        if (uomId.equals(product.getBaseUomId())) return BigDecimal.ONE;
        ProductUom mapping = productUomRepository.findByProductIdAndUomIdAndCompanyIdAndIsDeletedFalse(product.getId(), uomId, companyId)
                .orElseThrow(() -> new BusinessValidationException("UOM is not compatible with product"));
        if (mapping.getConversionFactor() == null || mapping.getConversionFactor().signum() <= 0) {
            throw new BusinessValidationException("Invalid product UOM conversion factor");
        }
        return mapping.getConversionFactor();
    }

    private void validateTracking(Product product, ProductionStockOutRequest request, UUID companyId) {
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
        if (quantity == null || quantity.signum() <= 0) throw new BusinessValidationException("Quantity must be greater than zero");
    }

    private ProductionStockOutResponse response(StockMovement movement, ProductionStockOutRequest request, UUID companyId,
                                                BigDecimal quantity, UUID uomId) {
        return ProductionStockOutResponse.builder().inventoryMovementId(movement.getId()).movementType(movement.getMovementType())
                .referenceType(movement.getReferenceType().name()).referenceId(movement.getReferenceId())
                .referenceLineId(request.getProductionOrderMaterialId()).companyId(companyId).quantity(quantity).uomId(uomId)
                .status(movement.getStatus()).build();
    }

    private BigDecimal nonNull(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

    public ProductionStockOutResponse getExistingStockOut(UUID companyId, UUID idempotencyKey,
                                                           ProductionStockOutRequest request) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        validateStockOutPayload(movement, request);
        return response(movement, request, companyId, request.getQuantity(), request.getUomId());
    }

    public ProductionStockOutResponse getMovementByIdempotencyKey(UUID companyId, UUID idempotencyKey) {
        StockMovement movement = stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)
                .orElseThrow(() -> new ResourceNotFoundException("StockMovement not found for idempotencyKey: " + idempotencyKey));
        return ProductionStockOutResponse.builder()
                .inventoryMovementId(movement.getId())
                .movementType(movement.getMovementType())
                .referenceType(movement.getReferenceType() != null ? movement.getReferenceType().name() : null)
                .referenceId(movement.getReferenceId())
                .companyId(companyId)
                .quantity(movement.getTotalQuantity())
                .status(movement.getStatus())
                .build();
    }

    private void validateStockOutPayload(StockMovement movement, ProductionStockOutRequest request) {
        if (movement.getReferenceId() != null && !movement.getReferenceId().equals(request.getProductionOrderId())) {
            throw new BusinessValidationException("Idempotency key reuse with mismatched payload: production order mismatch");
        }
        List<StockMovementLine> lines = stockMovementLineRepository.findAllByStockMovementId(movement.getId());
        if (!lines.isEmpty()) {
            StockMovementLine line = lines.get(0);
            if (line.getProductId() != null && !line.getProductId().equals(request.getProductId())) {
                throw new BusinessValidationException("Idempotency key reuse with mismatched payload: product mismatch");
            }
            if (line.getSourceWarehouseId() != null && !line.getSourceWarehouseId().equals(request.getWarehouseId())) {
                throw new BusinessValidationException("Idempotency key reuse with mismatched payload: warehouse mismatch");
            }
            if (line.getTransactionQuantity() != null && request.getQuantity() != null
                    && line.getTransactionQuantity().compareTo(request.getQuantity()) != 0) {
                throw new BusinessValidationException("Idempotency key reuse with mismatched payload: quantity mismatch");
            }
        }
    }
}
