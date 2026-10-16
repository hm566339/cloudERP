package com.erp.inventory.modules.adjustment.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.security.CurrentUserContext;
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
import com.erp.inventory.modules.workflow.client.WorkflowClient;
import com.erp.inventory.modules.workflow.dto.WorkflowTransactionDto;
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
    private final WorkflowClient workflowClient;

    @Override
    public StockAdjustmentResponse create(StockAdjustmentRequest request, UUID companyId) {

        UUID company = TenantUtils.resolveCompanyId(companyId);

        if (request.getLines() == null || request.getLines().isEmpty()) {
            throw new BusinessValidationException("Stock adjustment must contain at least one line.");
        }

        inventoryPeriodService.validateTransactionDate(
                request.getAdjustmentDate() != null ? request.getAdjustmentDate().toLocalDate() : java.time.LocalDate.now(),
                company);

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

        LocalDateTime movementDate = request.getAdjustmentDate() != null ? request.getAdjustmentDate() : LocalDateTime.now();

        boolean isDraft = request.getStatus() != null &&
                ("DRAFT".equalsIgnoreCase(request.getStatus()) || "PENDING_APPROVAL".equalsIgnoreCase(request.getStatus()));

        // Create adjustment header
        StockAdjustment adjustment = mapper.toEntity(request);
        adjustment.setCompanyId(company);
        adjustment.setStatus(isDraft ? request.getStatus().toUpperCase() : "APPROVED");
        adjustment.setApprovedAt(isDraft ? null : movementDate);
        if (isDraft) {
            adjustment.setStockMovementId(null);
        }

        StockAdjustment savedAdjustment = repository.save(adjustment);

        List<StockAdjustmentLine> savedLines = new ArrayList<>();

        for (StockAdjustmentLineRequest lineReq : request.getLines()) {
            if (lineReq.getQuantity() == null || lineReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Adjustment quantity must be greater than zero");
            }

            if (!"INCREASE".equalsIgnoreCase(lineReq.getAdjustmentType()) && !"DECREASE".equalsIgnoreCase(lineReq.getAdjustmentType())) {
                throw new BusinessValidationException("Invalid adjustment type: " + lineReq.getAdjustmentType());
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
                    throw new BusinessValidationException("Serialized products must be adjusted one quantity at a time");
                }
            }

            InventoryStock stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), location.getId(), lineReq.getBatchId(), company).orElse(null);

            BigDecimal oldAvgCost = stock != null && stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;
            BigDecimal adjustmentQty = lineReq.getQuantity();
            BigDecimal adjUnitCost = lineReq.getUnitCost() != null ? lineReq.getUnitCost() : BigDecimal.ZERO;
            BigDecimal adjTotalCost;

            if ("INCREASE".equalsIgnoreCase(lineReq.getAdjustmentType())) {
                if (stock == null && lineReq.getUnitCost() == null) {
                    throw new BusinessValidationException("Unit cost must be provided when creating new stock via adjustment");
                }
                adjTotalCost = adjustmentQty.multiply(adjUnitCost).setScale(4, RoundingMode.HALF_UP);
            } else {
                if (stock == null && !isDraft) {
                    throw new BusinessValidationException("Cannot decrease stock: Inventory stock does not exist");
                }
                adjTotalCost = adjustmentQty.multiply(oldAvgCost).setScale(4, RoundingMode.HALF_UP);
            }

            StockAdjustmentLine savedLine = new StockAdjustmentLine();
            savedLine.setCompanyId(company);
            savedLine.setStockAdjustmentId(savedAdjustment.getId());
            savedLine.setProductId(product.getId());
            savedLine.setBatchId(lineReq.getBatchId());
            savedLine.setSerialId(lineReq.getSerialId());
            savedLine.setAdjustmentType(lineReq.getAdjustmentType().toUpperCase());
            savedLine.setQuantity(adjustmentQty);
            savedLine.setUnitCost(adjUnitCost);
            savedLine.setAdjustmentValue(adjTotalCost);
            savedLines.add(lineRepository.save(savedLine));
        }

        if (!isDraft) {
            executeAdjustmentMovement(savedAdjustment, savedLines, warehouse, location, company, movementDate);
        }

        return mapper.toResponse(savedAdjustment);
    }

    private void executeAdjustmentMovement(StockAdjustment adjustment, List<StockAdjustmentLine> lines,
                                           Warehouse warehouse, WarehouseLocation location, UUID company,
                                           LocalDateTime movementDate) {
        if (adjustment.getStockMovementId() != null) {
            log.info("Stock movement already processed for adjustment: {}", adjustment.getAdjustmentNo());
            return;
        }

        List<StockAdjustmentLine> increaseLines = new ArrayList<>();
        List<StockAdjustmentLine> decreaseLines = new ArrayList<>();

        for (StockAdjustmentLine line : lines) {
            if ("INCREASE".equalsIgnoreCase(line.getAdjustmentType())) {
                increaseLines.add(line);
            } else if ("DECREASE".equalsIgnoreCase(line.getAdjustmentType())) {
                decreaseLines.add(line);
            }
        }

        if (!increaseLines.isEmpty()) {
            processSavedLines(increaseLines, adjustment, warehouse, location, company, movementDate, "ADJUSTMENT_IN");
        }
        if (!decreaseLines.isEmpty()) {
            processSavedLines(decreaseLines, adjustment, warehouse, location, company, movementDate, "ADJUSTMENT_OUT");
        }
    }

    private void processSavedLines(List<StockAdjustmentLine> lines, StockAdjustment adjustment,
                                   Warehouse warehouse, WarehouseLocation location, UUID company,
                                   LocalDateTime movementDate, String movementType) {

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

        for (StockAdjustmentLine line : lines) {
            Product product = productRepository.findByIdAndCompanyId(line.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            InventoryStock stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), location.getId(), line.getBatchId(), company).orElse(null);

            BigDecimal oldQty = stock != null && stock.getQuantity() != null ? stock.getQuantity() : BigDecimal.ZERO;
            BigDecimal oldAvgCost = stock != null && stock.getAverageCost() != null ? stock.getAverageCost() : BigDecimal.ZERO;

            BigDecimal adjustmentQty = line.getQuantity();
            BigDecimal adjUnitCost = line.getUnitCost() != null ? line.getUnitCost() : BigDecimal.ZERO;
            BigDecimal adjTotalCost = line.getAdjustmentValue() != null ? line.getAdjustmentValue() : BigDecimal.ZERO;

            if ("ADJUSTMENT_IN".equals(movementType)) {
                inventoryStockService.addStock(product.getId(), warehouse.getId(), location.getId(),
                        line.getBatchId(), adjustmentQty, adjUnitCost, company);
            } else {
                if (stock == null) {
                    throw new BusinessValidationException("Cannot decrease stock: Inventory stock does not exist");
                }
                inventoryStockService.removeStock(product.getId(), warehouse.getId(), location.getId(),
                        line.getBatchId(), adjustmentQty, company);
            }

            // Fetch updated stock for movement tracking
            stock = inventoryStockRepository.findUniqueStock(
                    product.getId(), warehouse.getId(), location.getId(), line.getBatchId(), company)
                    .orElseThrow();
            BigDecimal newQty = stock.getQuantity();

            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setBatchId(line.getBatchId());
            movementLine.setSerialId(line.getSerialId());
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
            movementLine.setReferenceLineId(line.getId());

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

        if (adjustment.getStockMovementId() == null) {
            adjustment.setStockMovementId(savedMovement.getId());
            repository.save(adjustment);
        }
    }

    @Override
    @Transactional
    public void processStockAdjustmentMovement(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));

        if (adjustment.getStockMovementId() != null) {
            log.info("Stock adjustment {} movement already processed", adjustment.getAdjustmentNo());
            return;
        }

        Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(adjustment.getWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        WarehouseLocation location = locationRepository.findByIdAndCompanyId(adjustment.getLocationId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found"));

        List<StockAdjustmentLine> lines = lineRepository.findAllByStockAdjustmentIdAndCompanyId(id, company);
        executeAdjustmentMovement(adjustment, lines, warehouse, location, company, LocalDateTime.now());

        adjustment.setStatus("APPROVED");
        adjustment.setApprovedAt(LocalDateTime.now());
        adjustment.setApprovedBy(CurrentUserContext.getUserId());
        repository.save(adjustment);
    }

    @Override
    @Transactional
    public StockAdjustmentResponse submitForApproval(UUID id, UUID companyId, String comments) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));

        if (!"DRAFT".equalsIgnoreCase(adjustment.getStatus()) && !"RETURNED".equalsIgnoreCase(adjustment.getStatus()) && !"REJECTED".equalsIgnoreCase(adjustment.getStatus())) {
            throw new BusinessValidationException("Only DRAFT stock adjustments can be submitted for approval. Current status: " + adjustment.getStatus());
        }

        // Duplicate workflow submission check
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(company, "STOCK_ADJUSTMENT", id);
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BusinessValidationException("Stock adjustment is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for stock adjustment {}", id);
        }

        try {
            workflowClient.submitWorkflow(
                    company,
                    "STOCK_ADJUSTMENT",
                    adjustment.getId(),
                    adjustment.getAdjustmentNo(),
                    comments != null ? comments : "Submitted stock adjustment for approval"
            );
            adjustment.setStatus("PENDING_APPROVAL");
            repository.save(adjustment);
            log.info("Stock adjustment {} submitted for approval to workflow-service", adjustment.getAdjustmentNo());
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Workflow engine submission failed for stock adjustment {}. Error: {}", id, e.getMessage());
            throw new BusinessValidationException("Failed to submit stock adjustment for workflow approval: " + e.getMessage());
        }

        return mapper.toResponse(adjustment);
    }

    @Override
    @Transactional
    public StockAdjustmentResponse approveAdjustment(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));

        // Bypass check: Block direct approval if an active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_ADJUSTMENT", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock adjustment cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock adjustment {}: {}", id, e.getMessage());
        }

        processStockAdjustmentMovement(id, company);
        adjustment.setStatus("APPROVED");
        adjustment.setApprovedAt(LocalDateTime.now());
        adjustment.setApprovedBy(CurrentUserContext.getUserId());
        StockAdjustment saved = repository.save(adjustment);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockAdjustmentResponse rejectAdjustment(UUID id, UUID companyId, String reason) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));

        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_ADJUSTMENT", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock adjustment cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock adjustment rejection {}: {}", id, e.getMessage());
        }

        adjustment.setStatus("REJECTED");
        if (reason != null && !reason.trim().isEmpty()) {
            adjustment.setRemarks((adjustment.getRemarks() != null ? adjustment.getRemarks() + " | " : "") + "Rejected: " + reason);
        }
        StockAdjustment saved = repository.save(adjustment);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockAdjustmentResponse cancelAdjustment(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockAdjustment adjustment = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Adjustment not found"));

        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_ADJUSTMENT", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock adjustment cannot be cancelled directly while workflow approval is pending. Please cancel via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock adjustment cancellation {}: {}", id, e.getMessage());
        }

        if (adjustment.getStockMovementId() != null) {
            throw new BusinessValidationException("Approved adjustments with stock movements cannot be cancelled.");
        }

        adjustment.setStatus("CANCELLED");
        StockAdjustment saved = repository.save(adjustment);
        return mapper.toResponse(saved);
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
