package com.erp.inventory.modules.serial.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.serial.dto.request.ProductSerialRequest;
import com.erp.inventory.modules.serial.dto.request.ProductSerialFilterRequest;
import com.erp.inventory.modules.serial.dto.response.ProductSerialResponse;
import com.erp.inventory.modules.serial.service.ProductSerialService;
import com.erp.inventory.modules.serial.mapper.ProductSerialMapper;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialSpecification;
import com.erp.inventory.modules.serial.entity.ProductSerial;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentLineRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
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
public class ProductSerialServiceImpl implements ProductSerialService {

    private final ProductSerialRepository repository;
    private final ProductSerialMapper mapper;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final StockMovementLineRepository stockMovementLineRepository;
    private final OpeningStockLineRepository openingStockLineRepository;
    private final StockAdjustmentLineRepository stockAdjustmentLineRepository;
    private final StockTransferLineRepository stockTransferLineRepository;

    @Override
    public ProductSerialResponse create(ProductSerialRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductSerial creation for company: {}", company);
        log.debug("ProductSerial creation payload: {}", request);

        validateRequest(request);

        var product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                .orElseThrow(() -> {
                    log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                    return new BusinessValidationException("Product not found with id: " + request.getProductId());
                });

        if (product.getTrackingType() != TrackingType.SERIAL && product.getTrackingType() != TrackingType.BATCH_AND_SERIAL) {
            throw new BusinessValidationException("Product is not serial tracked");
        }

        if (request.getBatchId() != null) {
            var batch = productBatchRepository.findByIdAndCompanyId(request.getBatchId(), company)
                    .orElseThrow(() -> new BusinessValidationException("Batch not found with id: " + request.getBatchId()));
            if (!batch.getProductId().equals(product.getId())) {
                throw new BusinessValidationException("Batch does not belong to the requested product");
            }
        } else if (product.getTrackingType() == TrackingType.BATCH_AND_SERIAL) {
             throw new BusinessValidationException("Batch is required for products with BATCH_AND_SERIAL tracking");
        }

        var entity = mapper.toEntity(request);
        entity.setCompanyId(company);

        if (entity.getStatus() == null || entity.getStatus().isBlank()) {
            entity.setStatus("AVAILABLE");
        }

        // Auto-generate serial number with concurrent safety if not provided
        if (entity.getSerialNumber() == null || entity.getSerialNumber().isBlank()) {
            int maxRetries = 5;
            for (int i = 0; i < maxRetries; i++) {
                String serialNumber = generateSerialNumber(product.getProductName(), company);
                entity.setSerialNumber(serialNumber);
                try {
                    entity = repository.saveAndFlush(entity);
                    log.info("Successfully created ProductSerial with id: {}, serialNumber: {}", entity.getId(), serialNumber);
                    return mapper.toResponse(entity);
                } catch (DataIntegrityViolationException e) {
                    log.warn("Serial number collision for {}. Retrying... ({}/{})", serialNumber, i + 1, maxRetries);
                    if (i == maxRetries - 1) {
                        throw new BusinessValidationException("Failed to generate a unique serial number after multiple attempts. Please try again.");
                    }
                }
            }
        } else {
             if (repository.existsBySerialNumberAndCompanyId(entity.getSerialNumber(), company)) {
                 throw new BusinessValidationException("Serial number already exists: " + entity.getSerialNumber());
             }
             try {
                 entity = repository.saveAndFlush(entity);
                 log.info("Successfully created ProductSerial with id: {}, serialNumber: {}", entity.getId(), entity.getSerialNumber());
                 return mapper.toResponse(entity);
             } catch (DataIntegrityViolationException e) {
                 throw new BusinessValidationException("Serial number already exists: " + entity.getSerialNumber());
             }
        }
        
        return null;
    }

    @Override
    public ProductSerialResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching ProductSerial with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ProductSerial not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductSerial not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<ProductSerialResponse> getAll(ProductSerialFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching ProductSerial list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        if (filter.getCompanyId() == null) {
            filter.setCompanyId(company);
        }
        return repository.findAll(ProductSerialSpecification.withFilter(filter), pageable).map(mapper::toResponse);
    }

    @Override
    public ProductSerialResponse update(UUID id, ProductSerialRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductSerial update for id: {} and company: {}", id, company);
        log.debug("ProductSerial update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. ProductSerial not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductSerial not found with id: " + id);
                });

        validateRequest(request);

        boolean isUsed = isSerialReferenced(id, company);

        if (isUsed) {
            if (!entity.getProductId().equals(request.getProductId())) {
                throw new BusinessValidationException("Serial cannot be updated: Product association cannot be modified because it is already used in inventory");
            }
            if (entity.getBatchId() != null && !entity.getBatchId().equals(request.getBatchId()) || 
                entity.getBatchId() == null && request.getBatchId() != null) {
                throw new BusinessValidationException("Serial cannot be updated: Batch association cannot be modified because it is already used in inventory");
            }
        }

        if (!entity.getProductId().equals(request.getProductId())) {
            var product = productRepository.findByIdAndCompanyId(request.getProductId(), company)
                    .orElseThrow(() -> new BusinessValidationException("Product not found with id: " + request.getProductId()));
            if (product.getTrackingType() != TrackingType.SERIAL && product.getTrackingType() != TrackingType.BATCH_AND_SERIAL) {
                throw new BusinessValidationException("Product is not serial tracked");
            }
            if (request.getBatchId() != null) {
                var batch = productBatchRepository.findByIdAndCompanyId(request.getBatchId(), company)
                        .orElseThrow(() -> new BusinessValidationException("Batch not found with id: " + request.getBatchId()));
                if (!batch.getProductId().equals(product.getId())) {
                    throw new BusinessValidationException("Batch does not belong to the requested product");
                }
            } else if (product.getTrackingType() == TrackingType.BATCH_AND_SERIAL) {
                throw new BusinessValidationException("Batch is required for products with BATCH_AND_SERIAL tracking");
            }
        } else if (request.getBatchId() != null && !request.getBatchId().equals(entity.getBatchId())) {
            var batch = productBatchRepository.findByIdAndCompanyId(request.getBatchId(), company)
                    .orElseThrow(() -> new BusinessValidationException("Batch not found with id: " + request.getBatchId()));
            if (!batch.getProductId().equals(entity.getProductId())) {
                throw new BusinessValidationException("Batch does not belong to the requested product");
            }
        }

        String existingSerialNumber = entity.getSerialNumber();
        mapper.updateEntityFromRequest(request, entity);
        entity.setSerialNumber(existingSerialNumber);

        entity = repository.save(entity);
        log.info("Successfully updated ProductSerial with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of ProductSerial with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. ProductSerial not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("ProductSerial not found with id: " + id);
        }

        if (isSerialReferenced(id, company)) {
            throw new BusinessValidationException("Serial cannot be deleted because it is already used in inventory history.");
        }

        repository.deleteById(id);
        log.info("Successfully deleted ProductSerial with id: {}", id);
    }

    private void validateRequest(ProductSerialRequest request) {
        if (request.getWarrantyStartDate() != null && request.getWarrantyEndDate() != null) {
            if (request.getWarrantyEndDate().isBefore(request.getWarrantyStartDate())) {
                log.warn("Validation failed: Warranty end date {} is before warranty start date {}", request.getWarrantyEndDate(),
                        request.getWarrantyStartDate());
                throw new BusinessValidationException("Warranty end date cannot be before warranty start date");
            }
        }
    }

    private boolean isSerialReferenced(UUID serialId, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        return stockMovementLineRepository.existsBySerialIdAndCompanyId(serialId, company) ||
               openingStockLineRepository.existsBySerialIdAndCompanyId(serialId, company) ||
               stockAdjustmentLineRepository.existsBySerialIdAndCompanyId(serialId, company) ||
               stockTransferLineRepository.existsBySerialIdAndCompanyId(serialId, company);
    }

    private String generateSerialNumber(String productName, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "SER";
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
        while (repository.existsBySerialNumberAndCompanyId(generatedCode, company)) {
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
        }
        return generatedCode;
    }
}
