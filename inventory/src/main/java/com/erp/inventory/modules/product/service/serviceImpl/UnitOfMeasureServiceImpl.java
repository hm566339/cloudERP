package com.erp.inventory.modules.product.service.serviceImpl;

import com.erp.inventory.modules.product.dto.request.UnitOfMeasureRequest;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.product.dto.request.UnitOfMeasureFilterRequest;
import com.erp.inventory.modules.product.dto.response.UnitOfMeasureResponse;
import com.erp.inventory.modules.product.service.UnitOfMeasureService;
import com.erp.inventory.modules.product.mapper.UnitOfMeasureMapper;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

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
public class UnitOfMeasureServiceImpl implements UnitOfMeasureService {

    private final UnitOfMeasureRepository repository;
    private final UnitOfMeasureMapper mapper;

    @Override
    public UnitOfMeasureResponse create(UnitOfMeasureRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("ActionLog.createUnitOfMeasure.start - company: {}", company);
        
        validateRequest(request);
        
        try {
            var entity = mapper.toEntity(request);
            entity.setCode(generateUomCode(request.getName(), company));
            log.info("Auto-generated UOM Code: {}", entity.getCode());
            entity.setCompanyId(company);
            entity = repository.save(entity);
            log.info("ActionLog.createUnitOfMeasure.success - entityId: {}, company: {}", entity.getId(), company);
            return mapper.toResponse(entity);
        } catch (Exception e) {
            log.error("ActionLog.createUnitOfMeasure.error - failed to create unit of measure. Error: {}", e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public UnitOfMeasureResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("ActionLog.getUnitOfMeasureById.start - id: {}, company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ActionLog.getUnitOfMeasureById.notFound - id: {}, company: {}", id, company);
                    return new ResourceNotFoundException("UnitOfMeasure not found with id: " + id);
                });
        log.debug("ActionLog.getUnitOfMeasureById.success - id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public Page<UnitOfMeasureResponse> getAll(UnitOfMeasureFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("ActionLog.getAllUnitOfMeasures.start - company: {}, page: {}, size: {}", company, pageable.getPageNumber(), pageable.getPageSize());
        var page = repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
        log.debug("ActionLog.getAllUnitOfMeasures.success - totalElements: {}", page.getTotalElements());
        return page;
    }

    @Override
    public UnitOfMeasureResponse update(UUID id, UnitOfMeasureRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("ActionLog.updateUnitOfMeasure.start - id: {}, company: {}", id, company);
        validateRequest(request);
        
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("ActionLog.updateUnitOfMeasure.notFound - id: {}, company: {}", id, company);
                    return new ResourceNotFoundException("UnitOfMeasure not found with id: " + id);
                });

        try {
            mapper.updateEntityFromRequest(request, entity);
            entity = repository.save(entity);
            log.info("ActionLog.updateUnitOfMeasure.success - id: {}", id);
            return mapper.toResponse(entity);
        } catch (Exception e) {
            log.error("ActionLog.updateUnitOfMeasure.error - failed to update unit of measure with id: {}. Error: {}", id, e.getMessage(), e);
            throw e;
        }
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("ActionLog.deleteUnitOfMeasure.start - id: {}, company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("ActionLog.deleteUnitOfMeasure.notFound - id: {}, company: {}", id, company);
            throw new ResourceNotFoundException("UnitOfMeasure not found with id: " + id);
        }
        
        try {
            repository.deleteById(id);
            log.info("ActionLog.deleteUnitOfMeasure.success - id: {}", id);
        } catch (Exception e) {
            log.error("ActionLog.deleteUnitOfMeasure.error - failed to delete unit of measure with id: {}. Error: {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    private void validateRequest(UnitOfMeasureRequest request) {
        if (request == null) {
            log.error("ActionLog.validateRequest.failed - Request cannot be null");
            throw new BusinessValidationException("Unit of Measure request cannot be null");
        }
        if (!StringUtils.hasText(request.getName())) {
            log.error("ActionLog.validateRequest.failed - Name is empty or null");
            throw new BusinessValidationException("Unit of Measure name is required");
        }
    }

    private String generateUomCode(String name, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "UOM";
        if (StringUtils.hasText(name)) {
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
