package com.erp.inventory.modules.transfer.service.serviceImpl;

import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineFilterRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferLineResponse;
import com.erp.inventory.modules.transfer.service.StockTransferLineService;
import com.erp.inventory.modules.transfer.mapper.StockTransferLineMapper;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.List;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
@Transactional
public class StockTransferLineServiceImpl implements StockTransferLineService {

    private final StockTransferLineRepository repository;
    private final StockTransferLineMapper mapper;

    @Override
    public StockTransferLineResponse create(StockTransferLineRequest request) {
        throw new com.erp.inventory.common.exception.BusinessValidationException("Direct creation of stock transfer line is not permitted. Create the line through StockTransfer.");
    }

    @Override
    public StockTransferLineResponse getById(UUID id, UUID companyId) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        StockTransferLine entity = repository.findByIdAndCompanyId(id, company)
                .orElseThrow(() -> new com.erp.inventory.common.exception.ResourceNotFoundException("Stock Transfer Line not found"));
        return mapper.toResponse(entity);
    }

    @Override
    public Page<StockTransferLineResponse> getAll(StockTransferLineFilterRequest filter, UUID companyId, Pageable pageable) {
        UUID company = TenantUtils.resolveCompanyIdForQuery(companyId);
        // Implement minimal fallback filtering
        List<StockTransferLineResponse> responses = repository.findAllByCompanyId(company).stream()
                .map(mapper::toResponse)
                .toList();
        return new org.springframework.data.domain.PageImpl<>(responses, pageable, responses.size());
    }

    @Override
    public StockTransferLineResponse update(UUID id, StockTransferLineRequest request) {
        throw new com.erp.inventory.common.exception.BusinessValidationException("Direct update of stock transfer line is not permitted. Stock transfer lines are immutable after creation.");
    }

    @Override
    public void delete(UUID id) {
        throw new com.erp.inventory.common.exception.BusinessValidationException("Direct deletion of stock transfer line is not permitted. Stock transfer history must be preserved.");
    }
}
