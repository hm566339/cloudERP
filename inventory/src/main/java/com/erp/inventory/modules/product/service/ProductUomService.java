package com.erp.inventory.modules.product.service;

import com.erp.inventory.modules.product.dto.request.ProductUomRequest;
import com.erp.inventory.modules.product.dto.request.ProductUomFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductUomResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductUomService {

    ProductUomResponse create(ProductUomRequest request, UUID companyId);

    ProductUomResponse getById(UUID id, UUID companyId);

    Page<ProductUomResponse> getAll(ProductUomFilterRequest filter, UUID companyId, Pageable pageable);

    ProductUomResponse update(UUID id, ProductUomRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
