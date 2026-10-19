package com.erp.manufacturing.genealogy.service;

import com.erp.manufacturing.genealogy.entity.ProductionGenealogy;
import com.erp.manufacturing.genealogy.repository.ProductionGenealogyRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionGenealogyServiceImpl implements ProductionGenealogyService {
    private final ProductionGenealogyRepository repository;

    public ProductionGenealogyServiceImpl(ProductionGenealogyRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ProductionGenealogy> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionGenealogy> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
