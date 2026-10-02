package com.erp.inventory.modules.period.service.serviceImpl;

import com.erp.inventory.modules.period.dto.request.InventoryPeriodRequest;
import com.erp.inventory.modules.period.dto.request.InventoryPeriodFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventoryPeriodResponse;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.period.mapper.InventoryPeriodMapper;
import com.erp.inventory.modules.period.repository.InventoryPeriodRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryPeriodServiceImpl implements InventoryPeriodService {

    private final InventoryPeriodRepository repository;
    private final InventoryPeriodMapper mapper;

    @Override
    public InventoryPeriodResponse create(InventoryPeriodRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null) throw new com.erp.inventory.common.exception.BusinessValidationException("Company ID is required");
        validateDates(request.getStartDate(), request.getEndDate());

        if (repository.existsByPeriodNameIgnoreCaseAndCompanyId(request.getPeriodName(), company)) {
            throw new com.erp.inventory.common.exception.ConflictException("Duplicate period name: " + request.getPeriodName());
        }

        long overlaps = repository.countOverlappingPeriods(company, request.getStartDate(), request.getEndDate(), UUID.randomUUID());
        if (overlaps > 0) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Period dates overlap with an existing period.");
        }

        var entity = mapper.toEntity(request);
        entity.setCompanyId(company);
        entity.setStatus(com.erp.inventory.modules.product.enums.InventoryPeriodStatus.OPEN.name());
        
        entity = repository.save(entity);
        return mapper.toResponse(entity);
    }

    @Override
    public InventoryPeriodResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new com.erp.inventory.common.exception.ResourceNotFoundException("Period not found with id: " + id));
        return mapper.toResponse(entity);
    }

    @Override
    public Page<InventoryPeriodResponse> getAll(InventoryPeriodFilterRequest filter, Pageable pageable, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        // Simple findAllByCompanyId for now
        // In real impl, would use Specification with filter.
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    @Override
    public InventoryPeriodResponse update(UUID id, InventoryPeriodRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null) throw new com.erp.inventory.common.exception.BusinessValidationException("Company ID is required");
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new com.erp.inventory.common.exception.ResourceNotFoundException("Period not found with id: " + id));

        if ("CLOSED".equals(entity.getStatus()) || "LOCKED".equals(entity.getStatus())) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Cannot update a closed or locked period.");
        }

        validateDates(request.getStartDate(), request.getEndDate());
        long overlaps = repository.countOverlappingPeriods(company, request.getStartDate(), request.getEndDate(), id);
        if (overlaps > 0) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Period dates overlap with an existing period.");
        }

        mapper.updateEntityFromRequest(request, entity);
        entity = repository.save(entity);
        return mapper.toResponse(entity);
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new com.erp.inventory.common.exception.ResourceNotFoundException("Period not found with id: " + id));
        if (!com.erp.inventory.modules.product.enums.InventoryPeriodStatus.OPEN.name().equals(entity.getStatus())) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Cannot delete a closed or locked period.");
        }
        repository.delete(entity);
    }

    @Override
    public void validateTransactionDate(java.time.LocalDate transactionDate, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (transactionDate == null) return;
        repository.findByCompanyIdAndDate(company, transactionDate).ifPresent(period -> {
            if ("CLOSED".equals(period.getStatus()) || "LOCKED".equals(period.getStatus())) {
                throw new com.erp.inventory.common.exception.BusinessValidationException(
                        "Transaction date " + transactionDate + " falls in a CLOSED/LOCKED accounting period: " + period.getPeriodName());
            }
        });
    }

    private void validateDates(java.time.LocalDate startDate, java.time.LocalDate endDate) {
        if (startDate == null) throw new com.erp.inventory.common.exception.BusinessValidationException("Start date is required.");
        if (endDate == null) throw new com.erp.inventory.common.exception.BusinessValidationException("End date is required.");
        if (startDate.isAfter(endDate)) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Start date cannot be after end date.");
        }
    }
}
