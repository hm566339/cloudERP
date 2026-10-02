package com.erp.inventory.modules.stock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.stock.dto.request.StockMovementRequest;
import com.erp.inventory.modules.stock.dto.request.StockMovementFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementResponse;
import com.erp.inventory.modules.stock.service.StockMovementService;
import com.erp.inventory.modules.stock.mapper.StockMovementMapper;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.StockMovementSpecification;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockMovementServiceImpl implements StockMovementService {

    private final StockMovementRepository repository;
    private final StockMovementMapper mapper;

    @Override
    public StockMovementResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null)
            throw new BusinessValidationException("Company ID is required");
        log.debug("Fetching StockMovement with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("StockMovement not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("StockMovement not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<StockMovementResponse> getAll(StockMovementFilterRequest filter, Pageable pageable, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null)
            throw new BusinessValidationException("Company ID is required");
        log.debug("Fetching StockMovement list with filter: {}, pageable: {}", filter, pageable);
        Specification<StockMovement> spec = StockMovementSpecification.getFilterSpecification(filter, company);
        return repository.findAll(spec, pageable).map(mapper::toResponse);
    }

    private void validateRequest(StockMovementRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getMovementDate() != null && request.getPostedAt() != null) {
            if (request.getPostedAt().isBefore(request.getMovementDate())) {
                log.warn("Validation failed: Posted at date {} is before movement date {}", request.getPostedAt(),
                        request.getMovementDate());
                throw new BusinessValidationException("Posted at date cannot be before movement date");
            }
        }

        if (request.getReversedMovementId() != null) {
            boolean exists = repository.findByIdAndCompanyId(request.getReversedMovementId(), company).isPresent();
            if (!exists) {
                log.warn("Validation failed: Reversed StockMovement not found with id: {}",
                        request.getReversedMovementId());
                throw new BusinessValidationException(
                        "Reversed StockMovement not found with id: " + request.getReversedMovementId());
            }
        }
    }
}
