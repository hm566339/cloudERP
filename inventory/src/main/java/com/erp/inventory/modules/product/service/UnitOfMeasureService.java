package com.erp.inventory.modules.product.service;

import com.erp.inventory.modules.product.dto.request.UnitOfMeasureRequest;
import com.erp.inventory.modules.product.dto.request.UnitOfMeasureFilterRequest;
import com.erp.inventory.modules.product.dto.response.UnitOfMeasureResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UnitOfMeasureService {

    UnitOfMeasureResponse create(UnitOfMeasureRequest request, UUID companyId);

    UnitOfMeasureResponse getById(UUID id, UUID companyId);

    Page<UnitOfMeasureResponse> getAll(UnitOfMeasureFilterRequest filter, UUID companyId, Pageable pageable);

    UnitOfMeasureResponse update(UUID id, UnitOfMeasureRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
