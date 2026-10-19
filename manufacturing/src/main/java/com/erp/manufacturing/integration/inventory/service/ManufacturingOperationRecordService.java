package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.integration.inventory.entity.ManufacturingOperationRecord;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import com.erp.manufacturing.integration.inventory.repository.ManufacturingOperationRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
public class ManufacturingOperationRecordService {

    private final ManufacturingOperationRecordRepository repository;

    public ManufacturingOperationRecordService(ManufacturingOperationRecordRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<ManufacturingOperationRecord> findRecord(UUID companyId, ManufacturingOperationType type, String idempotencyKey) {
        return repository.findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId, type, idempotencyKey);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ManufacturingOperationRecord recordProcessing(UUID companyId, ManufacturingOperationType type,
                                                        UUID businessId, UUID lineId, String idempotencyKey) {
        LocalDateTime now = LocalDateTime.now();
        ManufacturingOperationRecord record = repository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId, type, idempotencyKey)
                .orElse(null);

        if (record == null) {
            record = ManufacturingOperationRecord.builder()
                    .companyId(companyId)
                    .operationType(type)
                    .businessId(businessId)
                    .lineId(lineId)
                    .idempotencyKey(idempotencyKey)
                    .status(ManufacturingOperationStatus.PROCESSING)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            record.setStatus(ManufacturingOperationStatus.PROCESSING);
            record.setUpdatedAt(now);
        }
        return repository.saveAndFlush(record);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(UUID companyId, ManufacturingOperationType type,
                              String idempotencyKey, UUID inventoryReferenceId) {
        LocalDateTime now = LocalDateTime.now();
        ManufacturingOperationRecord record = repository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId, type, idempotencyKey)
                .orElse(null);

        if (record == null) {
            record = ManufacturingOperationRecord.builder()
                    .companyId(companyId)
                    .operationType(type)
                    .idempotencyKey(idempotencyKey)
                    .status(ManufacturingOperationStatus.SUCCEEDED)
                    .inventoryReferenceId(inventoryReferenceId)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            record.setStatus(ManufacturingOperationStatus.SUCCEEDED);
            record.setInventoryReferenceId(inventoryReferenceId);
            record.setUpdatedAt(now);
        }
        repository.saveAndFlush(record);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordReconciliationRequired(UUID companyId, ManufacturingOperationType type,
                                             String idempotencyKey, String errorMessage) {
        LocalDateTime now = LocalDateTime.now();
        ManufacturingOperationRecord record = repository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId, type, idempotencyKey)
                .orElse(null);

        if (record == null) {
            record = ManufacturingOperationRecord.builder()
                    .companyId(companyId)
                    .operationType(type)
                    .idempotencyKey(idempotencyKey)
                    .status(ManufacturingOperationStatus.RECONCILIATION_REQUIRED)
                    .errorMessage(errorMessage)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            record.setStatus(ManufacturingOperationStatus.RECONCILIATION_REQUIRED);
            record.setErrorMessage(errorMessage);
            record.setUpdatedAt(now);
        }
        repository.saveAndFlush(record);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(UUID companyId, ManufacturingOperationType type,
                              String idempotencyKey, String errorMessage) {
        LocalDateTime now = LocalDateTime.now();
        ManufacturingOperationRecord record = repository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId, type, idempotencyKey)
                .orElse(null);

        if (record == null) {
            record = ManufacturingOperationRecord.builder()
                    .companyId(companyId)
                    .operationType(type)
                    .idempotencyKey(idempotencyKey)
                    .status(ManufacturingOperationStatus.FAILED)
                    .errorMessage(errorMessage)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();
        } else {
            record.setStatus(ManufacturingOperationStatus.FAILED);
            record.setErrorMessage(errorMessage);
            record.setUpdatedAt(now);
        }
        repository.saveAndFlush(record);
    }
}
