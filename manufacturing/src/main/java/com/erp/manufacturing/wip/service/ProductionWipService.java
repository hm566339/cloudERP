package com.erp.manufacturing.wip.service;

import com.erp.manufacturing.wip.entity.ProductionWip;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionWipService {
    Optional<ProductionWip> getById(UUID id);
    List<ProductionWip> getAll();
    void delete(UUID id);
}
