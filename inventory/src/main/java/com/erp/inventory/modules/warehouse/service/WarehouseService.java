package com.erp.inventory.modules.warehouse.service;

import com.erp.inventory.modules.warehouse.dto.request.WarehouseRequest;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseFilterRequest;
import com.erp.inventory.modules.warehouse.dto.response.WarehouseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WarehouseService {

    WarehouseResponse create(WarehouseRequest request, UUID companyId);

    WarehouseResponse getById(UUID id, UUID companyId);

    Page<WarehouseResponse> getAll(WarehouseFilterRequest filter, UUID companyId, Pageable pageable);

    WarehouseResponse update(UUID id, WarehouseRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
