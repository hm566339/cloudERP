package com.erp.inventory.modules.warehouse.service.serviceImpl;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseResponse;
import com.erp.inventory.modules.warehouse.service.WarehouseService;
import com.erp.inventory.modules.warehouse.mapper.WarehouseMapper;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.common.exception.ResourceNotFoundException;
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
@Transactional
@Slf4j
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository repository;
    private final WarehouseMapper mapper;
    private final com.erp.inventory.modules.stock.repository.InventoryStockRepository stockRepository;
    private final com.erp.inventory.modules.stock.repository.StockMovementLineRepository movementLineRepository;
    private final com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository locationRepository;

    @Override
    public WarehouseResponse create(WarehouseRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating Warehouse creation");
        log.debug("Warehouse creation payload: {}", request);
        
        if (request.getWarehouseName() == null || request.getWarehouseName().trim().isEmpty()) {
            throw new BusinessValidationException("Warehouse name is required");
        }
        
        var entity = mapper.toEntity(request);
        entity.setWarehouseCode(generateWarehouseCode(request.getWarehouseName(), company));
        log.info("Auto-generated Warehouse Code: {}", entity.getWarehouseCode());
        entity.setCompanyId(company);
        validateCodeUniqueness(entity.getWarehouseCode(), company, null);
        
        try {
            entity = repository.save(entity);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessValidationException("Warehouse code already exists");
        }
        
        log.info("Successfully created Warehouse with id: {}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    public WarehouseResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching Warehouse with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Warehouse not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("Warehouse not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<WarehouseResponse> getAll(WarehouseFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching Warehouse list with filter: {}, company: {}, pageable: {}", filter, company, pageable);
        return repository.findAll(com.erp.inventory.modules.warehouse.repository.WarehouseSpecification.withFilter(filter, company), pageable).map(mapper::toResponse);
    }

    @Override
    public WarehouseResponse update(UUID id, WarehouseRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating Warehouse update for id: {} and company: {}", id, company);
        log.debug("Warehouse update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. Warehouse not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("Warehouse not found with id: " + id);
                });
                
        // Validation checks
        if (request.getWarehouseName() == null || request.getWarehouseName().trim().isEmpty()) {
            throw new BusinessValidationException("Warehouse name is required");
        }
                
        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        log.info("Successfully updated Warehouse with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of Warehouse with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. Warehouse not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("Warehouse not found with id: " + id);
        }
        
        if (locationRepository.existsByWarehouseIdAndCompanyId(id, company)) {
            throw new BusinessValidationException("Warehouse cannot be deleted because it has associated locations.");
        }
        if (stockRepository.existsByWarehouseIdAndCompanyId(id, company)) {
            throw new BusinessValidationException("Warehouse cannot be deleted because it is already used in inventory stock records.");
        }
        if (movementLineRepository.existsByWarehouseIdAndCompanyId(id, company)) {
            throw new BusinessValidationException("Warehouse cannot be deleted because it is already used in stock movement records.");
        }

        repository.deleteById(id);
        log.info("Successfully deleted Warehouse with id: {}", id);
    }

    private void validateCodeUniqueness(String code, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (code != null) {
            boolean exists = repository.existsByWarehouseCodeAndCompanyId(code, company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(w -> w.getWarehouseCode().equals(code)).orElse(false))) {
                log.warn("Validation failed: Warehouse with code {} already exists for company: {}", code, company);
                throw new BusinessValidationException(
                        "Warehouse with code " + code + " already exists.");
            }
        }
    }

    private String generateWarehouseCode(String name, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "WAR";
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
        
        int retryCount = 0;
        int maxRetries = 100;
        while (retryCount < maxRetries) {
            try {
                if (!repository.existsByWarehouseCodeAndCompanyId(generatedCode, company)) {
                    return generatedCode;
                }
            } catch (Exception e) {
                log.warn("Error while checking unique code: {}", e.getMessage());
            }
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
            retryCount++;
        }
        
        throw new BusinessValidationException("Could not generate a unique warehouse code after " + maxRetries + " attempts");
    }
}
