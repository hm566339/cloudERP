package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.common.enums.ConsumptionStatus;
import com.erp.manufacturing.common.enums.OutboxEventType;
import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryResponse;
import com.erp.manufacturing.integration.inventory.entity.ManufacturingOperationRecord;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import com.erp.manufacturing.integration.inventory.repository.ManufacturingOperationRecordRepository;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManufacturingInventoryReconciliationService {

    private final ManufacturingOperationRecordRepository operationRecordRepository;
    private final InventoryFeignClient inventoryFeignClient;
    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionOrderMaterialRepository materialRepository;
    private final MaterialConsumptionRepository consumptionRepository;
    private final ManufacturingOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;

    @Scheduled(fixedDelayString = "${manufacturing.reconciliation.poll-interval-ms:10000}")
    public void reconcilePendingAndUnknownOperations() {
        List<ManufacturingOperationRecord> records = operationRecordRepository
                .findAllByStatus(ManufacturingOperationStatus.RECONCILIATION_REQUIRED);
        if (records.isEmpty()) {
            return;
        }

        log.info("ManufacturingInventoryReconciliationService found {} operation(s) requiring reconciliation", records.size());

        for (ManufacturingOperationRecord record : records) {
            try {
                reconcileOperation(record);
            } catch (Exception ex) {
                log.error("Failed to reconcile manufacturing operation [{}]: {}", record.getId(), ex.getMessage());
            }
        }
    }

    @Transactional
    public void reconcileOperation(ManufacturingOperationRecord record) {
        record.setRetryCount(record.getRetryCount() == null ? 1 : record.getRetryCount() + 1);
        record.setUpdatedAt(LocalDateTime.now());

        UUID idempotencyUuid = UUID.nameUUIDFromBytes(record.getIdempotencyKey().getBytes(StandardCharsets.UTF_8));

        switch (record.getOperationType()) {
            case MATERIAL_RESERVATION -> reconcileReservation(record, idempotencyUuid);
            case MATERIAL_CONSUMPTION -> reconcileConsumption(record, idempotencyUuid);
            case PRODUCTION_COMPLETION -> reconcileCompletion(record, idempotencyUuid);
            default -> log.debug("Reconciliation not needed for operation type: {}", record.getOperationType());
        }
    }

    private void reconcileReservation(ManufacturingOperationRecord record, UUID idempotencyUuid) {
        try {
            ResponseEntity<InventoryApiResponse<ReservationInventoryResponse>> response =
                    inventoryFeignClient.getReservationByIdempotencyKey(idempotencyUuid, record.getCompanyId());

            if (response != null && response.getBody() != null && response.getBody().isSuccess() && response.getBody().getData() != null) {
                ReservationInventoryResponse data = response.getBody().getData();
                record.setStatus(ManufacturingOperationStatus.SUCCEEDED);
                record.setInventoryReferenceId(data.getId());
                record.setErrorMessage(null);
                operationRecordRepository.save(record);

                // Update material
                if (record.getLineId() != null) {
                    materialRepository.findByIdAndCompanyId(record.getLineId(), record.getCompanyId()).ifPresent(material -> {
                        material.setInventoryReservationId(data.getId());
                        material.setReservedQuantity(data.getReservedQuantity());
                        material.setStatus(ProductionMaterialStatus.RESERVED);
                        materialRepository.save(material);
                    });
                }
                log.info("Successfully reconciled reservation for operation [{}] with inventory reservation [{}]",
                        record.getId(), data.getId());
            } else {
                markReconciliationAttempt(record, "Inventory returned unsuccessful response");
            }
        } catch (FeignException.NotFound ex) {
            record.setStatus(ManufacturingOperationStatus.FAILED);
            record.setErrorMessage("Reservation not found in Inventory");
            operationRecordRepository.save(record);
            log.info("Reconciliation confirmed reservation was not created in Inventory for operation [{}]", record.getId());
        } catch (Exception ex) {
            markReconciliationAttempt(record, ex.getMessage());
        }
    }

    private void reconcileConsumption(ManufacturingOperationRecord record, UUID idempotencyUuid) {
        try {
            ResponseEntity<InventoryApiResponse<ProductionStockOutInventoryResponse>> response =
                    inventoryFeignClient.getMovementByIdempotencyKey(idempotencyUuid, record.getCompanyId());

            if (response != null && response.getBody() != null && response.getBody().isSuccess() && response.getBody().getData() != null) {
                ProductionStockOutInventoryResponse data = response.getBody().getData();
                record.setStatus(ManufacturingOperationStatus.SUCCEEDED);
                record.setInventoryReferenceId(data.getInventoryMovementId());
                record.setErrorMessage(null);
                operationRecordRepository.save(record);
                log.info("Successfully reconciled stock-out consumption for operation [{}] with movement [{}]",
                        record.getId(), data.getInventoryMovementId());
            } else {
                markReconciliationAttempt(record, "Inventory returned unsuccessful response");
            }
        } catch (FeignException.NotFound ex) {
            record.setStatus(ManufacturingOperationStatus.FAILED);
            record.setErrorMessage("Stock-out movement not found in Inventory");
            operationRecordRepository.save(record);
            log.info("Reconciliation confirmed stock-out was not created in Inventory for operation [{}]", record.getId());
        } catch (Exception ex) {
            markReconciliationAttempt(record, ex.getMessage());
        }
    }

    private void reconcileCompletion(ManufacturingOperationRecord record, UUID idempotencyUuid) {
        try {
            ResponseEntity<InventoryApiResponse<ProductionStockOutInventoryResponse>> response =
                    inventoryFeignClient.getMovementByIdempotencyKey(idempotencyUuid, record.getCompanyId());

            if (response != null && response.getBody() != null && response.getBody().isSuccess() && response.getBody().getData() != null) {
                ProductionStockOutInventoryResponse data = response.getBody().getData();
                record.setStatus(ManufacturingOperationStatus.SUCCEEDED);
                record.setInventoryReferenceId(data.getInventoryMovementId());
                record.setErrorMessage(null);
                operationRecordRepository.save(record);
                log.info("Successfully reconciled stock-in completion for operation [{}] with movement [{}]",
                        record.getId(), data.getInventoryMovementId());
            } else {
                markReconciliationAttempt(record, "Inventory returned unsuccessful response");
            }
        } catch (FeignException.NotFound ex) {
            record.setStatus(ManufacturingOperationStatus.FAILED);
            record.setErrorMessage("Stock-in movement not found in Inventory");
            operationRecordRepository.save(record);
            log.info("Reconciliation confirmed stock-in was not created in Inventory for operation [{}]", record.getId());
        } catch (Exception ex) {
            markReconciliationAttempt(record, ex.getMessage());
        }
    }

    private void markReconciliationAttempt(ManufacturingOperationRecord record, String error) {
        record.setErrorMessage(error);
        if (record.getRetryCount() != null && record.getRetryCount() >= 10) {
            record.setStatus(ManufacturingOperationStatus.FAILED);
        }
        operationRecordRepository.save(record);
    }
}
