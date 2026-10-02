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

        // Initialize StockMovement Header
        StockMovement movement = new StockMovement();
        movement.setCompanyId(company);
        movement.setMovementDate(request.getTransferDate() != null ? request.getTransferDate() : LocalDateTime.now());
        movement.setMovementType(StockMovementType.TRANSFER_OUT.name());
        movement.setStatus("COMPLETED");
        movement.setReferenceType(ReferenceType.STOCK_TRANSFER);
        movement.setReferenceNumber(request.getTransferNo());
        movement.setPostedAt(LocalDateTime.now());
        movement.setPostedBy(request.getInitiatedBy()); // Optional fallback to security context if null
        
        StockMovement savedMovement = stockMovementRepository.save(movement);

        // Initialize Transfer Header
        StockTransfer transfer = mapper.toEntity(request);
        transfer.setCompanyId(company);
        transfer.setStatus("COMPLETED"); // Completing it implicitly according to business logic rules.
        transfer.setStockMovementId(savedMovement.getId());
        StockTransfer savedTransfer = repository.save(transfer);
        
        BigDecimal totalMovementQty = BigDecimal.ZERO;
        BigDecimal totalMovementValue = BigDecimal.ZERO;

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

            // Get source stock before removing
            InventoryStock sourceStock = inventoryStockRepository.findUniqueStock(product.getId(), sourceWarehouse.getId(), sourceLocation.getId(), lineReq.getBatchId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Source stock not found"));
            BigDecimal qtyBefore = sourceStock.getQuantity();

            // Update Source Stock
            inventoryStockService.removeStock(product.getId(), sourceWarehouse.getId(), sourceLocation.getId(), lineReq.getBatchId(), lineReq.getQuantity(), company);

            // Update/Create Destination Stock
            inventoryStockService.addStock(product.getId(), destWarehouse.getId(), destLocation.getId(), lineReq.getBatchId(), lineReq.getQuantity(), lineReq.getUnitCost(), company);



            // Save Transfer Line
            StockTransferLine transferLine = lineMapper.toEntity(lineReq);
            transferLine.setCompanyId(company);
            transferLine.setStockTransferId(savedTransfer.getId());
            savedLines.add(lineRepository.save(transferLine));

            // Save Movement Line
            BigDecimal lineTotalValue = lineReq.getQuantity().multiply(lineReq.getUnitCost() != null ? lineReq.getUnitCost() : BigDecimal.ZERO);
            
            StockMovementLine movementLine = new StockMovementLine();
            movementLine.setCompanyId(company);
            movementLine.setStockMovementId(savedMovement.getId());
            movementLine.setProductId(product.getId());
            movementLine.setSourceWarehouseId(sourceWarehouse.getId());
            movementLine.setSourceLocationId(sourceLocation.getId());
            movementLine.setDestinationWarehouseId(destWarehouse.getId());
            movementLine.setDestinationLocationId(destLocation.getId());
            movementLine.setBatchId(lineReq.getBatchId());
            movementLine.setSerialId(lineReq.getSerialId());
            movementLine.setUomId(lineReq.getUomId());
            movementLine.setQuantity(lineReq.getQuantity());
            movementLine.setUnitCost(lineReq.getUnitCost());
            movementLine.setTotalCost(lineTotalValue);
            movementLine.setQuantityBefore(qtyBefore);
            movementLine.setQuantityAfter(sourceStock.getQuantity());
            movementLine.setReferenceLineId(transferLine.getId());
            stockMovementLineRepository.save(movementLine);

            inventoryCostLayerService.processOutboundCost(movementLine, company);
            inventoryCostLayerService.processInboundCost(movementLine, company);
            
            totalMovementQty = totalMovementQty.add(lineReq.getQuantity());
            totalMovementValue = totalMovementValue.add(lineTotalValue);
        }

        // Update Movement Header Totals
        savedMovement.setTotalQuantity(totalMovementQty);
        savedMovement.setTotalValue(totalMovementValue);
        savedMovement.setReferenceId(savedTransfer.getId());
        stockMovementRepository.save(savedMovement);

        return mapper.toResponse(savedTransfer);
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

        if ("REVERSED".equalsIgnoreCase(transfer.getStatus()) || "CANCELLED".equalsIgnoreCase(transfer.getStatus())) {
            throw new BusinessValidationException("Stock Transfer is already reversed or cancelled.");
        }
        
        if (!"COMPLETED".equalsIgnoreCase(transfer.getStatus())) {
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
