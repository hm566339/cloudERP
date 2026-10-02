package com.erp.inventory.modules.period.service.serviceImpl;

import com.erp.inventory.modules.period.dto.request.InventorySnapshotRequest;
import com.erp.inventory.modules.period.dto.request.InventorySnapshotFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventorySnapshotResponse;
import com.erp.inventory.modules.period.service.InventorySnapshotService;
import com.erp.inventory.modules.period.mapper.InventorySnapshotMapper;
import com.erp.inventory.modules.period.repository.InventorySnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class InventorySnapshotServiceImpl implements InventorySnapshotService {

    private final InventorySnapshotRepository repository;
    private final InventorySnapshotMapper mapper;
    private final com.erp.inventory.modules.stock.repository.InventoryStockRepository stockRepository;

    @Override
    public java.util.List<InventorySnapshotResponse> create(InventorySnapshotRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);

        if (request.getSnapshotDate() == null) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Snapshot Date is required");
        }
        if (request.getSnapshotScope() == null || request.getSnapshotScope().trim().isEmpty()) {
            throw new com.erp.inventory.common.exception.BusinessValidationException("Snapshot Scope is required");
        }

        // Duplicate check
        if (repository.existsByCompanyIdAndSnapshotScopeAndSnapshotDate(company, request.getSnapshotScope(), request.getSnapshotDate())) {
            throw new com.erp.inventory.common.exception.BusinessValidationException(
                    "Snapshot with scope " + request.getSnapshotScope() + " and date " + request.getSnapshotDate() + " already exists for this company");
        }

        // Read active InventoryStock records
        java.util.List<com.erp.inventory.modules.stock.entity.InventoryStock> stocks = stockRepository
                .findAllByCompanyId(company);

        java.util.List<com.erp.inventory.modules.period.entity.InventorySnapshot> snapshotsToSave = new java.util.ArrayList<>();

        for (com.erp.inventory.modules.stock.entity.InventoryStock stock : stocks) {
            java.math.BigDecimal qty = stock.getQuantity() != null ? stock.getQuantity() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal resQty = stock.getReservedQuantity() != null ? stock.getReservedQuantity()
                    : java.math.BigDecimal.ZERO;
            java.math.BigDecimal avgCost = stock.getAverageCost() != null ? stock.getAverageCost()
                    : java.math.BigDecimal.ZERO;
            BigDecimal stockVal = stock.getStockValue() != null ? stock.getStockValue() : java.math.BigDecimal.ZERO;

            if (qty.compareTo(java.math.BigDecimal.ZERO) < 0 || resQty.compareTo(java.math.BigDecimal.ZERO) < 0) {
                throw new com.erp.inventory.common.exception.BusinessValidationException(
                        "Negative quantity found for stock ID: " + stock.getId());
            }

            // Consistency check: stockValue == quantity * averageCost
            java.math.BigDecimal expectedStockValue = qty.multiply(avgCost).setScale(4, java.math.RoundingMode.HALF_UP);
            java.math.BigDecimal currentStockValue = stockVal.setScale(4, java.math.RoundingMode.HALF_UP);

            if (expectedStockValue.compareTo(currentStockValue) != 0) {
                throw new com.erp.inventory.common.exception.BusinessValidationException(
                        "Inconsistent InventoryStock found (ID: " + stock.getId() +
                                "). Expected stockValue=" + expectedStockValue + ", but got=" + currentStockValue);
            }

            com.erp.inventory.modules.period.entity.InventorySnapshot snapshot = new com.erp.inventory.modules.period.entity.InventorySnapshot();
            snapshot.setCompanyId(company);
            snapshot.setSnapshotScope(request.getSnapshotScope());
            snapshot.setSnapshotDate(request.getSnapshotDate());
            snapshot.setProductId(stock.getProductId());
            snapshot.setWarehouseId(stock.getWarehouseId());
            snapshot.setLocationId(stock.getLocationId());
            snapshot.setBatchId(stock.getBatchId());
            snapshot.setQuantity(qty);
            snapshot.setReservedQuantity(resQty);
            snapshot.setAvailableQuantity(stock.getAvailableQuantity());
            snapshot.setAverageCost(avgCost);
            snapshot.setStockValue(stockVal);

            snapshotsToSave.add(snapshot);
        }

        java.util.List<com.erp.inventory.modules.period.entity.InventorySnapshot> savedSnapshots = repository
                .saveAll(snapshotsToSave);
        return mapper.toResponseList(savedSnapshots);
    }

    @Override
    public InventorySnapshotResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        var entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new com.erp.inventory.common.exception.ResourceNotFoundException(
                        "Snapshot not found with id: " + id));
        return mapper.toResponse(entity);
    }

    @Override
    public Page<InventorySnapshotResponse> getAll(InventorySnapshotFilterRequest filter, Pageable pageable, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        // For E2E we usually use repository.findAllByCompanyId(company, pageable) or filter if needed.
        // We'll use repository.findAllByCompanyId(company, pageable) and map it.
        return repository.findAllByCompanyId(company, pageable).map(mapper::toResponse);
    }

    @Override
    public InventorySnapshotResponse update(UUID id, InventorySnapshotRequest request, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        throw new com.erp.inventory.common.exception.BusinessValidationException("Direct update of snapshot is not permitted.");
    }

    @Override
    public void delete(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        throw new com.erp.inventory.common.exception.BusinessValidationException("Direct deletion of snapshot is not permitted.");
    }
}
