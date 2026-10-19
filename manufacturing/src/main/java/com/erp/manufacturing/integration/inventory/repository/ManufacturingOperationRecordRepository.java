package com.erp.manufacturing.integration.inventory.repository;

import com.erp.manufacturing.integration.inventory.entity.ManufacturingOperationRecord;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ManufacturingOperationRecordRepository extends JpaRepository<ManufacturingOperationRecord, UUID> {

    Optional<ManufacturingOperationRecord> findByCompanyIdAndOperationTypeAndIdempotencyKey(
            UUID companyId, ManufacturingOperationType operationType, String idempotencyKey);

    List<ManufacturingOperationRecord> findAllByCompanyIdAndStatus(
            UUID companyId, ManufacturingOperationStatus status);

    List<ManufacturingOperationRecord> findAllByStatus(ManufacturingOperationStatus status);
}
