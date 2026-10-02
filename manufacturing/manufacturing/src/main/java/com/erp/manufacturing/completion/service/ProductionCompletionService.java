package com.erp.manufacturing.completion.service;

import com.erp.manufacturing.completion.entity.ProductionCompletion;
import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.dto.ProductionCompletionResponse;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionCompletionService {
    Optional<ProductionCompletion> getById(UUID id);
    List<ProductionCompletion> getAll();
    void delete(UUID id);
    ProductionCompletionResponse complete(UUID productionOrderId, ProductionCompletionRequest request, UUID requestCompanyId);
}
