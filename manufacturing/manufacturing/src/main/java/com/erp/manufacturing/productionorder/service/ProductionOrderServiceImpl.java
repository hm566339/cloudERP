package com.erp.manufacturing.productionorder.service;

import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionOrderServiceImpl implements ProductionOrderService {
    private final ProductionOrderRepository repository;

    public ProductionOrderServiceImpl(ProductionOrderRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ProductionOrder> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionOrder> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
