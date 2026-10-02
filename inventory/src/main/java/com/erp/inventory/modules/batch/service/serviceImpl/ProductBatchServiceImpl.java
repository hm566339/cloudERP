package com.erp.inventory.modules.batch.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.batch.dto.request.ProductBatchRequest;
import com.erp.inventory.modules.batch.dto.request.ProductBatchFilterRequest;
import com.erp.inventory.modules.batch.dto.response.ProductBatchResponse;
import com.erp.inventory.modules.batch.service.ProductBatchService;
import com.erp.inventory.modules.batch.mapper.ProductBatchMapper;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.batch.repository.ProductBatchSpecification;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentLineRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import com.erp.inventory.modules.reservation.repository.StockReservationRepository;
import com.erp.inventory.modules.valuation.repository.InventoryCostLayerRepository;
import com.erp.inventory.modules.valuation.repository.InventoryValuationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductBatchServiceImpl implements ProductBatchService {

    private final ProductBatchRepository repository;
    private final ProductBatchMapper mapper;
    private final ProductRepository productRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final InventoryCostLayerRepository inventoryCostLayerRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final OpeningStockLineRepository openingStockLineRepository;
    private final StockAdjustmentLineRepository stockAdjustmentLineRepository;
    private final StockTransferLineRepository stockTransferLineRepository;
    private final StockReservationRepository stockReservationRepository;
    private final InventoryValuationRepository inventoryValuationRepository;

    @Override
    public ProductBatchResponse create(ProductBatchRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductBatch creation for company: {}", company);
        log.debug("ProductBatch creation payload: {}", request);

        validateRequest(request);

        var product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                .orElseThrow(() -> {
                    log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                    return new BusinessValidationException("Product not found with id: " + request.getProductId());
                });

        if (product.getTrackingType() != TrackingType.BATCH && product.getTrackingType() != TrackingType.BATCH_AND_SERIAL) {
            throw new BusinessValidationException("Product is not batch tracked");
        }

        ProductBatch entity = mapper.toEntity(request);
        entity.setCompanyId(company);
        if (entity.getStatus() == null || entity.getStatus().isBlank()) {
            entity.setStatus("ACTIVE");
        }

        // Auto-generate batch number with concurrent safety
        int maxRetries = 5;
        for (int i = 0; i < maxRetries; i++) {
            String batchNumber = generateBatchNumber(product.getProductName(), company);
            entity.setBatchNumber(batchNumber);
            try {
                entity = repository.saveAndFlush(entity);
                log.info("Successfully created ProductBatch with id: {}, batchNumber: {}", entity.getId(), batchNumber);
                return mapper.toResponse(entity);
            } catch (DataIntegrityViolationException e) {
                log.warn("Batch number collision for {}. Retrying... ({}/{})", batchNumber, i + 1, maxRetries);
                if (i == maxRetries - 1) {
                    throw new BusinessValidationException("Failed to generate a unique batch number after multiple attempts. Please try again.");
                }
            }
        }
        
        return null;
    }

    @Override
    public ProductBatchResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching ProductBatch with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ProductBatch not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductBatch not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<ProductBatchResponse> getAll(ProductBatchFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching ProductBatch list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        if (filter.getCompanyId() == null) {
            filter.setCompanyId(company);
        }
        return repository.findAll(ProductBatchSpecification.withFilter(filter), pageable).map(mapper::toResponse);
    }

    @Override
    public ProductBatchResponse update(UUID id, ProductBatchRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductBatch update for id: {} and company: {}", id, company);
        log.debug("ProductBatch update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. ProductBatch not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductBatch not found with id: " + id);
                });

        validateRequest(request);

        boolean isUsed = isBatchReferenced(id, company);

        if (isUsed) {
            if (!entity.getProductId().equals(request.getProductId())) {
                throw new BusinessValidationException("Batch cannot be updated: Product association cannot be modified because it is already used in inventory");
            }
            if ((entity.getManufacturingDate() != null && !entity.getManufacturingDate().equals(request.getManufacturingDate())) ||
                (entity.getManufacturingDate() == null && request.getManufacturingDate() != null)) {
                throw new BusinessValidationException("Batch cannot be updated: Manufacturing date cannot be modified because it is already used in inventory");
            }
            if ((entity.getExpiryDate() != null && !entity.getExpiryDate().equals(request.getExpiryDate())) ||
                (entity.getExpiryDate() == null && request.getExpiryDate() != null)) {
                throw new BusinessValidationException("Batch cannot be updated: Expiry date cannot be modified because it is already used in inventory");
            }
        }

        if (!entity.getProductId().equals(request.getProductId())) {
            var product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                    .orElseThrow(() -> new BusinessValidationException("Product not found with id: " + request.getProductId()));
            if (product.getTrackingType() != TrackingType.BATCH && product.getTrackingType() != TrackingType.BATCH_AND_SERIAL) {
                throw new BusinessValidationException("Product is not batch tracked");
            }
        }

        String existingBatchNumber = entity.getBatchNumber();
        mapper.updateEntityFromRequest(request, entity);
        entity.setBatchNumber(existingBatchNumber);

        entity = repository.save(entity);
        log.info("Successfully updated ProductBatch with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of ProductBatch with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. ProductBatch not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("ProductBatch not found with id: " + id);
        }
        
        if (isBatchReferenced(id, company)) {
            throw new BusinessValidationException("Batch cannot be deleted because it is already used in inventory");
        }

        repository.deleteById(id);
        log.info("Successfully deleted ProductBatch with id: {}", id);
    }

    private void validateRequest(ProductBatchRequest request) {
        if (request.getManufacturingDate() != null && request.getExpiryDate() != null) {
            if (request.getExpiryDate().isBefore(request.getManufacturingDate())) {
                log.warn("Validation failed: Expiry date {} is before manufacturing date {}", request.getExpiryDate(),
                        request.getManufacturingDate());
                throw new BusinessValidationException("Expiry date cannot be before manufacturing date");
            }
        }
    }

    private boolean isBatchReferenced(UUID batchId, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        return inventoryStockRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               inventoryCostLayerRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               stockMovementLineRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               openingStockLineRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               stockAdjustmentLineRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               stockTransferLineRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               stockReservationRepository.existsByBatchIdAndCompanyId(batchId, company) ||
               inventoryValuationRepository.existsByBatchIdAndCompanyId(batchId, company);
    }

    private String generateBatchNumber(String productName, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "BAT";
        if (productName != null && !productName.trim().isEmpty()) {
            String cleanName = productName.replaceAll("\\s+", "");
            if (cleanName.length() >= 3) {
                prefix = cleanName.substring(0, 3).toUpperCase();
            } else {
                prefix = cleanName.toUpperCase();
            }
        }

        LocalDate now = LocalDate.now();
        String datePart = String.format("%02d%02d", now.getMonthValue(), now.getYear() % 100);
        String baseCode = prefix + "-" + datePart + "-";

        String generatedCode = baseCode + "001";
        int counter = 1;
        while (repository.existsByBatchNumberAndCompanyId(generatedCode, company)) {
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
        }
        return generatedCode;
    }
}
