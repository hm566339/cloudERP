package com.erp.inventory.modules.pricing.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.pricing.dto.request.ProductPriceRequest;
import com.erp.inventory.modules.pricing.dto.request.ProductPriceFilterRequest;
import com.erp.inventory.modules.pricing.dto.response.ProductPriceResponse;
import com.erp.inventory.modules.pricing.service.ProductPriceService;
import com.erp.inventory.modules.pricing.mapper.ProductPriceMapper;
import com.erp.inventory.modules.pricing.repository.ProductPriceRepository;
import com.erp.inventory.modules.pricing.repository.ProductPriceSpecification;
import com.erp.inventory.modules.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductPriceServiceImpl implements ProductPriceService {

    private final ProductPriceRepository repository;
    private final ProductPriceMapper mapper;
    private final ProductRepository productRepository;

    @Override
    public ProductPriceResponse create(ProductPriceRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductPrice creation for company: {}", company);
        log.debug("ProductPrice creation payload: {}", request);

        validateRequest(request);

        productRepository.findByIdAndCompanyId(request.getProductId(), company)
                .orElseThrow(() -> {
                    log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                    return new BusinessValidationException("Product not found with id: " + request.getProductId());
                });

        var entity = mapper.toEntity(request);
        entity.setCompanyId(company);
        
        if (entity.getStatus() == null || entity.getStatus().isBlank()) {
            entity.setStatus("ACTIVE");
        }

        if (entity.getEffectiveFrom() == null) {
            entity.setEffectiveFrom(LocalDateTime.now());
        }

        // Enforce Precision
        entity.setPrice(entity.getPrice().setScale(4, RoundingMode.HALF_UP));
        entity.setMinQuantity(entity.getMinQuantity().setScale(4, RoundingMode.HALF_UP));

        // Overlap Check
        if ("ACTIVE".equals(entity.getStatus())) {
            UUID excludeId = UUID.fromString("00000000-0000-0000-0000-000000000000");
            LocalDateTime checkEffectiveTo = entity.getEffectiveTo() != null ? entity.getEffectiveTo() : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
            
            int overlaps = repository.countOverlappingPrices(
                    company, entity.getProductId(), entity.getPriceType(), 
                    entity.getCurrencyCode(), entity.getMinQuantity(), 
                    entity.getEffectiveFrom(), checkEffectiveTo, excludeId);
            if (overlaps > 0) {
                throw new BusinessValidationException("An active price already exists for this product, type, currency, and quantity within the specified date range");
            }
        }
        
        entity = repository.save(entity);
        log.info("Successfully created ProductPrice with id: {}", entity.getId());

        return mapper.toResponse(entity);
    }

    @Override
    public ProductPriceResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching ProductPrice with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ProductPrice not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductPrice not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<ProductPriceResponse> getAll(ProductPriceFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching ProductPrice list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        if (filter.getCompanyId() == null) {
            filter.setCompanyId(company);
        }
        return repository.findAll(ProductPriceSpecification.withFilter(filter), pageable).map(mapper::toResponse);
    }

    @Override
    public ProductPriceResponse update(UUID id, ProductPriceRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductPrice update for id: {} and company: {}", id, company);
        log.debug("ProductPrice update payload: {}", request);
        
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. ProductPrice not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductPrice not found with id: " + id);
                });

        validateRequest(request);

        boolean isHistorical = entity.getEffectiveFrom() != null && entity.getEffectiveFrom().isBefore(LocalDateTime.now());
        
        if (isHistorical) {
            // Can only update effectiveTo, status, and remarks if historical
            if (request.getPrice() != null && request.getPrice().setScale(4, RoundingMode.HALF_UP).compareTo(entity.getPrice()) != 0) {
                throw new BusinessValidationException("Historical prices cannot have their value changed. Deactivate and create a new price.");
            }
            if (!entity.getProductId().equals(request.getProductId())) {
                throw new BusinessValidationException("Historical prices cannot have their product association changed.");
            }
            if (request.getPriceType() != null && request.getPriceType() != entity.getPriceType()) {
                throw new BusinessValidationException("Historical prices cannot have their price type changed.");
            }
            if (request.getCurrencyCode() != null && !request.getCurrencyCode().equals(entity.getCurrencyCode())) {
                throw new BusinessValidationException("Historical prices cannot have their currency code changed.");
            }
            if (request.getMinQuantity() != null && request.getMinQuantity().setScale(4, RoundingMode.HALF_UP).compareTo(entity.getMinQuantity()) != 0) {
                throw new BusinessValidationException("Historical prices cannot have their minimum quantity changed.");
            }
            if (request.getEffectiveFrom() != null && !request.getEffectiveFrom().equals(entity.getEffectiveFrom())) {
                throw new BusinessValidationException("Historical prices cannot have their effective start date changed.");
            }
        }

        if (!entity.getProductId().equals(request.getProductId())) {
            productRepository.findByIdAndCompanyId(request.getProductId(), entity.getCompanyId())
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                        return new BusinessValidationException("Product not found with id: " + request.getProductId());
                    });
        }

        mapper.updateEntityFromRequest(request, entity);
        
        if (entity.getEffectiveFrom() == null) {
            entity.setEffectiveFrom(LocalDateTime.now());
        }

        // Enforce Precision
        entity.setPrice(entity.getPrice().setScale(4, RoundingMode.HALF_UP));
        entity.setMinQuantity(entity.getMinQuantity().setScale(4, RoundingMode.HALF_UP));

        // Overlap Check
        if ("ACTIVE".equals(entity.getStatus())) {
            LocalDateTime checkEffectiveTo = entity.getEffectiveTo() != null ? entity.getEffectiveTo() : LocalDateTime.of(9999, 12, 31, 23, 59, 59);

            int overlaps = repository.countOverlappingPrices(
                    company, entity.getProductId(), entity.getPriceType(), 
                    entity.getCurrencyCode(), entity.getMinQuantity(), 
                    entity.getEffectiveFrom(), checkEffectiveTo, id);
            if (overlaps > 0) {
                throw new BusinessValidationException("An active price already exists for this product, type, currency, and quantity within the specified date range");
            }
        }

        entity = repository.save(entity);
        log.info("Successfully updated ProductPrice with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of ProductPrice with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to delete. ProductPrice not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductPrice not found with id: " + id);
                });
        
        boolean isHistorical = entity.getEffectiveFrom() != null && entity.getEffectiveFrom().isBefore(LocalDateTime.now());
        if (isHistorical) {
            throw new BusinessValidationException("Historical prices cannot be deleted. Deactivate or expire them instead.");
        }

        repository.deleteById(id);
        log.info("Successfully deleted ProductPrice with id: {}", id);
    }

    private void validateRequest(ProductPriceRequest request) {
        if (request.getCurrencyCode() == null || request.getCurrencyCode().trim().isEmpty()) {
            throw new BusinessValidationException("currencyCode is required");
        }
        if (request.getPrice() != null && request.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("price cannot be negative");
        }
        if (request.getMinQuantity() != null && request.getMinQuantity().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessValidationException("minQuantity cannot be negative");
        }
        if (request.getEffectiveFrom() != null && request.getEffectiveTo() != null) {
            if (request.getEffectiveTo().isBefore(request.getEffectiveFrom())) {
                log.warn("Validation failed: Effective to date {} is before effective from date {}", request.getEffectiveTo(),
                        request.getEffectiveFrom());
                throw new BusinessValidationException("Effective to date cannot be before effective from date");
            }
        }
    }
}
