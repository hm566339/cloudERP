package com.erp.manufacturing.genealogy.service;

import com.erp.manufacturing.genealogy.entity.ProductionGenealogy;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductionGenealogyService {
    Optional<ProductionGenealogy> getById(UUID id);
    List<ProductionGenealogy> getAll();
    void delete(UUID id);
}
