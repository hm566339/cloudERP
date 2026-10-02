package com.erp.inventory.modules.batch.service;

import com.erp.inventory.modules.batch.dto.request.ProductBatchRequest;
import com.erp.inventory.modules.batch.dto.request.ProductBatchFilterRequest;
import com.erp.inventory.modules.batch.dto.response.ProductBatchResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductBatchService {

    ProductBatchResponse create(ProductBatchRequest request, UUID companyId);

    ProductBatchResponse getById(UUID id, UUID companyId);

    Page<ProductBatchResponse> getAll(ProductBatchFilterRequest filter, UUID companyId, Pageable pageable);

    ProductBatchResponse update(UUID id, ProductBatchRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
