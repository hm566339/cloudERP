package com.erp.inventory.modules.stock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.stock.dto.request.StockMovementLineRequest;
import com.erp.inventory.modules.stock.dto.request.StockMovementLineFilterRequest;
import com.erp.inventory.modules.stock.dto.response.StockMovementLineResponse;
import com.erp.inventory.modules.stock.service.StockMovementLineService;
import com.erp.inventory.modules.stock.mapper.StockMovementLineMapper;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
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
public class StockMovementLineServiceImpl implements StockMovementLineService {

    private final StockMovementLineRepository repository;
    private final StockMovementLineMapper mapper;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public StockMovementLineResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (company == null) throw new BusinessValidationException("Company ID is required");
        log.debug("Fetching StockMovementLine with id: {} and company: {}", id, company);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> {
                    log.warn("StockMovementLine not found with id: {} and company: {}", id, company);
                    return new ResourceNotFoundException("StockMovementLine not found with id: " + id);
                });
        return mapper.toResponse(entity);
    }

    @Override
    public Page<StockMovementLineResponse> getAll(StockMovementLineFilterRequest filter, Pageable pageable) {
        log.debug("Fetching StockMovementLine list with filter: {}, pageable: {}", filter, pageable);
        UUID company = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());
        if (company == null) throw new BusinessValidationException("Company ID is required");
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    private void validateRequest(StockMovementLineRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        if (request.getStockMovementId() != null) {
            stockMovementRepository.findByIdAndCompanyId(request.getStockMovementId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: StockMovement not found with id: {}", request.getStockMovementId());
                        return new BusinessValidationException("StockMovement not found with id: " + request.getStockMovementId());
                    });
        }
        
        if (request.getProductId() != null) {
            productRepository.findByIdAndCompanyId(request.getProductId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Product not found with id: {}", request.getProductId());
                        return new BusinessValidationException("Product not found with id: " + request.getProductId());
                    });
        }

        if (request.getSourceWarehouseId() != null) {
            warehouseRepository.findByIdAndCompanyId(request.getSourceWarehouseId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Source Warehouse not found with id: {}", request.getSourceWarehouseId());
                        return new BusinessValidationException("Source Warehouse not found with id: " + request.getSourceWarehouseId());
                    });
        }

        if (request.getDestinationWarehouseId() != null) {
            warehouseRepository.findByIdAndCompanyId(request.getDestinationWarehouseId(), company)
                    .orElseThrow(() -> {
                        log.warn("Validation failed: Destination Warehouse not found with id: {}", request.getDestinationWarehouseId());
                        return new BusinessValidationException("Destination Warehouse not found with id: " + request.getDestinationWarehouseId());
                    });
        }
    }
}
