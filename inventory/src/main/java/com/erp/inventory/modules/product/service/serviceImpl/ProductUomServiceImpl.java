package com.erp.inventory.modules.product.service.serviceImpl;

import com.erp.inventory.modules.product.dto.request.ProductUomRequest;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.product.dto.request.ProductUomFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductUomResponse;
import com.erp.inventory.modules.product.service.ProductUomService;
import com.erp.inventory.modules.product.mapper.ProductUomMapper;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.common.exception.BusinessValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductUomServiceImpl implements ProductUomService {

    private final ProductUomRepository repository;
    private final ProductUomMapper mapper;
    private final ProductRepository productRepository;
    private final UnitOfMeasureRepository uomRepository;

    @Override
    public ProductUomResponse create(ProductUomRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductUom creation for company: {}", company);
        log.debug("ProductUom creation payload: {}", request);
        
        validateRequest(request, company, null);
        
        var entity = mapper.toEntity(request);
        entity.setCompanyId(company);
        entity = repository.save(entity);
        log.info("Successfully created ProductUom with id: {}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    public ProductUomResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching ProductUom with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ProductUom not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductUom not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<ProductUomResponse> getAll(ProductUomFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching ProductUom list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    @Override
    public ProductUomResponse update(UUID id, ProductUomRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductUom update for id: {} and company: {}", id, company);
        log.debug("ProductUom update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. ProductUom not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductUom not found with id: " + id);
                });
                
        validateRequest(request, entity.getCompanyId(), id);
        
        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        log.info("Successfully updated ProductUom with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of ProductUom with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. ProductUom not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("ProductUom not found with id: " + id);
        }
        repository.deleteById(id);
        log.info("Successfully deleted ProductUom with id: {}", id);
    }

    private void validateRequest(ProductUomRequest request, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getProductId() != null) {
            if (productRepository.findByIdAndCompanyId(request.getProductId(), company).isEmpty()) {
                log.warn("Validation failed: Product with id {} not found for company: {}", request.getProductId(), company);
                throw new BusinessValidationException("Product not found.");
            }
        }
        
        if (request.getUomId() != null) {
            if (uomRepository.findByIdAndCompanyId(request.getUomId(), company).isEmpty()) {
                log.warn("Validation failed: Unit of Measure with id {} not found for company: {}", request.getUomId(), company);
                throw new BusinessValidationException("Unit of Measure not found.");
            }
        }
        
        if (request.getProductId() != null && request.getUomId() != null) {
            boolean exists = repository.existsByProductIdAndUomIdAndCompanyId(request.getProductId(), request.getUomId(), company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(pu -> pu.getProductId().equals(request.getProductId()) && pu.getUomId().equals(request.getUomId()))
                    .orElse(false))) {
                log.warn("Validation failed: Product UOM mapping already exists for product {} and UOM {}", request.getProductId(), request.getUomId());
                throw new BusinessValidationException("This Unit of Measure is already mapped to the selected product.");
            }
        }
    }
}
