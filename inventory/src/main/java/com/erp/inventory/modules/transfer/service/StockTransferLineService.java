package com.erp.inventory.modules.transfer.service;

import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferLineResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface StockTransferLineService {

    StockTransferLineResponse create(StockTransferLineRequest request);

    StockTransferLineResponse getById(UUID id, UUID companyId);

    Page<StockTransferLineResponse> getAll(StockTransferLineFilterRequest filter, UUID companyId, Pageable pageable);

    StockTransferLineResponse update(UUID id, StockTransferLineRequest request);

    void delete(UUID id);
}
