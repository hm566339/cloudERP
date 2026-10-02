package com.erp.inventory.modules.serial.service;

import com.erp.inventory.modules.serial.dto.request.ProductSerialRequest;
import com.erp.inventory.modules.serial.dto.request.ProductSerialFilterRequest;
import com.erp.inventory.modules.serial.dto.response.ProductSerialResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface ProductSerialService {

    ProductSerialResponse create(ProductSerialRequest request, UUID companyId);

    ProductSerialResponse getById(UUID id, UUID companyId);

    Page<ProductSerialResponse> getAll(ProductSerialFilterRequest filter, UUID companyId, Pageable pageable);

    ProductSerialResponse update(UUID id, ProductSerialRequest request, UUID companyId);

    void delete(UUID id, UUID companyId);
}
