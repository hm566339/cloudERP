package com.erp.inventory.modules.valuation.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationFilterRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryValuationResponse;
import com.erp.inventory.modules.valuation.entity.InventoryValuation;
import com.erp.inventory.modules.valuation.mapper.InventoryValuationMapper;
import com.erp.inventory.modules.valuation.repository.InventoryValuationRepository;
import com.erp.inventory.modules.valuation.repository.InventoryValuationSpecification;
import com.erp.inventory.modules.valuation.service.InventoryValuationService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryValuationServiceImpl implements InventoryValuationService {

    private final InventoryValuationRepository repository;
    private final InventoryValuationMapper mapper;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationRepository locationRepository;
    private final ProductBatchRepository batchRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final StockMovementRepository stockMovementRepository;
    private final InventoryPeriodService inventoryPeriodService;

    @Override
    @Transactional
    public InventoryValuationResponse create(InventoryValuationRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Creating InventoryValuation for company: {}, product: {}, warehouse: {}", 
                company, request.getProductId(), request.getWarehouseId());

        LocalDate valuationDate = request.getValuationDate() != null ? request.getValuationDate() : LocalDate.now();
        inventoryPeriodService.validateTransactionDate(valuationDate, company);

        // 1. Validate Product
        Product product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + request.getProductId()));

        // 2. Validate Warehouse
        Warehouse warehouse = warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.getWarehouseId()));

        // 3. Validate Location (optional)
        if (request.getLocationId() != null) {
            WarehouseLocation location = locationRepository.findByIdAndCompanyId(request.getLocationId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + request.getLocationId()));
            if (location.getWarehouseId() != null && !location.getWarehouseId().equals(warehouse.getId())) {
                throw new BusinessValidationException("Location does not belong to the specified warehouse");
            }
        }

        // 4. Validate Batch (if applicable)
        if (product.getTrackingType() == TrackingType.BATCH || product.getTrackingType() == TrackingType.BATCH_AND_SERIAL) {
            if (request.getBatchId() == null) {
                throw new BusinessValidationException("Batch ID is required for batch-tracked product: " + product.getProductName());
            }
        }

        if (request.getBatchId() != null) {
            ProductBatch batch = batchRepository.findByIdAndCompanyId(request.getBatchId(), company)
                    .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + request.getBatchId()));
            if (batch.getProductId() != null && !batch.getProductId().equals(product.getId())) {
                throw new BusinessValidationException("Batch does not belong to product: " + product.getId());
            }
        }

        // 5. Fetch authoritative Inventory Stock
        InventoryStock stock = inventoryStockRepository.findUniqueStock(
                product.getId(),
                warehouse.getId(),
                request.getLocationId(),
                request.getBatchId(),
                company
        ).orElse(null);

        if (stock == null && request.getStockMovementId() == null) {
            throw new ResourceNotFoundException("Inventory stock not found for the given criteria");
        }

        BigDecimal quantity = (stock != null && stock.getQuantity() != null) ? stock.getQuantity() : BigDecimal.ZERO;
        BigDecimal averageCost = (stock != null && stock.getAverageCost() != null) ? stock.getAverageCost() : BigDecimal.ZERO;
        BigDecimal stockValue = (stock != null && stock.getStockValue() != null) ? stock.getStockValue() : BigDecimal.ZERO;

        // 6. Verify Inventory Consistency Invariant
        if (quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Negative quantity in source inventory stock is not allowed for valuation");
        }
        if (averageCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("Negative average cost in source inventory stock is not allowed for valuation");
        }

        BigDecimal expectedValue = quantity.multiply(averageCost).setScale(4, RoundingMode.HALF_UP);
        BigDecimal difference = stockValue.subtract(expectedValue).abs();
        if (difference.compareTo(new BigDecimal("0.01")) > 0) {
            log.warn("Stock valuation discrepancy detected: expected value {} but got {}", expectedValue, stockValue);
        }

        // 7. Check if Valuation already exists for this scope and date -> update snapshot
        Optional<InventoryValuation> duplicateOpt = repository.findDuplicateValuation(
                company,
                product.getId(),
                warehouse.getId(),
                request.getLocationId(),
                request.getBatchId(),
                valuationDate
        );

        InventoryValuation valuation;
        if (duplicateOpt.isPresent()) {
            valuation = duplicateOpt.get();
            valuation.setStockMovementId(request.getStockMovementId());
            valuation.setStockMovementLineId(request.getStockMovementLineId());
        } else {
            valuation = mapper.toEntity(request);
            if (valuation == null) {
                valuation = new InventoryValuation();
            }
            valuation.setCompanyId(company);
            valuation.setProductId(product.getId());
            valuation.setWarehouseId(warehouse.getId());
            valuation.setLocationId(request.getLocationId());
            valuation.setBatchId(request.getBatchId());
            valuation.setValuationMethod(product.getValuationMethod() != null ? product.getValuationMethod() : ValuationMethod.WEIGHTED_AVERAGE);
            valuation.setCogsAmount(BigDecimal.ZERO);
            valuation.setGlPosted(false);
            valuation.setGlPostingRequired(Boolean.TRUE);
        }

        valuation.setValuationDate(valuationDate);
        valuation.setQuantity(quantity.setScale(4, RoundingMode.HALF_UP));
        valuation.setAverageCost(averageCost.setScale(4, RoundingMode.HALF_UP));
        valuation.setStockValue(stockValue.setScale(4, RoundingMode.HALF_UP));
        valuation.setInventoryCost(valuation.getAverageCost());
        if (valuation.getCurrencyCode() == null || valuation.getCurrencyCode().isBlank()) {
            valuation.setCurrencyCode("INR");
        }

        InventoryValuation savedValuation = repository.saveAndFlush(valuation);
        log.info("InventoryValuation saved successfully with id: {}, date: {}, qty: {}, avgCost: {}, value: {}",
                savedValuation.getId(), valuationDate, savedValuation.getQuantity(), savedValuation.getAverageCost(), savedValuation.getStockValue());

        return enrichResponse(mapper.toResponse(savedValuation), company);
    }

    private InventoryValuationResponse enrichResponse(InventoryValuationResponse response, UUID company) {
        if (response == null) {
            return null;
        }
        if (response.getProductId() != null) {
            productRepository.findByIdAndCompanyId(response.getProductId(), company)
                    .ifPresent(p -> response.setProductName(p.getProductName()));
        }
        if (response.getWarehouseId() != null) {
            warehouseRepository.findByIdAndCompanyId(response.getWarehouseId(), company)
                    .ifPresent(w -> response.setWarehouseName(w.getWarehouseName()));
        }
        if (response.getLocationId() != null) {
            locationRepository.findByIdAndCompanyId(response.getLocationId(), company)
                    .ifPresent(l -> response.setLocationName(l.getLocationName()));
        }
        if (response.getStockMovementId() != null) {
            stockMovementRepository.findByIdAndCompanyId(response.getStockMovementId(), company)
                    .ifPresent(sm -> response.setStockMovementNo(sm.getMovementNo()));
        }
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryValuationResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        InventoryValuation valuation = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory Valuation not found with id: " + id));
        return enrichResponse(mapper.toResponse(valuation), company);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryValuationResponse> getAll(InventoryValuationFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        var spec = InventoryValuationSpecification.getFilterSpecification(filter, company);
        Page<InventoryValuation> page = repository.findAll(spec, pageable);
        return page.map(v -> enrichResponse(mapper.toResponse(v), company));
    }

    @Override
    public InventoryValuationResponse update(UUID id, InventoryValuationRequest request, UUID companyId) {
        TenantUtils.resolveCompanyId(companyId);
        throw new BusinessValidationException("Direct update of inventory valuation is not permitted. Valuation history must be preserved.");
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        TenantUtils.resolveCompanyId(companyId);
        throw new BusinessValidationException("Direct deletion of inventory valuation is not permitted. Valuation history must be preserved.");
    }
}
