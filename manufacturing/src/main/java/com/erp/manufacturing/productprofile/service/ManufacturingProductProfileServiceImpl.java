package com.erp.manufacturing.productprofile.service;

import com.erp.manufacturing.productprofile.entity.ManufacturingProductProfile;
import com.erp.manufacturing.productprofile.repository.ManufacturingProductProfileRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ManufacturingProductProfileServiceImpl implements ManufacturingProductProfileService {
    private final ManufacturingProductProfileRepository repository;

    public ManufacturingProductProfileServiceImpl(ManufacturingProductProfileRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ManufacturingProductProfile> getById(UUID id) { return repository.findById(id); }
    @Override public List<ManufacturingProductProfile> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
