package com.erp.inventory.modules.warehouse.service;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseLocationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WarehouseLocationService {

    WarehouseLocationResponse create(WarehouseLocationRequest request, UUID companyId);

    WarehouseLocationResponse getById(UUID id, UUID companyId);

    Page<WarehouseLocationResponse> getAll(WarehouseLocationFilterRequest filter, UUID companyId, Pageable pageable);

    WarehouseLocationResponse update(UUID id, WarehouseLocationRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
