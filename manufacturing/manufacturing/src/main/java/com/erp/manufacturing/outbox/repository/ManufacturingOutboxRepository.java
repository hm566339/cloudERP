package com.erp.manufacturing.outbox.repository;

import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ManufacturingOutboxRepository extends JpaRepository<ManufacturingOutbox, UUID> {
    Optional<ManufacturingOutbox> findByCompanyIdAndIdempotencyKey(UUID companyId, String idempotencyKey);
}
