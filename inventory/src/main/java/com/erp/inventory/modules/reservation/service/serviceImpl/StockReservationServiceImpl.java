package com.erp.inventory.modules.reservation.service.serviceImpl;

import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.serial.entity.ProductSerial;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.reservation.entity.StockReservation;
import com.erp.inventory.modules.reservation.enums.ReservationStatus;
import com.erp.inventory.modules.reservation.dto.request.StockReservationRequest;
import com.erp.inventory.modules.reservation.dto.request.StockReservationFilterRequest;
import com.erp.inventory.modules.reservation.dto.response.StockReservationResponse;
import com.erp.inventory.modules.reservation.service.StockReservationService;
import com.erp.inventory.modules.reservation.mapper.StockReservationMapper;
import com.erp.inventory.modules.reservation.repository.StockReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.Arrays;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class StockReservationServiceImpl implements StockReservationService {

    private final StockReservationRepository repository;
    private final StockReservationMapper mapper;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository locationRepository;
    private final ProductBatchRepository batchRepository;
    private final ProductSerialRepository serialRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final com.erp.inventory.modules.stock.service.InventoryStockService inventoryStockService;
    private final com.erp.inventory.modules.stock.repository.StockMovementRepository stockMovementRepository;
    private final com.erp.inventory.modules.stock.repository.StockMovementLineRepository stockMovementLineRepository;
    private final com.erp.inventory.modules.valuation.service.InventoryCostLayerService inventoryCostLayerService;
    private final com.erp.inventory.modules.period.service.InventoryPeriodService inventoryPeriodService;

    @Override
    public StockReservationResponse create(StockReservationRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        inventoryPeriodService.validateTransactionDate(java.time.LocalDate.now(), company);
        
        if (request.getReservedQuantity() == null || request.getReservedQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Reserved quantity must be greater than zero");
        }

        // 1. Validate Product
        Product product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found or belongs to another company"));
        
        if (product.getStatus() == com.erp.inventory.modules.product.enums.ProductStatus.INACTIVE || Boolean.TRUE.equals(product.getIsDeleted())) {
            throw new BusinessValidationException("Cannot reserve stock for inactive or deleted product");
        }

        // 2. Validate Warehouse
        Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found or belongs to another company"));
                
        if ("INACTIVE".equalsIgnoreCase(warehouse.getStatus()) || Boolean.TRUE.equals(warehouse.getIsDeleted())) {
            throw new BusinessValidationException("Cannot reserve stock in inactive or deleted warehouse");
        }

        // 3. Validate Location
        if (request.getLocationId() != null) {
            WarehouseLocation location = locationRepository.findByIdAndCompanyId(request.getLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found or belongs to another company"));
            if (!location.getWarehouseId().equals(warehouse.getId())) {
                throw new BusinessValidationException("Location does not belong to the specified warehouse");
            }
            if (Boolean.FALSE.equals(location.getIsActive()) || Boolean.TRUE.equals(location.getIsDeleted())) {
                throw new BusinessValidationException("Cannot reserve stock in inactive or deleted location");
            }
        }

        // 4. Validate Batch
        if (product.getTrackingType() == TrackingType.BATCH || product.getTrackingType() == TrackingType.BATCH_AND_SERIAL) {
            if (request.getBatchId() == null) {
                throw new BusinessValidationException("Batch ID is required for batch-tracked products");
            }
            ProductBatch batch = batchRepository.findByIdAndCompanyId(request.getBatchId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found or belongs to another company"));
            
            if (!batch.getProductId().equals(product.getId())) {
                throw new BusinessValidationException("Batch does not belong to the specified product");
            }
            if (!"ACTIVE".equalsIgnoreCase(batch.getStatus())) {
                throw new BusinessValidationException("Cannot reserve stock for an inactive batch");
            }
            if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BusinessValidationException("Cannot reserve stock for an expired batch");
            }
        } else {
            if (request.getBatchId() != null) {
                throw new BusinessValidationException("Batch ID should not be provided for non-batch tracked products");
            }
        }

        // 5. Prevent Duplicates
        boolean duplicateExists = repository.existsByCompanyIdAndReferenceTypeAndReferenceIdAndReferenceLineIdAndStatusIn(
                company, 
                request.getReferenceType(), 
                request.getReferenceId(), 
                request.getReferenceLineId(),
                Arrays.asList(ReservationStatus.RESERVED.name(), ReservationStatus.PARTIALLY_CONSUMED.name())
        );

        if (duplicateExists) {
            throw new BusinessValidationException("An active reservation already exists for this reference line");
        }

        inventoryStockService.reserveStock(product.getId(), warehouse.getId(), request.getLocationId(), request.getBatchId(), request.getReservedQuantity(), company);

        // 9. Create Reservation
        StockReservation reservation = mapper.toEntity(request);
        reservation.setCompanyId(company);
        reservation.setReleasedQuantity(BigDecimal.ZERO);
        reservation.setStatus(ReservationStatus.RESERVED.name());
        
        StockReservation saved = repository.save(reservation);
        return mapper.toResponse(saved);
    }

    @Override
    public StockReservationResponse releaseReservation(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockReservation reservation = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (!ReservationStatus.RESERVED.name().equals(reservation.getStatus()) &&
            !ReservationStatus.PARTIALLY_CONSUMED.name().equals(reservation.getStatus())) {
            throw new BusinessValidationException("Only RESERVED or PARTIALLY_CONSUMED reservations can be released");
        }

        BigDecimal activeReservedQuantity = reservation.getReservedQuantity()
                .subtract(reservation.getReleasedQuantity() != null ? reservation.getReleasedQuantity() : BigDecimal.ZERO);

        if (activeReservedQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("No remaining reserved quantity to release");
        }

        inventoryStockService.releaseReservedStock(reservation.getProductId(), reservation.getWarehouseId(), reservation.getLocationId(), reservation.getBatchId(), activeReservedQuantity, company);

        // Release on Reservation
        reservation.setReleasedQuantity(reservation.getReservedQuantity());
        reservation.setStatus(ReservationStatus.RELEASED.name());
        
        return mapper.toResponse(repository.save(reservation));
    }

    @Override
    public StockReservationResponse consumeReservation(UUID id, BigDecimal consumeQuantity, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        inventoryPeriodService.validateTransactionDate(java.time.LocalDate.now(), company);
        
        if (consumeQuantity == null || consumeQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Consume quantity must be greater than zero");
        }

        StockReservation reservation = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));

        if (!ReservationStatus.RESERVED.name().equals(reservation.getStatus()) &&
            !ReservationStatus.PARTIALLY_CONSUMED.name().equals(reservation.getStatus())) {
            throw new BusinessValidationException("Only RESERVED or PARTIALLY_CONSUMED reservations can be consumed");
        }

        BigDecimal activeReservedQuantity = reservation.getReservedQuantity()
                .subtract(reservation.getReleasedQuantity() != null ? reservation.getReleasedQuantity() : BigDecimal.ZERO);

        if (consumeQuantity.compareTo(activeReservedQuantity) > 0) {
            throw new BusinessValidationException("Cannot consume more than the currently reserved quantity");
        }

        // Fetch stock for movement calculations before consumption
        InventoryStock stock = inventoryStockRepository.findUniqueStock(
                reservation.getProductId(),
                reservation.getWarehouseId(),
                reservation.getLocationId(),
                reservation.getBatchId(),
                company
        ).orElseThrow(() -> new ResourceNotFoundException("Inventory stock not found for the given criteria"));
        
        BigDecimal oldQuantity = stock.getQuantity();

        // Consume on Inventory Stock
        inventoryStockService.consumeReservedStock(reservation.getProductId(), reservation.getWarehouseId(), reservation.getLocationId(), reservation.getBatchId(), consumeQuantity, company);

        // Create Movement for Consumption
        com.erp.inventory.modules.stock.entity.StockMovement movement = new com.erp.inventory.modules.stock.entity.StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(LocalDateTime.now());
        movement.setMovementType("RESERVATION_CONSUMPTION");
        movement.setStatus("COMPLETED");
        movement.setReferenceType(com.erp.inventory.modules.product.enums.ReferenceType.STOCK_RESERVATION);
        movement.setReferenceId(reservation.getId());
        movement.setReferenceNumber(reservation.getReferenceType() + "-" + reservation.getReferenceId());
        movement.setTotalQuantity(consumeQuantity);
        BigDecimal consumptionTotalCost = consumeQuantity.multiply(stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO).setScale(4, java.math.RoundingMode.HALF_UP);
        movement.setTotalValue(consumptionTotalCost);
        stockMovementRepository.save(movement);

        com.erp.inventory.modules.stock.entity.StockMovementLine line = new com.erp.inventory.modules.stock.entity.StockMovementLine();
        line.setCompanyId(company);
        line.setStockMovementId(movement.getId());
        line.setProductId(reservation.getProductId());
        line.setSourceWarehouseId(reservation.getWarehouseId());
        line.setSourceLocationId(reservation.getLocationId());
        line.setBatchId(reservation.getBatchId());
        line.setQuantity(consumeQuantity);
        line.setQuantityBefore(oldQuantity);
        line.setQuantityAfter(oldQuantity.subtract(consumeQuantity));
        line.setUnitCost(stock.getAverageCost());
        line.setTotalCost(consumptionTotalCost);
        stockMovementLineRepository.save(line);

        inventoryCostLayerService.processOutboundCost(line, company);

        // Consume on Reservation
        BigDecimal newReleasedQuantity = (reservation.getReleasedQuantity() != null ? reservation.getReleasedQuantity() : BigDecimal.ZERO).add(consumeQuantity);
        reservation.setReleasedQuantity(newReleasedQuantity);

        if (newReleasedQuantity.compareTo(reservation.getReservedQuantity()) >= 0) {
            reservation.setStatus(ReservationStatus.CONSUMED.name());
        } else {
            reservation.setStatus(ReservationStatus.PARTIALLY_CONSUMED.name());
        }

        return mapper.toResponse(repository.save(reservation));
    }

    @Override
    public StockReservationResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockReservation reservation = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("StockReservation not found"));
        return mapper.toResponse(reservation);
    }

    @Override
    public Page<StockReservationResponse> getAll(StockReservationFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        Page<StockReservation> page = repository.findAllByCompanyId(company, pageable);
        return page.map(mapper::toResponse);
    }
}
