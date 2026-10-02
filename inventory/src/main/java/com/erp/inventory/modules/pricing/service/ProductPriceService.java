package com.erp.inventory.modules.pricing.service;

import com.erp.inventory.modules.pricing.dto.request.ProductPriceRequest;
import com.erp.inventory.modules.pricing.dto.request.ProductPriceFilterRequest;
import com.erp.inventory.modules.pricing.dto.response.ProductPriceResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductPriceService {

    ProductPriceResponse create(ProductPriceRequest request, UUID companyId);

    ProductPriceResponse getById(UUID id, UUID companyId);

    Page<ProductPriceResponse> getAll(ProductPriceFilterRequest filter, UUID companyId, Pageable pageable);

    ProductPriceResponse update(UUID id, ProductPriceRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
