package com.erp.inventory.modules.transfer.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
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
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.enums.StockMovementType;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.transfer.entity.StockTransfer;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferResponse;
import com.erp.inventory.modules.transfer.service.StockTransferService;
import com.erp.inventory.modules.transfer.mapper.StockTransferMapper;
import com.erp.inventory.modules.transfer.mapper.StockTransferLineMapper;
import com.erp.inventory.modules.transfer.repository.StockTransferRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

import com.erp.inventory.modules.workflow.client.WorkflowClient;
import com.erp.inventory.modules.workflow.dto.WorkflowTransactionDto;
import com.erp.inventory.common.security.CurrentUserContext;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StockTransferServiceImpl implements StockTransferService {

    private final StockTransferRepository repository;
    private final StockTransferLineRepository lineRepository;
    private final StockTransferMapper mapper;
    private final StockTransferLineMapper lineMapper;
    
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository locationRepository;
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
    @Transactional
    public StockTransferResponse create(StockTransferRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getLines() == null || request.getLines().isEmpty()) {
            throw new BusinessValidationException("Stock transfer must contain at least one line.");
        }

        inventoryPeriodService.validateTransactionDate(request.getTransferDate() != null ? request.getTransferDate().toLocalDate() : java.time.LocalDate.now(), company);

        // Idempotency/Duplicate Check
        if (request.getTransferNo() != null && !request.getTransferNo().trim().isEmpty()) {
            if (repository.existsByCompanyIdAndTransferNo(company, request.getTransferNo())) {
                throw new BusinessValidationException("Duplicate transfer request: A transfer with this transfer number already exists.");
            }
        }

        // Validate source warehouse
        Warehouse sourceWarehouse = warehouseRepository.findByIdAndCompanyId(request.getSourceWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        if ("INACTIVE".equalsIgnoreCase(sourceWarehouse.getStatus()) || Boolean.TRUE.equals(sourceWarehouse.getIsDeleted())) {
            throw new BusinessValidationException("Source warehouse is inactive or deleted");
        }

        // Validate destination warehouse
        Warehouse destWarehouse = warehouseRepository.findByIdAndCompanyId(request.getDestinationWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));
        if ("INACTIVE".equalsIgnoreCase(destWarehouse.getStatus()) || Boolean.TRUE.equals(destWarehouse.getIsDeleted())) {
            throw new BusinessValidationException("Destination warehouse is inactive or deleted");
        }

        boolean isDraft = request.getStatus() != null &&
                ("DRAFT".equalsIgnoreCase(request.getStatus()) || "PENDING_APPROVAL".equalsIgnoreCase(request.getStatus()));

        // Initialize Transfer Header
        StockTransfer transfer = mapper.toEntity(request);
        transfer.setCompanyId(company);
        transfer.setStatus(isDraft ? request.getStatus().toUpperCase() : "COMPLETED");
        if (isDraft) {
            transfer.setStockMovementId(null);
        }
        StockTransfer savedTransfer = repository.save(transfer);

        List<StockTransferLine> savedLines = new ArrayList<>();

        for (StockTransferLineRequest lineReq : request.getLines()) {
            if (lineReq.getQuantity() == null || lineReq.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessValidationException("Transfer quantity must be greater than zero");
            }
            if (lineReq.getSourceLocationId().equals(lineReq.getDestinationLocationId()) && request.getSourceWarehouseId().equals(request.getDestinationWarehouseId())) {
                throw new BusinessValidationException("Cannot transfer to the exact same warehouse and location");
            }

            // Validate source location
            WarehouseLocation sourceLocation = locationRepository.findByIdAndCompanyId(lineReq.getSourceLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Source location not found"));
            if (!sourceLocation.getWarehouseId().equals(sourceWarehouse.getId()) || Boolean.FALSE.equals(sourceLocation.getIsActive())) {
                throw new BusinessValidationException("Source location is invalid or inactive");
            }

            // Validate destination location
            WarehouseLocation destLocation = locationRepository.findByIdAndCompanyId(lineReq.getDestinationLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination location not found"));
            if (!destLocation.getWarehouseId().equals(destWarehouse.getId()) || Boolean.FALSE.equals(destLocation.getIsActive())) {
                throw new BusinessValidationException("Destination location is invalid or inactive");
            }

            // Validate Product
            Product product = productRepository.findByIdAndCompanyId(lineReq.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            if (product.getStatus() == com.erp.inventory.modules.product.enums.ProductStatus.INACTIVE || Boolean.TRUE.equals(product.getIsDeleted())) {
                throw new BusinessValidationException("Product is inactive or deleted");
            }

            // Validate Tracking Types
            if (product.getTrackingType() == TrackingType.NONE) {
                if (lineReq.getBatchId() != null || lineReq.getSerialId() != null) {
                    throw new BusinessValidationException("Batch/Serial should not be provided for NONE tracking");
                }
            } else if (product.getTrackingType() == TrackingType.BATCH) {
                if (lineReq.getBatchId() == null || lineReq.getSerialId() != null) {
                    throw new BusinessValidationException("Batch is required and Serial should be null for BATCH tracking");
                }
                ProductBatch batch = batchRepository.findByIdAndCompanyId(lineReq.getBatchId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Batch not found"));
                if (!batch.getProductId().equals(product.getId()) || !"ACTIVE".equalsIgnoreCase(batch.getStatus())) {
                    throw new BusinessValidationException("Batch is invalid or inactive");
                }
            } else if (product.getTrackingType() == TrackingType.SERIAL || product.getTrackingType() == TrackingType.BATCH_AND_SERIAL) {
                if (lineReq.getSerialId() == null) {
                    throw new BusinessValidationException("Serial is required for SERIAL tracking");
                }
                if (product.getTrackingType() == TrackingType.BATCH_AND_SERIAL && lineReq.getBatchId() == null) {
                    throw new BusinessValidationException("Batch is required for BATCH_AND_SERIAL tracking");
                }
                if (lineReq.getQuantity().compareTo(BigDecimal.ONE) != 0) {
                    throw new BusinessValidationException("Serialized products must be transferred one quantity at a time");
                }
                ProductSerial serial = serialRepository.findByIdAndCompanyId(lineReq.getSerialId(), company)
                        .orElseThrow(() -> new ResourceNotFoundException("Serial not found"));
                if (!serial.getProductId().equals(product.getId()) || !"AVAILABLE".equalsIgnoreCase(serial.getStatus())) {
                    throw new BusinessValidationException("Serial is invalid or not available");
                }
            }

            // Save Transfer Line
            StockTransferLine transferLine = lineMapper.toEntity(lineReq);
            transferLine.setCompanyId(company);
            transferLine.setStockTransferId(savedTransfer.getId());
            savedLines.add(lineRepository.save(transferLine));
        }

        // Only execute stock movement immediately if NOT a draft/pending workflow document
        if (!isDraft) {
            executeTransferMovement(savedTransfer, savedLines, company, request.getInitiatedBy());
        }

        return mapper.toResponse(savedTransfer);
    }

    private void executeTransferMovement(StockTransfer transfer, List<StockTransferLine> lines, UUID company, UUID initiatedBy) {
        if (transfer.getStockMovementId() != null) {
            log.info("Stock movement already processed for transfer: {}", transfer.getTransferNo());
            return;
        }

        Warehouse sourceWarehouse = warehouseRepository.findByIdAndCompanyId(transfer.getSourceWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse destWarehouse = warehouseRepository.findByIdAndCompanyId(transfer.getDestinationWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Destination warehouse not found"));

        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(transfer.getTransferDate() != null ? transfer.getTransferDate() : LocalDateTime.now());
        movement.setMovementType(StockMovementType.TRANSFER_OUT.name());
        movement.setStatus("COMPLETED");
        movement.setReferenceType(ReferenceType.STOCK_TRANSFER);
        movement.setReferenceNumber(transfer.getTransferNo());
        movement.setPostedAt(LocalDateTime.now());
        movement.setPostedBy(initiatedBy != null ? initiatedBy : transfer.getInitiatedBy());

        StockMovement savedMovement = stockMovementRepository.save(movement);

        BigDecimal totalMovementQty = BigDecimal.ZERO;
        BigDecimal totalMovementValue = BigDecimal.ZERO;

        for (StockTransferLine transferLine : lines) {
            WarehouseLocation sourceLocation = locationRepository.findByIdAndCompanyId(transferLine.getSourceLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Source location not found"));
            WarehouseLocation destLocation = locationRepository.findByIdAndCompanyId(transferLine.getDestinationLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination location not found"));
            Product product = productRepository.findByIdAndCompanyId(transferLine.getProductId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

            // Get source stock before removing
            InventoryStock sourceStock = inventoryStockRepository.findUniqueStock(product.getId(), sourceWarehouse.getId(), sourceLocation.getId(), transferLine.getBatchId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Source stock not found"));
            BigDecimal qtyBefore = sourceStock.getQuantity();

            // Update Source Stock
            inventoryStockService.removeStock(product.getId(), sourceWarehouse.getId(), sourceLocation.getId(), transferLine.getBatchId(), transferLine.getQuantity(), company);

            // Update/Create Destination Stock
            inventoryStockService.addStock(product.getId(), destWarehouse.getId(), destLocation.getId(), transferLine.getBatchId(), transferLine.getQuantity(), transferLine.getUnitCost(), company);

            // Save Movement Line
            BigDecimal lineTotalValue = transferLine.getQuantity().multiply(transferLine.getUnitCost() != null ? transferLine.getUnitCost() : BigDecimal.ZERO);

            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setSourceWarehouseId(sourceWarehouse.getId());
            movementLine.setSourceLocationId(sourceLocation.getId());
            movementLine.setDestinationWarehouseId(destWarehouse.getId());
            movementLine.setDestinationLocationId(destLocation.getId());
            movementLine.setBatchId(transferLine.getBatchId());
            movementLine.setSerialId(transferLine.getSerialId());
            movementLine.setUomId(transferLine.getUomId());
            movementLine.setQuantity(transferLine.getQuantity());
            movementLine.setUnitCost(transferLine.getUnitCost());
            movementLine.setTotalCost(lineTotalValue);
            movementLine.setQuantityBefore(qtyBefore);
            movementLine.setQuantityAfter(sourceStock.getQuantity());
            movementLine.setReferenceLineId(transferLine.getId());
            stockMovementLineRepository.save(movementLine);

            inventoryCostLayerService.processOutboundCost(movementLine, company);
            inventoryCostLayerService.processInboundCost(movementLine, company);

            totalMovementQty = totalMovementQty.add(transferLine.getQuantity());
            totalMovementValue = totalMovementValue.add(lineTotalValue);
        }

        // Update Movement Header Totals
        savedMovement.setTotalQuantity(totalMovementQty);
        savedMovement.setTotalValue(totalMovementValue);
        savedMovement.setReferenceId(transfer.getId());
        stockMovementRepository.save(savedMovement);

        transfer.setStockMovementId(savedMovement.getId());
        repository.save(transfer);
    }

    @Override
    @Transactional
    public void processStockTransferMovement(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));
        if (transfer.getStockMovementId() != null) {
            log.info("Stock transfer {} movement already processed", transfer.getTransferNo());
            return;
        }
        List<StockTransferLine> lines = lineRepository.findAllByStockTransferIdAndCompanyId(id, company);
        executeTransferMovement(transfer, lines, company, CurrentUserContext.getUserId());
        transfer.setStatus("APPROVED");
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setApprovedBy(CurrentUserContext.getUserId());
        repository.save(transfer);
    }

    @Override
    @Transactional
    public StockTransferResponse submitForApproval(UUID id, UUID companyId, String comments) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));

        if (!"DRAFT".equalsIgnoreCase(transfer.getStatus()) && !"RETURNED".equalsIgnoreCase(transfer.getStatus()) && !"REJECTED".equalsIgnoreCase(transfer.getStatus())) {
            throw new BusinessValidationException("Only DRAFT stock transfers can be submitted for approval. Current status: " + transfer.getStatus());
        }

        // Duplicate workflow submission check
        try {
            WorkflowTransactionDto existingTx = workflowClient.getWorkflowByDocument(company, "STOCK_TRANSFER", id);
            if (existingTx != null && ("PENDING".equalsIgnoreCase(existingTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(existingTx.getStatus()))) {
                throw new BusinessValidationException("Stock transfer is already submitted for approval with transaction: " + existingTx.getId());
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("No existing workflow transaction found for stock transfer {}", id);
        }

        try {
            workflowClient.submitWorkflow(
                    company,
                    "STOCK_TRANSFER",
                    transfer.getId(),
                    transfer.getTransferNo(),
                    comments != null ? comments : "Submitted stock transfer for approval"
            );
            transfer.setStatus("PENDING_APPROVAL");
            repository.save(transfer);
            log.info("Stock transfer {} submitted for approval to workflow-service", transfer.getTransferNo());
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Workflow engine submission failed for stock transfer {}. Error: {}", id, e.getMessage());
            throw new BusinessValidationException("Failed to submit stock transfer for workflow approval: " + e.getMessage());
        }

        return mapper.toResponse(transfer);
    }

    @Override
    @Transactional
    public StockTransferResponse approveTransfer(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));

        // Bypass check: Block direct approval if an active workflow is pending
        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_TRANSFER", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock transfer cannot be approved directly while workflow approval is pending. Please approve via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock transfer {}: {}", id, e.getMessage());
        }

        processStockTransferMovement(id, company);
        transfer.setStatus("APPROVED");
        transfer.setApprovedAt(LocalDateTime.now());
        transfer.setApprovedBy(CurrentUserContext.getUserId());
        StockTransfer saved = repository.save(transfer);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockTransferResponse rejectTransfer(UUID id, UUID companyId, String reason) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));

        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_TRANSFER", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock transfer cannot be rejected directly while workflow approval is pending. Please reject via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock transfer rejection {}: {}", id, e.getMessage());
        }

        transfer.setStatus("REJECTED");
        if (reason != null && !reason.trim().isEmpty()) {
            transfer.setRemarks((transfer.getRemarks() != null ? transfer.getRemarks() + " | " : "") + "Rejected: " + reason);
        }
        StockTransfer saved = repository.save(transfer);
        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public StockTransferResponse cancelTransfer(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));

        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_TRANSFER", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock transfer cannot be cancelled directly while workflow approval is pending. Please cancel via the workflow.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock transfer cancellation {}: {}", id, e.getMessage());
        }

        if ("COMPLETED".equalsIgnoreCase(transfer.getStatus()) || transfer.getStockMovementId() != null) {
            throw new BusinessValidationException("Completed transfers cannot be cancelled directly. Please reverse instead.");
        }

        transfer.setStatus("CANCELLED");
        StockTransfer saved = repository.save(transfer);
        return mapper.toResponse(saved);
    }

    @Override
    public StockTransferResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));
        return mapper.toResponse(transfer);
    }

    @Override
    public Page<StockTransferResponse> getAll(StockTransferFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        Page<StockTransfer> page = repository.findAllByCompanyId(company, pageable);
        return page.map(mapper::toResponse);
    }

    @Override
    public StockTransferResponse reverse(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransfer transfer = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Stock Transfer not found"));

        try {
            WorkflowTransactionDto activeTx = workflowClient.getWorkflowByDocument(company, "STOCK_TRANSFER", id);
            if (activeTx != null && ("PENDING".equalsIgnoreCase(activeTx.getStatus()) || "IN_PROGRESS".equalsIgnoreCase(activeTx.getStatus()))) {
                throw new BusinessValidationException("Stock transfer cannot be reversed while workflow approval is pending.");
            }
        } catch (BusinessValidationException e) {
            throw e;
        } catch (Exception e) {
            log.debug("Workflow check skipped for stock transfer reversal {}: {}", id, e.getMessage());
        }

        if ("REVERSED".equalsIgnoreCase(transfer.getStatus()) || "CANCELLED".equalsIgnoreCase(transfer.getStatus())) {
            throw new BusinessValidationException("Stock Transfer is already reversed or cancelled.");
        }
        
        if (!"COMPLETED".equalsIgnoreCase(transfer.getStatus()) && !"APPROVED".equalsIgnoreCase(transfer.getStatus())) {
            throw new BusinessValidationException("Only completed transfers can be reversed.");
        }

        inventoryPeriodService.validateTransactionDate(java.time.LocalDate.now(), company);

        List<StockTransferLine> lines = lineRepository.findAllByStockTransferIdAndCompanyId(id, company);
        
        // Create Reversal Movement
        StockMovement reversalMovement = new StockMovement();
        reversalMovement.setCompanyId(company);
        reversalMovement.setMovementDate(LocalDateTime.now());
        reversalMovement.setMovementType(StockMovementType.TRANSFER_OUT.name());
        reversalMovement.setStatus("COMPLETED");
        reversalMovement.setReferenceType(ReferenceType.STOCK_TRANSFER);
        reversalMovement.setReferenceNumber(transfer.getTransferNo() + "-REV");
        reversalMovement.setPostedAt(LocalDateTime.now());
        reversalMovement.setPostedBy(transfer.getInitiatedBy());
        
        StockMovement savedReversalMovement = stockMovementRepository.save(reversalMovement);
        
        BigDecimal totalMovementQty = BigDecimal.ZERO;
        BigDecimal totalMovementValue = BigDecimal.ZERO;

        for (StockTransferLine line : lines) {
            // Get dest stock before removing
            InventoryStock destStock = inventoryStockRepository.findUniqueStock(line.getProductId(), transfer.getDestinationWarehouseId(), line.getDestinationLocationId(), line.getBatchId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Destination inventory stock not found for reversal"));
            BigDecimal destQtyBefore = destStock.getQuantity();

            // Reverse Destination (Remove stock)
            inventoryStockService.removeStock(line.getProductId(), transfer.getDestinationWarehouseId(), line.getDestinationLocationId(), line.getBatchId(), line.getQuantity(), company);

            // Reverse Source (Receipt in)
            inventoryStockService.addStock(line.getProductId(), transfer.getSourceWarehouseId(), line.getSourceLocationId(), line.getBatchId(), line.getQuantity(), line.getUnitCost(), company);
            
            BigDecimal destQtyAfter = destQtyBefore.subtract(line.getQuantity());
            BigDecimal transferUnitCost = line.getUnitCost() != null ? line.getUnitCost() : BigDecimal.ZERO;

            // Save Movement Line for Reversal (Swapped Source and Destination)
            BigDecimal lineTotalValue = line.getQuantity().multiply(transferUnitCost);
            
            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedReversalMovement.getId());
            movementLine.setProductId(line.getProductId());
            movementLine.setSourceWarehouseId(transfer.getDestinationWarehouseId());
            movementLine.setSourceLocationId(line.getDestinationLocationId());
            movementLine.setDestinationWarehouseId(transfer.getSourceWarehouseId());
            movementLine.setDestinationLocationId(line.getSourceLocationId());
            movementLine.setBatchId(line.getBatchId());
            movementLine.setSerialId(line.getSerialId());
            movementLine.setUomId(line.getUomId());
            movementLine.setQuantity(line.getQuantity());
            movementLine.setUnitCost(transferUnitCost);
            movementLine.setTotalCost(lineTotalValue);
            movementLine.setQuantityBefore(destQtyBefore);
            movementLine.setQuantityAfter(destQtyAfter);
            movementLine.setReferenceLineId(line.getId());
            stockMovementLineRepository.save(movementLine);

            inventoryCostLayerService.processOutboundCost(movementLine, company);
            inventoryCostLayerService.processInboundCost(movementLine, company);
            
            totalMovementQty = totalMovementQty.add(line.getQuantity());
            totalMovementValue = totalMovementValue.add(lineTotalValue);
        }

        savedReversalMovement.setTotalQuantity(totalMovementQty);
        savedReversalMovement.setTotalValue(totalMovementValue);
        stockMovementRepository.save(savedReversalMovement);

        transfer.setStatus("REVERSED");
        transfer.setRemarks((transfer.getRemarks() != null ? transfer.getRemarks() + " | " : "") + "Reversed on " + LocalDateTime.now());
        StockTransfer savedTransfer = repository.save(transfer);

        return mapper.toResponse(savedTransfer);
    }
}
