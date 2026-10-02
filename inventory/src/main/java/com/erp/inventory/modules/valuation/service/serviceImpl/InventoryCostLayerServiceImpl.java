package com.erp.inventory.modules.valuation.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryCostLayerFilterRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryCostLayerResponse;
import com.erp.inventory.modules.valuation.entity.InventoryCostLayer;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.valuation.mapper.InventoryCostLayerMapper;
import com.erp.inventory.modules.valuation.repository.InventoryCostLayerRepository;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.valuation.service.InventoryValuationService;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class InventoryCostLayerServiceImpl implements InventoryCostLayerService {

    private final InventoryCostLayerRepository repository;
    private final InventoryCostLayerMapper mapper;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryValuationService valuationService;

    @Override
    public InventoryCostLayerResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null) throw new BusinessValidationException("Company ID is required");
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("InventoryCostLayer not found"));
        return mapper.toResponse(entity);
    }

    @Override
    public Page<InventoryCostLayerResponse> getAll(InventoryCostLayerFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        if (company == null) throw new BusinessValidationException("Company ID is required");
        if (filter != null) {
            return repository.findAllByFilter(company, filter, pageable).map(mapper::toResponse);
        }
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    @Override
    public void processInboundCost(StockMovementLine line, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Processing inbound cost layer for movement line: {}", line != null ? line.getId() : null);

        if (line == null) {
            throw new BusinessValidationException("Movement line cannot be null");
        }
        if (company == null) {
            throw new BusinessValidationException("Company ID is required");
        }
        if (line.getProductId() == null) {
            throw new BusinessValidationException("Product ID is required");
        }
        if (line.getDestinationWarehouseId() == null) {
            throw new BusinessValidationException("Destination Warehouse ID is required for inbound");
        }
        if (line.getStockMovementId() == null || line.getId() == null) {
            throw new BusinessValidationException("Source Movement ID and Line ID are required");
        }

        if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Received quantity must be greater than zero for inbound cost layer");
        }
        
        if (line.getUnitCost() == null || line.getUnitCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Unit cost must not be negative for inbound cost layer");
        }

        if (!warehouseRepository.existsByIdAndCompanyId(line.getDestinationWarehouseId(), company)) {
            throw new BusinessValidationException("Destination warehouse not found");
        }

        var product = productRepository.findByIdAndCompanyId(line.getProductId(), company)
                .orElseThrow(() -> new BusinessValidationException("Product not found"));

        if (com.erp.inventory.modules.product.enums.TrackingType.BATCH.equals(product.getTrackingType()) && line.getBatchId() == null) {
            throw new BusinessValidationException("Batch ID is required for BATCH tracked products");
        }

        if (repository.existsByCompanyIdAndSourceMovementIdAndSourceMovementLineId(company, line.getStockMovementId(), line.getId())) {
            throw new BusinessValidationException("Inbound cost layer already exists for movement line: " + line.getId());
        }

        BigDecimal receivedQuantity = line.getQuantity();
        BigDecimal unitCost = line.getUnitCost();
        BigDecimal totalCost = receivedQuantity.multiply(unitCost).setScale(4, RoundingMode.HALF_UP);

        InventoryCostLayer layer = InventoryCostLayer.builder()
                .productId(line.getProductId())
                .warehouseId(line.getDestinationWarehouseId())
                .batchId(line.getBatchId())
                .sourceMovementId(line.getStockMovementId())
                .sourceMovementLineId(line.getId())
                .receivedQuantity(receivedQuantity)
                .remainingQuantity(receivedQuantity)
                .unitCost(unitCost)
                .totalCost(totalCost)
                .consumedCost(BigDecimal.ZERO)
                .build();
        layer.setCompanyId(company);
        repository.save(layer);
        
        try {
            InventoryValuationRequest valuationRequest = new InventoryValuationRequest();
            valuationRequest.setStockMovementId(line.getStockMovementId());
            valuationRequest.setStockMovementLineId(line.getId());
            valuationRequest.setProductId(line.getProductId());
            valuationRequest.setWarehouseId(line.getDestinationWarehouseId());
            valuationRequest.setLocationId(line.getDestinationLocationId());
            valuationRequest.setBatchId(line.getBatchId());
            valuationRequest.setValuationDate(java.time.LocalDate.now());
            
            valuationService.create(valuationRequest, company);
        } catch (Exception e) {
            log.error("Failed to automatically generate financial valuation for inbound movement line {}: {}", line.getId(), e.getMessage());
            // We swallow the exception here to not block the stock movement if valuation generation fails due to e.g. duplicate or stock invariants
        }
    }

    @Override
    public void processOutboundCost(StockMovementLine line, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Processing outbound cost layer consumption for movement line: {}", line != null ? line.getId() : null);

        if (line == null) {
            throw new BusinessValidationException("Movement line cannot be null");
        }
        if (company == null) {
            throw new BusinessValidationException("Company ID is required");
        }
        if (line.getProductId() == null) {
            throw new BusinessValidationException("Product ID is required");
        }
        if (line.getQuantity() == null || line.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessValidationException("Consumed quantity must be greater than zero for outbound cost layer");
        }

        // Find warehouse: outbound should use sourceWarehouseId
        UUID warehouseId = line.getSourceWarehouseId();
        if (warehouseId == null) {
            // Some modules might implicitly use destination as source if reversing or purely adjustment outbound, but logically outbound implies source warehouse.
            warehouseId = line.getDestinationWarehouseId();
        }
        
        if (warehouseId == null) {
            throw new BusinessValidationException("Source Warehouse ID is required for outbound");
        }

        if (!warehouseRepository.existsByIdAndCompanyId(warehouseId, company)) {
            throw new BusinessValidationException("Warehouse not found");
        }

        var product = productRepository.findByIdAndCompanyId(line.getProductId(), company)
                .orElseThrow(() -> new BusinessValidationException("Product not found"));

        if (com.erp.inventory.modules.product.enums.TrackingType.BATCH.equals(product.getTrackingType()) && line.getBatchId() == null) {
            throw new BusinessValidationException("Batch ID is required for BATCH tracked products");
        }

        BigDecimal remainingToConsume = line.getQuantity();

        List<InventoryCostLayer> activeLayers = repository.findActiveLayersChronologically(
                line.getProductId(), warehouseId, line.getBatchId(), company);

        for (InventoryCostLayer layer : activeLayers) {
            if (remainingToConsume.compareTo(BigDecimal.ZERO) <= 0) break;

            BigDecimal availableInLayer = layer.getRemainingQuantity();
            BigDecimal quantityFromLayer = remainingToConsume.min(availableInLayer);
            
            remainingToConsume = remainingToConsume.subtract(quantityFromLayer);
            
            layer.setRemainingQuantity(layer.getRemainingQuantity().subtract(quantityFromLayer));
            BigDecimal layerCostConsumed = quantityFromLayer.multiply(layer.getUnitCost()).setScale(4, RoundingMode.HALF_UP);
            layer.setConsumedCost(layer.getConsumedCost().add(layerCostConsumed));
            
            repository.save(layer);
        }

        if (remainingToConsume.compareTo(BigDecimal.ZERO) > 0) {
            log.error("Insufficient cost layers to fulfill outbound quantity. Remaining unfulfilled: {}", remainingToConsume);
            throw new BusinessValidationException("Insufficient cost layer quantity for outbound movement");
        }

        try {
            InventoryValuationRequest valuationRequest = new InventoryValuationRequest();
            valuationRequest.setStockMovementId(line.getStockMovementId());
            valuationRequest.setStockMovementLineId(line.getId());
            valuationRequest.setProductId(line.getProductId());
            valuationRequest.setWarehouseId(warehouseId);
            valuationRequest.setLocationId(line.getSourceLocationId() != null ? line.getSourceLocationId() : line.getDestinationLocationId());
            valuationRequest.setBatchId(line.getBatchId());
            valuationRequest.setValuationDate(java.time.LocalDate.now());
            
            valuationService.create(valuationRequest, company);
        } catch (Exception e) {
            log.error("Failed to automatically generate financial valuation for outbound movement line {}: {}", line.getId(), e.getMessage());
        }
    }
}
