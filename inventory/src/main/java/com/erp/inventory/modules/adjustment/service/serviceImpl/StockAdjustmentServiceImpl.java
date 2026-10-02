package com.erp.inventory.modules.adjustment.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentLineRequest;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentRequest;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentFilterRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentResponse;
import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import com.erp.inventory.modules.adjustment.entity.StockAdjustmentLine;
import com.erp.inventory.modules.adjustment.mapper.StockAdjustmentMapper;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentLineRepository;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentRepository;
import com.erp.inventory.modules.adjustment.service.StockAdjustmentService;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.serial.entity.ProductSerial;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StockAdjustmentServiceImpl implements StockAdjustmentService {

    private final StockAdjustmentRepository repository;
    private final StockAdjustmentLineRepository lineRepository;
    private final StockAdjustmentMapper mapper;

    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository batchRepository;
    private final ProductSerialRepository serialRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final com.erp.inventory.modules.stock.service.InventoryStockService inventoryStockService;
    private final StockMovementRepository stockMovementRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final com.erp.inventory.modules.valuation.service.InventoryCostLayerService inventoryCostLayerService;
    private final com.erp.inventory.modules.period.service.InventoryPeriodService inventoryPeriodService;

    @Override
    public StockAdjustmentResponse create(StockAdjustmentRequest request, UUID companyId) {

        UUID company = TenantUtils.resolveCompanyId(companyId);

        if (request.getLines() == null || request.getLines().isEmpty()) {
            throw new BusinessValidationException("Stock adjustment must contain at least one line.");
        }

        inventoryPeriodService
                .validateTransactionDate(request.getAdjustmentDate() != null ? request.getAdjustmentDate().toLocalDate()
                        : java.time.LocalDate.now(), companyId);

        if (request.getAdjustmentNo() != null && !request.getAdjustmentNo().trim().isEmpty()) {
            if (repository.existsByCompanyIdAndAdjustmentNo(company, request.getAdjustmentNo())) {
                throw new BusinessValidationException(
                        "Duplicate adjustment request: A stock adjustment with this number already exists.");
            }
        }

        Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        if ("INACTIVE".equalsIgnoreCase(warehouse.getStatus()) || Boolean.TRUE.equals(warehouse.getIsDeleted())) {
            throw new BusinessValidationException("Warehouse is inactive or deleted");
        }

        WarehouseLocation location = locationRepository.findByIdAndCompanyId(request.getLocationId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));
        if (!location.getWarehouseId().equals(warehouse.getId()) || Boolean.FALSE.equals(location.getIsActive())) {
            throw new BusinessValidationException("Location is invalid or inactive");
        }

        LocalDateTime movementDate = request.getAdjustmentDate() != null ? request.getAdjustmentDate()
                : LocalDateTime.now();

        // Create adjustment header
        StockAdjustment adjustment = mapper.toEntity(request);
        adjustment.setCompanyId(company);
        adjustment.setStatus("APPROVED");
        adjustment.setApprovedAt(movementDate);

        StockAdjustment savedAdjustment = repository.save(adjustment);

        // We will create one StockMovement per adjustment if they are same type, but
        // since a document can have both INCREASE and DECREASE,
        // to be strictly correct with StockMovementType (ADJUSTMENT_IN vs
        // ADJUSTMENT_OUT), we should create two movements if mixed,
        // or just group them. We will check if there are any increases and any
        // decreases.
        List<StockAdjustmentLineRequest> increaseLines = new ArrayList<>();
        List<StockAdjustmentLineRequest> decreaseLines = new ArrayList<>();

        for (StockAdjustmentLineRequest line : request.getLines()) {
            if ("INCREASE".equalsIgnoreCase(line.getAdjustmentType())) {
                increaseLines.add(line);
            } else if ("DECREASE".equalsIgnoreCase(line.getAdjustmentType())) {
                decreaseLines.add(line);
            } else {
                throw new BusinessValidationException("Invalid adjustment type: " + line.getAdjustmentType());
            }
        }

        if (!increaseLines.isEmpty()) {
            processLines(increaseLines, savedAdjustment, warehouse, location, company, movementDate, "ADJUSTMENT_IN");
        }
        if (!decreaseLines.isEmpty()) {
            processLines(decreaseLines, savedAdjustment, warehouse, location, company, movementDate,
                    "ADJUSTMENT_OUT");
        }

        return mapper.toResponse(savedAdjustment);
    }

    private void processLines(List<StockAdjustmentLineRequest> lineRequests, StockAdjustment adjustment,
            Warehouse warehouse, WarehouseLocation location, UUID company, LocalDateTime movementDate,
            String movementType) {

        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(movementDate);
        movement.setMovementType(movementType);
        movement.setStatus("COMPLETED");
        movement.setReferenceType(com.erp.inventory.modules.product.enums.ReferenceType.STOCK_ADJUSTMENT);
        movement.setReferenceId(adjustment.getId());
        movement.setReferenceNumber(adjustment.getAdjustmentNo());

        BigDecimal totalQty = BigDecimal.ZERO;
        BigDecimal totalVal = BigDecimal.ZERO;

        StockMovement savedMovement = stockMovementRepository.save(movement);

        for (StockAdjustmentLineRequest lineReq : lineRequests) {
            if (lineReq.getQuantity() == null || lineReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Adjustment quantity must be greater than zero");
            }

            Product product = productRepository.findByIdAndCompanyId(lineReq.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            if (lineReq.getBatchId() != null) {
                ProductBatch batch = batchRepository.findByIdAndCompanyId(lineReq.getBatchId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
                if (!batch.getProductId().equals(product.getId())) {
                    throw new BusinessValidationException("Batch is invalid");
                }
            }
            if (lineReq.getSerialId() != null) {
                ProductSerial serial = serialRepository.findByIdAndCompanyId(lineReq.getSerialId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
                if (!serial.getProductId().equals(product.getId())) {
                    throw new BusinessValidationException("Serial is invalid");
                }
                if (lineReq.getQuantity().compareTo(BigDecimal.ONE) > 0) {
                    throw new BusinessValidationException(
                            "Serialized products must be adjusted one quantity at a time");
                }
            }

            InventoryStock stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), location.getId(), lineReq.getBatchId(), company).orElse(null);

            BigDecimal oldQty = stock != null && stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;
            BigDecimal oldAvgCost = stock != null && stock.getAverageCost() != null ? stock.getAverageCost()
                    : BigDecimal.ZERO;

            BigDecimal adjustmentQty = lineReq.getQuantity();
            BigDecimal adjUnitCost = lineReq.getUnitCost() != null ? lineReq.getUnitCost() : BigDecimal.ZERO;
            BigDecimal adjTotalCost;

            if ("ADJUSTMENT_IN".equals(movementType)) {
                if (stock == null && lineReq.getUnitCost() == null) {
                    throw new BusinessValidationException(
                            "Unit cost must be provided when creating new stock via adjustment");
                }
                inventoryStockService.addStock(product.getId(), warehouse.getId(), location.getId(),
                        lineReq.getBatchId(), adjustmentQty, adjUnitCost, company);
                adjTotalCost = adjustmentQty.multiply(adjUnitCost).setScale(4, RoundingMode.HALF_UP);
            } else {
                if (stock == null) {
                    throw new BusinessValidationException("Cannot decrease stock: Inventory stock does not exist");
                }
                adjTotalCost = adjustmentQty.multiply(oldAvgCost).setScale(4, RoundingMode.HALF_UP);
                inventoryStockService.removeStock(product.getId(), warehouse.getId(), location.getId(),
                        lineReq.getBatchId(), adjustmentQty, company);
            }

            // Fetch updated stock for movement tracking
            stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), location.getId(), lineReq.getBatchId(), company)
                    .orElseThrow();
            BigDecimal newQty = stock.getQuantity();

            StockAdjustmentLine savedLine = new StockAdjustmentLine();
            savedLine.setCompanyId(company);
            savedLine.setStockAdjustmentId(adjustment.getId());
            savedLine.setProductId(product.getId());
            savedLine.setBatchId(lineReq.getBatchId());
            savedLine.setSerialId(lineReq.getSerialId());
            savedLine.setAdjustmentType(lineReq.getAdjustmentType());
            savedLine.setQuantity(adjustmentQty);
            savedLine.setUnitCost(adjUnitCost);
            savedLine.setAdjustmentValue(adjTotalCost);
            savedLine = lineRepository.save(savedLine);

            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setBatchId(lineReq.getBatchId());
            movementLine.setSerialId(lineReq.getSerialId());
            movementLine.setUomId(product.getBaseUomId());
            movementLine.setQuantity(adjustmentQty);
            movementLine.setQuantityBefore(oldQty);
            movementLine.setQuantityAfter(newQty);
            if ("ADJUSTMENT_IN".equals(movementType)) {
                movementLine.setUnitCost(adjUnitCost);
            } else {
                movementLine.setUnitCost(oldAvgCost);
            }
            movementLine.setTotalCost(adjTotalCost);
            movementLine.setReferenceLineId(savedLine.getId());

            if ("ADJUSTMENT_IN".equals(movementType)) {
                movementLine.setDestinationWarehouseId(warehouse.getId());
                movementLine.setDestinationLocationId(location.getId());
            } else {
                movementLine.setSourceWarehouseId(warehouse.getId());
                movementLine.setSourceLocationId(location.getId());
            }

            stockMovementLineRepository.save(movementLine);

            if ("ADJUSTMENT_IN".equals(movementType)) {
                inventoryCostLayerService.processInboundCost(movementLine, company);
            } else {
                inventoryCostLayerService.processOutboundCost(movementLine, company);
            }

            totalQty = totalQty.add(adjustmentQty);
            totalVal = totalVal.add(adjTotalCost);
        }

        savedMovement.setTotalQuantity(totalQty);
        savedMovement.setTotalValue(totalVal);
        stockMovementRepository.save(savedMovement);

        // Update adjustment stock movement reference
        if (adjustment.getStockMovementId() == null) {
            adjustment.setStockMovementId(savedMovement.getId());
            repository.save(adjustment);
        }
    }

    @Override
    public StockAdjustmentResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));
        return mapper.toResponse(adjustment);
    }

    @Override
    public Page<StockAdjustmentResponse> getAll(StockAdjustmentFilterRequest filter, Pageable pageable,
            UUID companyId) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        var spec = com.erp.inventory.modules.adjustment.repository.StockAdjustmentSpecification.getFilterSpecification(filter, company);
        return repository.findAll(spec, pageable).map(mapper::toResponse);
    }

}
