package com.erp.inventory.modules.period.service;

import com.erp.inventory.modules.period.dto.request.InventorySnapshotRequest;
import com.erp.inventory.modules.period.dto.request.InventorySnapshotFilterRequest;
import com.erp.inventory.modules.period.dto.response.InventorySnapshotResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface InventorySnapshotService {

    List<InventorySnapshotResponse> create(InventorySnapshotRequest request, UUID companyId);

    InventorySnapshotResponse getById(UUID id, UUID companyId);

    Page<InventorySnapshotResponse> getAll(InventorySnapshotFilterRequest filter, Pageable pageable, UUID companyId);

    InventorySnapshotResponse update(UUID id, InventorySnapshotRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
