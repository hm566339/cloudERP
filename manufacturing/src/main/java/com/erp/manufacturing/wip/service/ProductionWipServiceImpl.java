package com.erp.manufacturing.wip.service;

import com.erp.manufacturing.wip.entity.ProductionWip;
import com.erp.manufacturing.wip.repository.ProductionWipRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionWipServiceImpl implements ProductionWipService {
    private final ProductionWipRepository repository;

    public ProductionWipServiceImpl(ProductionWipRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ProductionWip> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionWip> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
