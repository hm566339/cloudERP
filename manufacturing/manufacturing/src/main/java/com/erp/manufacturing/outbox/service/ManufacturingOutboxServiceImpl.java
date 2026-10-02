package com.erp.manufacturing.outbox.service;

import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ManufacturingOutboxServiceImpl implements ManufacturingOutboxService {
    private final ManufacturingOutboxRepository repository;

    public ManufacturingOutboxServiceImpl(ManufacturingOutboxRepository repository) {
        this.repository = repository;
    }

    @Override public Optional<ManufacturingOutbox> getById(UUID id) { return repository.findById(id); }
    @Override public List<ManufacturingOutbox> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }
}
