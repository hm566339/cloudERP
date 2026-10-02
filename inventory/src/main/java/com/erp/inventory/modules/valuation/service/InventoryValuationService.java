package com.erp.inventory.modules.valuation.service;

import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationFilterRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryValuationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface InventoryValuationService {
    InventoryValuationResponse create(InventoryValuationRequest request, UUID companyId);
    InventoryValuationResponse getById(UUID id, UUID companyId);
    Page<InventoryValuationResponse> getAll(InventoryValuationFilterRequest filter, UUID companyId, Pageable pageable);
    InventoryValuationResponse update(UUID id, InventoryValuationRequest request, UUID companyId);
    void delete(UUID id, UUID companyId);
}
