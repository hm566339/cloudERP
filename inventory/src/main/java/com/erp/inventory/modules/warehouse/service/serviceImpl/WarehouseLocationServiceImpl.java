package com.erp.inventory.modules.warehouse.service.serviceImpl;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseLocationResponse;
import com.erp.inventory.modules.warehouse.service.WarehouseLocationService;
import com.erp.inventory.modules.warehouse.mapper.WarehouseLocationMapper;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationSpecification;
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
public class WarehouseLocationServiceImpl implements WarehouseLocationService {

    private final WarehouseLocationRepository repository;
    private final WarehouseRepository warehouseRepository;
    private final WarehouseLocationMapper mapper;
    private final com.erp.inventory.modules.stock.repository.InventoryStockRepository stockRepository;
    private final com.erp.inventory.modules.stock.repository.StockMovementLineRepository movementLineRepository;

    @Override
    public WarehouseLocationResponse create(WarehouseLocationRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating WarehouseLocation creation");
        log.debug("WarehouseLocation creation payload: {}", request);

        validateRequest(request, company);
        var entity = mapper.toEntity(request);
        entity.setWarehouseId(request.getWarehouseId());
        entity.setParentLocationId(request.getParentLocationId());
        entity.setLocationCode(generateLocationCode(request.getLocationName(), request.getWarehouseId(), company));
        log.info("Auto-generated Location Code: {}", entity.getLocationCode());

        entity.setCompanyId(company);
        validateCodeUniqueness(entity.getLocationCode(), request.getWarehouseId(), company, null);

        try {
            entity = repository.save(entity);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new BusinessValidationException("Location code already exists in this warehouse");
        }

        log.info("Successfully created WarehouseLocation with id: {}", entity.getId());
        return mapper.toResponse(entity);
    }

    @Override
    public WarehouseLocationResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.debug("Fetching WarehouseLocation with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("WarehouseLocation not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("WarehouseLocation not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<WarehouseLocationResponse> getAll(WarehouseLocationFilterRequest filter, UUID companyId,
            Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        log.debug("Fetching WarehouseLocation list with filter: {}, company: {}, pageable: {}", filter, company,
                pageable);
        return repository.findAll(WarehouseLocationSpecification
                .withFilter(filter, company), pageable).map(mapper::toResponse);
    }

    @Override
    public WarehouseLocationResponse update(UUID id, WarehouseLocationRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating WarehouseLocation update for id: {} and company: {}", id, company);
        log.debug("WarehouseLocation update payload: {}", request);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("Failed to update. WarehouseLocation not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("WarehouseLocation not found with id: " + id);
                });

        // Validation check for changing warehouseId
        if (!entity.getWarehouseId().equals(request.getWarehouseId())) {
            // Check if moving is allowed (if used, block it)
            if (stockRepository.existsByLocationIdAndCompanyId(id, company) ||
                    movementLineRepository.existsByLocationIdAndCompanyId(id, company)) {
                throw new BusinessValidationException(
                        "Cannot change warehouse for a location that is already in use by inventory.");
            }
        }

        validateRequest(request, entity.getCompanyId());
        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        log.info("Successfully updated WarehouseLocation with id: {}", id);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        log.info("Initiating deletion of WarehouseLocation with id: {} and company: {}", id, company);
        if (!repository.existsByIdAndCompanyId(id, company)) {
            log.warn("Failed to delete. WarehouseLocation not found with id: {} and company: {}", id, company);
            throw new ResourceNotFoundException("WarehouseLocation not found with id: " + id);
        }

        if (stockRepository.existsByLocationIdAndCompanyId(id, company)) {
            throw new BusinessValidationException(
                    "Warehouse location cannot be deleted because it is already used in inventory stock records.");
        }
        if (movementLineRepository.existsByLocationIdAndCompanyId(id, company)) {
            throw new BusinessValidationException(
                    "Warehouse location cannot be deleted because it is already used in stock movement records.");
        }

        repository.deleteById(id);
        log.info("Successfully deleted WarehouseLocation with id: {}", id);
    }

    private void validateRequest(WarehouseLocationRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getWarehouseId() == null) {
            log.warn("Validation failed: Warehouse ID is required for Location");
            throw new BusinessValidationException("Warehouse ID is required for Location.");
        }

        if (warehouseRepository.findByIdAndCompanyId(request.getWarehouseId(), company).isEmpty()) {
            log.warn("Validation failed: Warehouse with id {} not found for company: {}", request.getWarehouseId(),
                    company);
            throw new BusinessValidationException("Warehouse not found or you don't have permission to access it.");
        }
    }

    private void validateCodeUniqueness(String code, UUID warehouseId, UUID companyId, UUID currentId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (code != null) {
            boolean exists = repository.existsByLocationCodeAndWarehouseIdAndCompanyId(code, warehouseId, company);
            if (exists && (currentId == null || !repository.findByIdAndCompanyId(currentId, company)
                    .map(l -> l.getLocationCode().equals(code)).orElse(false))) {
                log.warn("Validation failed: Location with code {} already exists in warehouse {} for company: {}",
                        code, warehouseId, company);
                throw new BusinessValidationException(
                        "Location with code " + code + " already exists in this warehouse.");
            }
        }
    }

    private String generateLocationCode(String name, UUID warehouseId, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String prefix = "LOC";
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
            if (!repository.existsByLocationCodeAndWarehouseIdAndCompanyId(generatedCode, warehouseId, company)) {
                return generatedCode;
            }
            counter++;
            generatedCode = baseCode + String.format("%03d", counter);
            retryCount++;
        }

        throw new BusinessValidationException(
                "Could not generate a unique location code after " + maxRetries + " attempts");
    }
}
