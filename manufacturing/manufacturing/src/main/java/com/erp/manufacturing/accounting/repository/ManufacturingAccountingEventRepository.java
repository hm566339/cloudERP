package com.erp.manufacturing.accounting.repository;

import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.common.enums.OutboxEventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ManufacturingAccountingEventRepository extends JpaRepository<ManufacturingAccountingEvent, UUID> {
    Optional<ManufacturingAccountingEvent> findByCompanyIdAndSourceModuleAndSourceIdAndEventType(
            UUID companyId, String sourceModule, UUID sourceId, OutboxEventType eventType);

    Optional<ManufacturingAccountingEvent> findByCompanyIdAndSourceModuleAndIdempotencyKey(
            UUID companyId, String sourceModule, String idempotencyKey);

    Optional<ManufacturingAccountingEvent> findByCompanyIdAndSourceModuleAndSourceId(
            UUID companyId, String sourceModule, UUID sourceId);
}
