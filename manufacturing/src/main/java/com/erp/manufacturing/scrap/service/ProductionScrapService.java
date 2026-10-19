package com.erp.manufacturing.scrap.service;

import com.erp.manufacturing.scrap.entity.ProductionScrap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionScrapService {
    Optional<ProductionScrap> getById(UUID id);
    List<ProductionScrap> getAll();
    void delete(UUID id);
}
