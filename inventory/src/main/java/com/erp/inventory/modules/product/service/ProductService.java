package com.erp.inventory.modules.product.service;

import com.erp.inventory.modules.product.dto.request.ProductRequest;
import com.erp.inventory.modules.product.dto.request.ProductFilterRequest;
import com.erp.inventory.modules.product.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductService {

    ProductResponse create(ProductRequest request, UUID companyId);

    ProductResponse getById(UUID id, UUID companyId);

    com.erp.inventory.modules.product.dto.response.ProductDetailResponse getProductDetailById(UUID id, UUID companyId);

    Page<ProductResponse> getAll(ProductFilterRequest filter, UUID companyId, Pageable pageable);

    ProductResponse update(UUID id, ProductRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
