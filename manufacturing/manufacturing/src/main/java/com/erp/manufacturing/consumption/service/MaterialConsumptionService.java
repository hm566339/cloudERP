package com.erp.manufacturing.consumption.service;

import com.erp.manufacturing.consumption.dto.request.MaterialConsumptionRequest;
import com.erp.manufacturing.consumption.dto.response.MaterialConsumptionResponse;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaterialConsumptionService {
    Optional<MaterialConsumption> getById(UUID id);
    List<MaterialConsumption> getAll();
    void delete(UUID id);
    MaterialConsumptionResponse consumeMaterial(UUID productionOrderId, MaterialConsumptionRequest request, UUID requestCompanyId);
}
