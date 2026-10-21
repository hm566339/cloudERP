package com.erp.manufacturing.consumption.service;

import com.erp.manufacturing.common.enums.ConsumptionStatus;
import com.erp.manufacturing.common.enums.OutboxEventType;
import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionCostSource;
import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.consumption.dto.request.MaterialConsumptionRequest;
import com.erp.manufacturing.consumption.dto.response.MaterialConsumptionResponse;
import com.erp.manufacturing.consumption.entity.MaterialConsumption;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockOutInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockOutCostInventoryResponse;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.security.sso.CompanyCurrencyService;
import com.erp.manufacturing.util.TenantUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.erp.manufacturing.integration.inventory.entity.ManufacturingOperationRecord;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import com.erp.manufacturing.integration.inventory.repository.ManufacturingOperationRecordRepository;
import com.erp.manufacturing.integration.inventory.service.ManufacturingOperationRecordService;
import java.nio.charset.StandardCharsets;

@Service
public class MaterialConsumptionServiceImpl implements MaterialConsumptionService {
    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionOrderMaterialRepository productionOrderMaterialRepository;
    private final MaterialConsumptionRepository repository;
    private final InventoryFeignClient inventoryFeignClient;
    private final ManufacturingOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final ManufacturingAccountingEventRepository accountingEventRepository;
    private final CompanyCurrencyService companyCurrencyService;
    private final ManufacturingOperationRecordRepository operationRecordRepository;
    @Autowired(required = false)
    private ManufacturingOperationRecordService operationRecordService;
    @Autowired(required = false)
    private com.erp.manufacturing.cost.repository.ProductionCostRepository costRepository;

    @Autowired
    public MaterialConsumptionServiceImpl(ProductionOrderRepository productionOrderRepository,
                                          ProductionOrderMaterialRepository productionOrderMaterialRepository,
                                          MaterialConsumptionRepository repository,
                                          InventoryFeignClient inventoryFeignClient,
                                          ManufacturingOutboxRepository outboxRepository,
                                          ObjectMapper objectMapper,
                                          ManufacturingAccountingEventRepository accountingEventRepository,
                                          CompanyCurrencyService companyCurrencyService,
                                          @Autowired(required = false) ManufacturingOperationRecordRepository operationRecordRepository) {
        this.productionOrderRepository = productionOrderRepository;
        this.productionOrderMaterialRepository = productionOrderMaterialRepository;
        this.repository = repository;
        this.inventoryFeignClient = inventoryFeignClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.accountingEventRepository = accountingEventRepository;
        this.companyCurrencyService = companyCurrencyService;
        this.operationRecordRepository = operationRecordRepository;
    }

    public MaterialConsumptionServiceImpl(ProductionOrderRepository productionOrderRepository,
                                          ProductionOrderMaterialRepository productionOrderMaterialRepository,
                                          MaterialConsumptionRepository repository,
                                          InventoryFeignClient inventoryFeignClient,
                                          ManufacturingOutboxRepository outboxRepository,
                                          ObjectMapper objectMapper,
                                          ManufacturingAccountingEventRepository accountingEventRepository,
                                          CompanyCurrencyService companyCurrencyService) {
        this(productionOrderRepository, productionOrderMaterialRepository, repository,
                inventoryFeignClient, outboxRepository, objectMapper, accountingEventRepository, companyCurrencyService, null);
    }

    public MaterialConsumptionServiceImpl(ProductionOrderRepository productionOrderRepository,
                                          ProductionOrderMaterialRepository productionOrderMaterialRepository,
                                          MaterialConsumptionRepository repository,
                                          InventoryFeignClient inventoryFeignClient,
                                          ManufacturingOutboxRepository outboxRepository,
                                          ObjectMapper objectMapper,
                                          ManufacturingAccountingEventRepository accountingEventRepository) {
        this(productionOrderRepository, productionOrderMaterialRepository, repository,
                inventoryFeignClient, outboxRepository, objectMapper, accountingEventRepository, null, null);
    }

    public MaterialConsumptionServiceImpl(ProductionOrderRepository productionOrderRepository,
                                          ProductionOrderMaterialRepository productionOrderMaterialRepository,
                                          MaterialConsumptionRepository repository,
                                          InventoryFeignClient inventoryFeignClient,
                                          ManufacturingOutboxRepository outboxRepository,
                                          ObjectMapper objectMapper) {
        this(productionOrderRepository, productionOrderMaterialRepository, repository,
                inventoryFeignClient, outboxRepository, objectMapper, null, null, null);
    }

    @Override public Optional<MaterialConsumption> getById(UUID id) { return repository.findById(id); }
    @Override public List<MaterialConsumption> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }

    @Override
    @Transactional
    public MaterialConsumptionResponse consumeMaterial(UUID productionOrderId, MaterialConsumptionRequest request, UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        validateRequest(request);

        ProductionOrder order = productionOrderRepository.findByIdAndCompanyId(productionOrderId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found or belongs to another company: " + productionOrderId));
        validateOrderState(order);

        ProductionOrderMaterial material = productionOrderMaterialRepository.findByIdAndCompanyId(request.getProductionOrderMaterialId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order material not found or belongs to another company: " + request.getProductionOrderMaterialId()));
        validateMaterial(order, material, request, companyId);

        BigDecimal remaining = remainingQuantity(material);
        if (request.getQuantity().compareTo(remaining) > 0) {
            throw new BusinessValidationException("Requested quantity exceeds remaining consumable quantity.");
        }

        String idempotencyKey = buildDeterministicIdempotencyKey(companyId, productionOrderId, material.getId(), request.getIdempotencyKey());
        Optional<MaterialConsumption> existing = repository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey);
        if (existing.isPresent()) {
            MaterialConsumption current = existing.get();
            return toResponse(current, current.getProductionOrder(), current.getProductionOrderMaterial());
        }

        UUID movementKey = UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8));

        ManufacturingOperationRecord opRecord = null;
        if (operationRecordService != null) {
            opRecord = operationRecordService.findRecord(companyId, ManufacturingOperationType.MATERIAL_CONSUMPTION, idempotencyKey).orElse(null);
        } else if (operationRecordRepository != null) {
            opRecord = operationRecordRepository.findByCompanyIdAndOperationTypeAndIdempotencyKey(
                    companyId, ManufacturingOperationType.MATERIAL_CONSUMPTION, idempotencyKey).orElse(null);
        }

        ProductionStockOutInventoryResponse inventoryResponse = null;
        if (opRecord != null && opRecord.getStatus() == ManufacturingOperationStatus.SUCCEEDED
                && opRecord.getInventoryReferenceId() != null) {
            inventoryResponse = ProductionStockOutInventoryResponse.builder()
                    .inventoryMovementId(opRecord.getInventoryReferenceId())
                    .movementType("PRODUCTION_OUT")
                    .quantity(request.getQuantity())
                    .companyId(companyId)
                    .build();
        } else {
            try {
                ResponseEntity<InventoryApiResponse<ProductionStockOutInventoryResponse>> existingMovement =
                        inventoryFeignClient.getMovementByIdempotencyKey(movementKey, companyId);
                if (existingMovement != null && existingMovement.getBody() != null && existingMovement.getBody().getData() != null) {
                    inventoryResponse = existingMovement.getBody().getData();
                }
            } catch (Exception ignored) {
            }
        }

        if (inventoryResponse == null) {
            if (operationRecordService != null) {
                opRecord = operationRecordService.recordProcessing(
                        companyId, ManufacturingOperationType.MATERIAL_CONSUMPTION,
                        productionOrderId, material.getId(), idempotencyKey);
            } else if (opRecord == null && operationRecordRepository != null) {
                opRecord = operationRecordRepository.save(ManufacturingOperationRecord.builder()
                        .companyId(companyId)
                        .operationType(ManufacturingOperationType.MATERIAL_CONSUMPTION)
                        .businessId(productionOrderId)
                        .lineId(material.getId())
                        .idempotencyKey(idempotencyKey)
                        .status(ManufacturingOperationStatus.PROCESSING)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());
            }

            ProductionStockOutInventoryRequest stockOutRequest = ProductionStockOutInventoryRequest.builder()
                    .productionOrderId(order.getId())
                    .productionOrderMaterialId(material.getId())
                    .productId(material.getComponentProductId())
                    .quantity(request.getQuantity())
                    .uomId(request.getUomId())
                    .warehouseId(request.getWarehouseId())
                    .locationId(request.getLocationId())
                    .batchId(request.getBatchId())
                    .serialId(request.getSerialId())
                    .reservationId(request.getReservationId())
                    .idempotencyKey(movementKey)
                    .build();

            InventoryApiRequest<ProductionStockOutInventoryRequest> inventoryRequest = InventoryApiRequest.<ProductionStockOutInventoryRequest>builder()
                    .data(stockOutRequest)
                    .build();

            try {
                inventoryResponse = callInventory(inventoryRequest, companyId);
            } catch (Exception ex) {
                try {
                    ResponseEntity<InventoryApiResponse<ProductionStockOutInventoryResponse>> recon =
                            inventoryFeignClient.getMovementByIdempotencyKey(movementKey, companyId);
                    if (recon != null && recon.getBody() != null && recon.getBody().getData() != null) {
                        inventoryResponse = recon.getBody().getData();
                    }
                } catch (Exception ignored) {
                }

                if (inventoryResponse == null) {
                    if (operationRecordService != null) {
                        operationRecordService.recordReconciliationRequired(
                                companyId, ManufacturingOperationType.MATERIAL_CONSUMPTION,
                                idempotencyKey, ex.getMessage());
                    } else if (opRecord != null) {
                        opRecord.setStatus(ManufacturingOperationStatus.RECONCILIATION_REQUIRED);
                        opRecord.setErrorMessage(ex.getMessage());
                        opRecord.setUpdatedAt(LocalDateTime.now());
                        operationRecordRepository.save(opRecord);
                    }
                    throw ex;
                }
            }
        }

        if (operationRecordService != null) {
            operationRecordService.recordSuccess(
                    companyId, ManufacturingOperationType.MATERIAL_CONSUMPTION,
                    idempotencyKey, inventoryResponse.getInventoryMovementId());
        } else if (opRecord != null) {
            opRecord.setStatus(ManufacturingOperationStatus.SUCCEEDED);
            opRecord.setInventoryReferenceId(inventoryResponse.getInventoryMovementId());
            opRecord.setUpdatedAt(LocalDateTime.now());
            operationRecordRepository.save(opRecord);
        }

        ProductionStockOutCostInventoryResponse costResponse = callInventoryCost(
            inventoryResponse.getInventoryMovementId(), order.getId(), material.getId(), companyId);

        String companyCurrency = companyCurrencyService != null
                ? companyCurrencyService.getCompanyCurrency(companyId)
                : null;
        if (companyCurrency == null || companyCurrency.isBlank()) {
            throw new BusinessValidationException("Company currency could not be resolved for material consumption");
        }

        String inventoryCurrency = costResponse.getEffectiveCurrency();
        if (inventoryCurrency != null && !inventoryCurrency.isBlank()) {
            if (!inventoryCurrency.equalsIgnoreCase(companyCurrency)) {
                throw new BusinessValidationException(
                    String.format("Inventory valuation currency (%s) does not match company currency (%s)",
                        inventoryCurrency, companyCurrency));
            }
        }

        LocalDateTime now = LocalDateTime.now();
        MaterialConsumption consumption = MaterialConsumption.builder()
                .companyId(companyId)
                .productionOrder(order)
                .productionOrderMaterial(material)
                .componentProductId(material.getComponentProductId())
                .plannedQuantity(material.getPlannedQuantity())
                .actualQuantity(request.getQuantity())
                .uomId(request.getUomId())
                .warehouseId(request.getWarehouseId())
                .locationId(request.getLocationId())
                .batchId(request.getBatchId())
                .serialId(request.getSerialId())
                .consumptionDate(now)
                .status(ConsumptionStatus.POSTED)
                .inventoryMovementId(inventoryResponse.getInventoryMovementId())
                .actualUnitCost(costResponse.getUnitCost())
                .actualTotalCost(costResponse.getTotalCost())
                .costCurrency(companyCurrency)
                .costSource(ProductionCostSource.INVENTORY_VALUATION)
                .idempotencyKey(idempotencyKey)
                .remarks("Production material consumption")
                .build();
        consumption.setCreatedAt(now);
        consumption.setUpdatedAt(now);
        consumption.setIsDeleted(false);

        MaterialConsumption saved = repository.saveAndFlush(consumption);

        BigDecimal newConsumed = nonNull(material.getConsumedQuantity()).add(request.getQuantity());
        material.setConsumedQuantity(newConsumed);
        material.setStatus(newConsumed.compareTo(nonNull(material.getPlannedQuantity())) >= 0
                ? ProductionMaterialStatus.CONSUMED
                : ProductionMaterialStatus.PARTIALLY_CONSUMED);
        productionOrderMaterialRepository.save(material);

        String accountingKey = AccountingEventIdentity.idempotencyKey(companyId, order.getId(),
            OutboxEventType.PRODUCTION_WIP_ACCUMULATION, "WIP-V1-" + material.getId() + "-" + request.getIdempotencyKey());
        saveAccountingEvent(companyId, order.getId(), saved.getId(), accountingKey,
            costResponse.getTotalCost(), companyCurrency, "MC-" + saved.getId());
        saveOutboxEvent(companyId, order.getId(), material.getId(), saved.getId(), material.getComponentProductId(),
            request.getQuantity(), request.getUomId(), inventoryResponse.getInventoryMovementId(),
            request.getReservationId(), request.getBatchId(), request.getSerialId(),
            accountingKey, costResponse.getTotalCost(), companyCurrency);

        return toResponse(saved, order, material);
    }

    private void validateRequest(MaterialConsumptionRequest request) {
        if (request == null) {
            throw new BusinessValidationException("Consumption request is required.");
        }
        if (request.getQuantity() == null || request.getQuantity().signum() <= 0) {
            throw new BusinessValidationException("Quantity must be greater than zero.");
        }
        if (request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()) {
            throw new BusinessValidationException("Idempotency key is required.");
        }
    }

    private void validateOrderState(ProductionOrder order) {
        if (order.getStatus() == null || (!ProductionOrderStatus.RELEASED.equals(order.getStatus())
                && !ProductionOrderStatus.IN_PROGRESS.equals(order.getStatus())
                && !ProductionOrderStatus.PARTIALLY_COMPLETED.equals(order.getStatus()))) {
            throw new BusinessValidationException("Production order is not in a consumable state.");
        }
    }

    private void validateMaterial(ProductionOrder order, ProductionOrderMaterial material, MaterialConsumptionRequest request, UUID companyId) {
        if (material.getProductionOrder() == null || !material.getProductionOrder().getId().equals(order.getId())) {
            throw new BusinessValidationException("Material does not belong to the supplied production order.");
        }
        if (!companyId.equals(order.getCompanyId()) || !companyId.equals(material.getCompanyId())) {
            throw new BusinessValidationException("Production material does not belong to the authenticated company.");
        }
        if (request.getProductId() != null && !material.getComponentProductId().equals(request.getProductId())) {
            throw new BusinessValidationException("Product does not match the component product of the material.");
        }
        if (request.getWarehouseId() == null || request.getLocationId() == null) {
            throw new BusinessValidationException("Warehouse and location are required.");
        }
        if (!request.getWarehouseId().equals(order.getWarehouseId())) {
            throw new BusinessValidationException("Warehouse does not match the production order configuration.");
        }
        if (request.getLocationId() != null && order.getProductionLocationId() != null && !request.getLocationId().equals(order.getProductionLocationId())) {
            throw new BusinessValidationException("Location does not match the production order location.");
        }
        if (material.getInventoryReservationId() == null || !material.getInventoryReservationId().equals(request.getReservationId())) {
            throw new BusinessValidationException("Reservation does not match the production material.");
        }
        if (material.getUomId() == null || !material.getUomId().equals(request.getUomId())) {
            throw new BusinessValidationException("UOM does not match the planned material UOM.");
        }
        if (nonNull(material.getConsumedQuantity()).add(request.getQuantity()).compareTo(nonNull(material.getPlannedQuantity())) > 0) {
            throw new BusinessValidationException("Requested quantity exceeds planned material quantity.");
        }
    }

    private BigDecimal remainingQuantity(ProductionOrderMaterial material) {
        return nonNull(material.getPlannedQuantity()).subtract(nonNull(material.getConsumedQuantity())).max(BigDecimal.ZERO);
    }

    private ProductionStockOutInventoryResponse callInventory(InventoryApiRequest<ProductionStockOutInventoryRequest> inventoryRequest, UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<ProductionStockOutInventoryResponse>> response =
                    inventoryFeignClient.createProductionStockOut(inventoryRequest, companyId);
            InventoryApiResponse<ProductionStockOutInventoryResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null || body.getData().getInventoryMovementId() == null) {
                throw new ExternalServiceException("Inventory rejected production stock-out.");
            }
            return body.getData();
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory production stock-out call failed.", e);
        }
    }

    private ProductionStockOutCostInventoryResponse callInventoryCost(UUID movementId, UUID orderId,
                                                                        UUID materialId, UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<ProductionStockOutCostInventoryResponse>> response =
                    inventoryFeignClient.getProductionStockOutCost(movementId, orderId, materialId, companyId);
            InventoryApiResponse<ProductionStockOutCostInventoryResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null
                    || body.getData().getUnitCost() == null || body.getData().getTotalCost() == null) {
                throw new ExternalServiceException("Inventory returned no authoritative production material cost.");
            }
            return body.getData();
        } catch (FeignException e) {
            throw new ExternalServiceException("Inventory production material cost call failed.", e);
        }
    }

    private String buildDeterministicIdempotencyKey(UUID companyId, UUID productionOrderId, UUID materialId, String requestKey) {
        return companyId + ":" + productionOrderId + ":" + materialId + ":" + requestKey;
    }

    private void saveOutboxEvent(UUID companyId, UUID productionOrderId, UUID productionOrderMaterialId, UUID materialConsumptionId,
                                UUID productId, BigDecimal quantity, UUID uomId, UUID inventoryMovementId,
                                UUID reservationId, UUID batchId, UUID serialId, String idempotencyKey, BigDecimal amount,
                                String currencyCode) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("companyId", companyId.toString());
        payload.put("productionOrderId", productionOrderId.toString());
        payload.put("productionOrderMaterialId", productionOrderMaterialId.toString());
        payload.put("materialConsumptionId", materialConsumptionId.toString());
        payload.put("sourceModule", AccountingEventIdentity.SOURCE_MODULE);
        payload.put("sourceId", AccountingEventIdentity.sourceId(idempotencyKey).toString());
        payload.put("eventType", OutboxEventType.PRODUCTION_WIP_ACCUMULATION.name());
        payload.put("amount", amount.toPlainString());
        if (currencyCode != null) {
            payload.put("currencyCode", currencyCode);
        }
        payload.put("productId", productId.toString());
        payload.put("quantity", quantity.toPlainString());
        payload.put("uomId", uomId.toString());
        payload.put("inventoryMovementId", inventoryMovementId.toString());
        if (reservationId != null) payload.put("reservationId", reservationId.toString());
        if (batchId != null) payload.put("batchId", batchId.toString());
        if (serialId != null) payload.put("serialId", serialId.toString());
        ManufacturingOutbox event = ManufacturingOutbox.builder()
                .companyId(companyId)
                .aggregateType("MATERIAL_CONSUMPTION")
                .aggregateId(materialConsumptionId)
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .idempotencyKey(idempotencyKey)
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        outboxRepository.save(event);
    }

    private void saveAccountingEvent(UUID companyId, UUID productionOrderId, UUID aggregateId,
                                     String idempotencyKey, BigDecimal amount, String currencyCode,
                                     String referenceNo) {
        if (accountingEventRepository == null) {
            return;
        }
        if (accountingEventRepository.findByCompanyIdAndSourceModuleAndIdempotencyKey(
                companyId, AccountingEventIdentity.SOURCE_MODULE, idempotencyKey).isPresent()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        accountingEventRepository.save(ManufacturingAccountingEvent.builder()
                .companyId(companyId).productionOrderId(productionOrderId)
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                .sourceId(AccountingEventIdentity.sourceId(idempotencyKey))
                .referenceNo(referenceNo).amount(amount).currencyCode(currencyCode)
                .idempotencyKey(idempotencyKey).status(AccountingEventStatus.PENDING)
                .createdAt(now).updatedAt(now).build());
    }

    private MaterialConsumptionResponse toResponse(MaterialConsumption consumption, ProductionOrder order, ProductionOrderMaterial material) {
        return MaterialConsumptionResponse.builder()
                .materialConsumptionId(consumption.getId())
                .productionOrderId(order.getId())
                .productionOrderMaterialId(material.getId())
                .productId(material.getComponentProductId())
                .quantity(consumption.getActualQuantity())
                .uomId(consumption.getUomId())
                .warehouseId(consumption.getWarehouseId())
                .locationId(consumption.getLocationId())
                .inventoryMovementId(consumption.getInventoryMovementId())
                .reservationId(material.getInventoryReservationId())
                .status(consumption.getStatus())
                .build();
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
