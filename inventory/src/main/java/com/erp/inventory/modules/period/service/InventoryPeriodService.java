package com.erp.inventory.modules.period.service;

import com.erp.inventory.modules.period.dto.request.InventoryPeriodRequest;
import com.erp.inventory.modules.period.dto.request.InventoryPeriodFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventoryPeriodResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InventoryPeriodService {

    InventoryPeriodResponse create(InventoryPeriodRequest request, UUID companyId);

    InventoryPeriodResponse getById(UUID id, UUID companyId);

    Page<InventoryPeriodResponse> getAll(InventoryPeriodFilterRequest filter, Pageable pageable, UUID companyId);

    InventoryPeriodResponse update(UUID id, InventoryPeriodRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);

    void validateTransactionDate(java.time.LocalDate transactionDate, UUID companyId);
}
