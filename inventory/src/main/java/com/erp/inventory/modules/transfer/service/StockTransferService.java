package com.erp.inventory.modules.transfer.service;

import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockTransferService {

    StockTransferResponse create(StockTransferRequest request, UUID companyId);

    StockTransferResponse getById(UUID id, UUID companyId);

    Page<StockTransferResponse> getAll(StockTransferFilterRequest filter, UUID companyId, Pageable pageable);

    StockTransferResponse reverse(UUID id, UUID companyId);
}
