package com.erp.inventory.modules.openingstock.service;

import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockFilterRequest;
import com.erp.inventory.modules.openingstock.dto.response.OpeningStockResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface OpeningStockService {

    OpeningStockResponse create(OpeningStockRequest request, UUID companyId);

    OpeningStockResponse getById(UUID id, UUID companyId);

    Page<OpeningStockResponse> getAll(OpeningStockFilterRequest filter, Pageable pageable, UUID companyId);
}
