package com.erp.manufacturing.outbox.service;

import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ManufacturingOutboxService {
    Optional<ManufacturingOutbox> getById(UUID id);
    List<ManufacturingOutbox> getAll();
    void delete(UUID id);
}
