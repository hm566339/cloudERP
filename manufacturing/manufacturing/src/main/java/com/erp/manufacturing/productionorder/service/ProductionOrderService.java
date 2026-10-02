package com.erp.manufacturing.productionorder.service;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionOrderService {
    Optional<ProductionOrder> getById(UUID id);
    List<ProductionOrder> getAll();
    void delete(UUID id);
}
