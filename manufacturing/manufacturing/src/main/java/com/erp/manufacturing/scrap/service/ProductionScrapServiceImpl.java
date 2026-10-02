package com.erp.manufacturing.scrap.service;

import com.erp.manufacturing.scrap.entity.ProductionScrap;
import com.erp.manufacturing.scrap.repository.ProductionScrapRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionScrapServiceImpl implements ProductionScrapService {
    private final ProductionScrapRepository repository;

    public ProductionScrapServiceImpl(ProductionScrapRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ProductionScrap> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionScrap> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
