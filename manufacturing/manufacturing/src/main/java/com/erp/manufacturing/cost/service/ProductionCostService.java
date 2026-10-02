package com.erp.manufacturing.cost.service;

import com.erp.manufacturing.cost.entity.ProductionCost;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;

public interface ProductionCostService {
    Optional<ProductionCost> getById(UUID id);
    List<ProductionCost> getAll();
    void delete(UUID id);
    ProductionCost calculate(UUID productionOrderId, UUID companyId, boolean finalize);
}
