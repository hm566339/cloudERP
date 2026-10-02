package com.erp.inventory.modules.product.service.serviceImpl;

import com.erp.inventory.modules.product.dto.request.ProductCategoryRequest;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.product.dto.request.ProductCategoryFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductCategoryResponse;
import com.erp.inventory.modules.product.service.ProductCategoryService;
import com.erp.inventory.modules.product.mapper.ProductCategoryMapper;
import com.erp.inventory.modules.product.repository.ProductCategoryRepository;
import com.erp.inventory.common.exception.BusinessValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ProductCategoryServiceImpl implements ProductCategoryService {

    private final ProductCategoryRepository repository;
    private final ProductCategoryMapper mapper;

    @Override
    public ProductCategoryResponse create(ProductCategoryRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductCategory creation for company: {}", company);
        log.debug("ProductCategory creation payload: {}", request);
        
        validateRequest(request, company, null);
        var entity = mapper.toEntity(request);
        entity.setCode(generateCategoryCode(request.getName(), company));
        log.info("Auto-generated Category Code: {}", entity.getCode());
        
        validateCodeUniqueness(entity.getCode(), company, null);
        
        entity.setCompanyId(company);
        entity = repository.save(entity);
        log.info("Successfully created ProductCategory with id: {}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    public ProductCategoryResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching ProductCategory with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ProductCategory not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductCategory not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<ProductCategoryResponse> getAll(ProductCategoryFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching ProductCategory list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    @Override
    public ProductCategoryResponse update(UUID id, ProductCategoryRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating ProductCategory update for id: {} and company: {}", id, company);
        log.debug("ProductCategory update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. ProductCategory not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("ProductCategory not found with id: " + id);
                });
        validateRequest(request, entity.getCompanyId(), id);
        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        log.info("Successfully updated ProductCategory with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of ProductCategory with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. ProductCategory not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("ProductCategory not found with id: " + id);
        }
        repository.deleteById(id);
        log.info("Successfully deleted ProductCategory with id: {}", id);
    }

    private void validateRequest(ProductCategoryRequest request, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getParentCategoryId() != null) {
            if (currentId != null && request.getParentCategoryId().equals(currentId)) {
                log.warn("Validation failed: Category cannot be its own parent. id: {}", currentId);
                throw new BusinessValidationException("Category cannot be its own parent.");
            }
            
            var parent = repository.findByIdAndCompanyId(request.getParentCategoryId(), company);
            if (parent.isEmpty()) {
                log.warn("Validation failed: Parent category with id {} not found for company: {}", request.getParentCategoryId(), company);
                throw new BusinessValidationException("Parent category not found.");
            }
        }
        
        validateNameUniqueness(request.getName(), company, currentId);
    }

    private void validateNameUniqueness(String name, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (name != null) {
            boolean exists = repository.existsByNameIgnoreCaseAndCompanyId(name, company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(c -> c.getName().equalsIgnoreCase(name)).orElse(false))) {
                log.warn("Validation failed: Category with name '{}' already exists for company: {}", name, company);
                throw new BusinessValidationException("Category with name '" + name + "' already exists.");
            }
        }
    }

    private void validateCodeUniqueness(String code, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (code != null) {
            boolean exists = repository.existsByCodeAndCompanyId(code, company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(c -> c.getCode().equals(code)).orElse(false))) {
                log.warn("Validation failed: Category with code {} already exists for company: {}", code, company);
                throw new BusinessValidationException("Category with code " + code + " already exists.");
            }
        }
    }

    private String generateCategoryCode(String name, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "CAT";
        if (name != null && !name.trim().isEmpty()) {
            String cleanName = name.replaceAll("\\s+", "");
            if (cleanName.length() >= 3) {
                prefix = cleanName.substring(0, 3).toUpperCase();
            } else {
                prefix = cleanName.toUpperCase();
            }
        }
        LocalDate now = LocalDate.now();
        String datePart = String.format("%02d%02d", now.getMonthValue(), now.getYear() % 100);
        String baseCode = prefix + datePart;
        
        String generatedCode = baseCode + "001";
        int counter = 1;
        while (repository.existsByCodeAndCompanyId(generatedCode, company)) {
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
        }
        return generatedCode;
    }
}
