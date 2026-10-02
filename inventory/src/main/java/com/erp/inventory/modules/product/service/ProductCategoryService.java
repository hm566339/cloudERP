package com.erp.inventory.modules.product.service;

import com.erp.inventory.modules.product.dto.request.ProductCategoryRequest;
import com.erp.inventory.modules.product.dto.request.ProductCategoryFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductCategoryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductCategoryService {

    ProductCategoryResponse create(ProductCategoryRequest request, UUID companyId);

    ProductCategoryResponse getById(UUID id, UUID companyId);

    Page<ProductCategoryResponse> getAll(ProductCategoryFilterRequest filter, UUID companyId, Pageable pageable);

    ProductCategoryResponse update(UUID id, ProductCategoryRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
