package com.erp.inventory.modules.openingstock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ConflictException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockFilterRequest;
import com.erp.inventory.modules.openingstock.dto.response.OpeningStockResponse;
import com.erp.inventory.modules.openingstock.entity.OpeningStockLine;
import com.erp.inventory.modules.openingstock.service.OpeningStockService;
import com.erp.inventory.modules.openingstock.mapper.OpeningStockMapper;
import com.erp.inventory.modules.openingstock.repository.OpeningStockRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.math.BigDecimal;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class OpeningStockServiceImpl implements OpeningStockService {

    private final OpeningStockRepository repository;
    private final OpeningStockMapper mapper;
    private final WarehouseRepository warehouseRepository;
    private final StockMovementRepository stockMovementRepository;
    private final OpeningStockLineRepository openingStockLineRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryStockService inventoryStockService;
    private final InventoryCostLayerService inventoryCostLayerService;
    private final ProductRepository productRepository;
    private final WarehouseLocationRepository warehouseLocationRepository;
    private final com.erp.inventory.modules.period.service.InventoryPeriodService inventoryPeriodService;

    @Override
    public OpeningStockResponse create(OpeningStockRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating OpeningStock creation for company: {}", company);

        validateRequest(request);
        inventoryPeriodService.validateTransactionDate(request.getOpeningDate() != null ? request.getOpeningDate() : java.time.LocalDate.now(), company);

        warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company)
                .orElseThrow(() -> new BusinessValidationException(
                        "Warehouse not found with id: " + request.getWarehouseId()));

        if (repository.existsByOpeningStockNoAndCompanyId(request.getOpeningStockNo(), company)) {
            throw new ConflictException("Duplicate openingStockNo: " + request.getOpeningStockNo());
        }

        // 1. Create StockMovement
        StockMovement movement = StockMovement.builder()
                .movementNo("MOV-" + System.currentTimeMillis())
                .movementDate(request.getOpeningDate() != null ? request.getOpeningDate().atStartOfDay()
                        : java.time.LocalDateTime.now())
                .movementType("OPENING")
                .status("APPROVED")
                .referenceType(ReferenceType.OPENING_STOCK)
                .remarks(request.getRemarks())
                .build();
        movement.setCompanyId(company);
        movement = stockMovementRepository.saveAndFlush(movement);

        // 2. Save OpeningStock
        var entity = mapper.toEntity(request);
        entity.setCompanyId(company);
        entity.setStockMovementId(movement.getId());
        if (entity.getStatus() == null) {
            entity.setStatus("APPROVED");
        }
        entity = repository.save(entity);

        // 3. Process Lines
        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalVal = BigDecimal.ZERO;

        if (request.getLines() != null) {
            for (var lineReq : request.getLines()) {
                var product = productRepository.findByIdAndCompanyId(lineReq.getProductId(), company)
                        .orElseThrow(
                                () -> new BusinessValidationException("Product not found: " + lineReq.getProductId()));

                if (product.getStatus() != com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE) {
                    throw new BusinessValidationException("Product is not active: " + lineReq.getProductId());
                }

                var location = warehouseLocationRepository
                        .findByIdAndCompanyId(lineReq.getWarehouseLocationId(), company)
                        .orElseThrow(() -> new BusinessValidationException(
                                "Location not found: " + lineReq.getWarehouseLocationId()));

                if (location.getWarehouseId() == null) {
                    throw new BusinessValidationException("Warehouse location is not associated with a warehouse");
                }
                
                if (!location.getWarehouseId().equals(request.getWarehouseId())) {
                    throw new BusinessValidationException("Warehouse location does not belong to the selected warehouse");
                }

                if (TrackingType.BATCH.equals(product.getTrackingType()) && lineReq.getBatchId() == null) {
                    throw new BusinessValidationException("Batch is required for product: " + product.getId());
                }

                if (lineReq.getBatchId() != null) {
                    var batch = productBatchRepository.findByIdAndCompanyId(lineReq.getBatchId(), company)
                            .orElseThrow(() -> new BusinessValidationException("Batch not found with id: " + lineReq.getBatchId()));
                    if (!batch.getProductId().equals(product.getId())) {
                        throw new BusinessValidationException("Batch does not belong to product: " + product.getId());
                    }
                }
                if (TrackingType.SERIAL.equals(product.getTrackingType()) && lineReq.getSerialId() == null) {
                    throw new BusinessValidationException("Serial is required for product: " + product.getId());
                }
                if (lineReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessValidationException("Quantity must be greater than zero");
                }
                if (lineReq.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
                    throw new BusinessValidationException("Unit cost must not be negative");
                }

                // Save OpeningStockLine
                OpeningStockLine osLine = OpeningStockLine.builder()
                        .openingStockId(entity.getId())
                        .productId(lineReq.getProductId())
                        .warehouseLocationId(lineReq.getWarehouseLocationId())
                        .batchId(lineReq.getBatchId())
                        .serialId(lineReq.getSerialId())
                        .quantity(lineReq.getQuantity())
                        .unitCost(lineReq.getUnitCost())
                        .totalValue(lineReq.getQuantity().multiply(lineReq.getUnitCost()))
                        .uomId(lineReq.getUomId())
                        .build();
                osLine.setCompanyId(company);
                openingStockLineRepository.save(osLine);

                // Save StockMovementLine
                StockMovementLine smLine = StockMovementLine.builder()
                        .stockMovementId(movement.getId())
                        .productId(lineReq.getProductId())
                        .destinationWarehouseId(request.getWarehouseId())
                        .destinationLocationId(lineReq.getWarehouseLocationId())
                        .batchId(lineReq.getBatchId())
                        .serialId(lineReq.getSerialId())
                        .quantity(lineReq.getQuantity())
                        .unitCost(lineReq.getUnitCost())
                        .totalCost(lineReq.getQuantity().multiply(lineReq.getUnitCost()))
                        .uomId(lineReq.getUomId())
                        .build();
                smLine.setCompanyId(company);
                stockMovementLineRepository.saveAndFlush(smLine);

                // Update InventoryStock
                inventoryStockService.addStock(lineReq.getProductId(), request.getWarehouseId(),
                        lineReq.getWarehouseLocationId(), lineReq.getBatchId(), lineReq.getQuantity(),
                        lineReq.getUnitCost(), company);

                // Create Cost Layer
                inventoryCostLayerService.processInboundCost(smLine, company);

                totalQty = totalQty.add(lineReq.getQuantity());
                totalVal = totalVal.add(smLine.getTotalCost());
            }
        }

        movement.setTotalQuantity(totalQty);
        movement.setTotalValue(totalVal);
        stockMovementRepository.save(movement);

        OpeningStockResponse response = mapper.toResponse(entity);
        response.setStockMovementId(movement.getId());
        return response;
    }

    @Override
    public OpeningStockResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Opening Stock not found with id: " + id));
        return mapper.toResponse(entity);
    }

    @Override
    public Page<OpeningStockResponse> getAll(OpeningStockFilterRequest filter, Pageable pageable, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        // Implement filtering later
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    private void validateRequest(OpeningStockRequest request) {
        if (request.getOpeningDate() != null && request.getApprovedAt() != null) {
            if (request.getApprovedAt().toLocalDate().isBefore(request.getOpeningDate())) {
                throw new BusinessValidationException("Approved at date cannot be before opening date");
            }
        }
    }
}
