package com.erp.manufacturing.completion.service;

import com.erp.manufacturing.common.enums.CompletionStatus;
import com.erp.manufacturing.common.enums.OutboxEventType;
import com.erp.manufacturing.common.enums.OutboxStatus;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.common.exception.ResourceNotFoundException;
import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.dto.ProductionCompletionResponse;
import com.erp.manufacturing.completion.entity.ProductionCompletion;
import com.erp.manufacturing.completion.entity.ProductionCompletionLine;
import com.erp.manufacturing.completion.repository.ProductionCompletionLineRepository;
import com.erp.manufacturing.completion.repository.ProductionCompletionRepository;
import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryResponse;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.util.TenantUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ProductionCompletionServiceImpl implements ProductionCompletionService {
    private final ProductionCompletionRepository repository;
    private final ProductionCompletionLineRepository lineRepository;
    private final ProductionOrderRepository productionOrderRepository;
    private final ProductionOrderOutputRepository outputRepository;
    private final ProductionOrderMaterialRepository materialRepository;
    private final ProductionCostRepository costRepository;
    private final InventoryFeignClient inventoryFeignClient;
    private final ManufacturingOutboxRepository outboxRepository;
    private final ObjectMapper objectMapper;
    private final ManufacturingAccountingEventRepository accountingEventRepository;

    @Autowired
    public ProductionCompletionServiceImpl(ProductionCompletionRepository repository,
                                           ProductionCompletionLineRepository lineRepository,
                                           ProductionOrderRepository productionOrderRepository,
                                           ProductionOrderOutputRepository outputRepository,
                                           ProductionOrderMaterialRepository materialRepository,
                                           ProductionCostRepository costRepository,
                                           InventoryFeignClient inventoryFeignClient,
                                           ManufacturingOutboxRepository outboxRepository,
                                           ObjectMapper objectMapper,
                                           ManufacturingAccountingEventRepository accountingEventRepository) {
        this.repository = repository;
        this.lineRepository = lineRepository;
        this.productionOrderRepository = productionOrderRepository;
        this.outputRepository = outputRepository;
        this.materialRepository = materialRepository;
        this.costRepository = costRepository;
        this.inventoryFeignClient = inventoryFeignClient;
        this.outboxRepository = outboxRepository;
        this.objectMapper = objectMapper;
        this.accountingEventRepository = accountingEventRepository;
    }

    public ProductionCompletionServiceImpl(ProductionCompletionRepository repository,
                                           ProductionCompletionLineRepository lineRepository,
                                           ProductionOrderRepository productionOrderRepository,
                                           ProductionOrderOutputRepository outputRepository,
                                           ProductionOrderMaterialRepository materialRepository,
                                           ProductionCostRepository costRepository,
                                           InventoryFeignClient inventoryFeignClient,
                                           ManufacturingOutboxRepository outboxRepository,
                                           ObjectMapper objectMapper) {
        this(repository, lineRepository, productionOrderRepository, outputRepository, materialRepository,
                costRepository, inventoryFeignClient, outboxRepository, objectMapper, null);
    }

    @Override public Optional<ProductionCompletion> getById(UUID id) { return repository.findById(id); }
    @Override public List<ProductionCompletion> getAll() { return repository.findAll(); }
    @Override public void delete(UUID id) { repository.deleteById(id); }

    @Override
    @Transactional
    public ProductionCompletionResponse complete(UUID productionOrderId, ProductionCompletionRequest request,
                                                 UUID requestCompanyId) {
        UUID companyId = TenantUtils.resolveCompanyId(requestCompanyId);
        validateRequest(request);
        ProductionOrder order = productionOrderRepository.findByIdAndCompanyId(productionOrderId, companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production order not found or belongs to another company"));
        validateOrderState(order);

        String completionKey = deterministicKey(companyId, productionOrderId,
                request.getProductionOrderOutputId(), request.getIdempotencyKey());
        Optional<ProductionCompletion> existing = repository.findByCompanyIdAndIdempotencyKey(companyId, completionKey);
        if (existing.isPresent()) return response(existing.get(), order, request, null);

        ProductionOrderOutput output = outputRepository.findByIdAndCompanyIdForUpdate(
                        request.getProductionOrderOutputId(), companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Production output not found or belongs to another company"));
        validateOutput(order, output, request, companyId);
        BigDecimal producedBefore = nonNull(output.getProducedQuantity());
        BigDecimal remaining = nonNull(output.getPlannedQuantity()).subtract(producedBefore).max(BigDecimal.ZERO);
        if (request.getQuantity().compareTo(remaining) > 0) {
            throw new BusinessValidationException("Requested quantity exceeds remaining output quantity");
        }

        ProductionCost cost = costRepository.findByCompanyIdAndProductionOrder_Id(companyId, order.getId())
                .orElseThrow(() -> new BusinessValidationException("Production cost is required before completion"));
        if (cost.getCostPerUnit() == null || cost.getCostPerUnit().signum() < 0) {
            throw new BusinessValidationException("Production cost per unit is invalid");
        }

        UUID inventoryKey = UUID.nameUUIDFromBytes(completionKey.getBytes(StandardCharsets.UTF_8));
        ProductionStockInCostedInventoryRequest stockIn = ProductionStockInCostedInventoryRequest.builder()
                .productionOrderId(order.getId()).productionOrderOutputId(output.getId()).productId(output.getProductId())
                .quantity(request.getQuantity()).uomId(request.getUomId()).warehouseId(request.getWarehouseId())
                .locationId(request.getLocationId()).batchId(request.getBatchId()).serialId(request.getSerialId())
            .productionCostPerUnit(cost.getCostPerUnit())
            .productionTotalCost(request.getQuantity().multiply(cost.getCostPerUnit()))
            .currencyCode(cost.getCurrencyCode())
                .idempotencyKey(inventoryKey).build();
        ProductionStockInCostedInventoryResponse inventory = callCostedInventory(
            InventoryApiRequest.<ProductionStockInCostedInventoryRequest>builder().data(stockIn).build(), companyId);

        BigDecimal producedAfter = producedBefore.add(request.getQuantity());
        output.setProducedQuantity(producedAfter);
        output.setStatus(producedAfter.compareTo(output.getPlannedQuantity()) >= 0
                ? ProductionOutputStatus.PRODUCED : ProductionOutputStatus.PARTIALLY_PRODUCED);
        outputRepository.save(output);

        LocalDateTime now = LocalDateTime.now();
        ProductionCompletion completion = ProductionCompletion.builder().companyId(companyId)
                .completionNo("PC-" + completionKey).productionOrder(order).completionDate(now)
                .status(CompletionStatus.POSTED).idempotencyKey(completionKey)
                .inventoryMovementId(inventory.getInventoryMovementId()).completedBy(TenantUtils.getCurrentUserId())
                .completedAt(now).build();
        completion.setCreatedAt(now);
        completion.setUpdatedAt(now);
        completion.setIsDeleted(false);
        ProductionCompletion saved = repository.saveAndFlush(completion);

        ProductionCompletionLine completionLine = ProductionCompletionLine.builder().companyId(companyId).productionCompletion(saved)
                .productId(output.getProductId()).outputType(output.getOutputType()).quantity(request.getQuantity())
                .uomId(request.getUomId()).warehouseId(request.getWarehouseId()).locationId(request.getLocationId())
                .batchId(request.getBatchId()).serialId(request.getSerialId()).unitCost(cost.getCostPerUnit())
            .totalCost(request.getQuantity().multiply(cost.getCostPerUnit())).build();
        completionLine.setCreatedAt(now);
        completionLine.setUpdatedAt(now);
        completionLine.setIsDeleted(false);
        lineRepository.save(completionLine);

        updateOrderStatus(order, request.getQuantity(), companyId);
        if (order.getStatus() == ProductionOrderStatus.COMPLETED) {
            String accountingKey = AccountingEventIdentity.idempotencyKey(companyId, order.getId(),
                OutboxEventType.PRODUCTION_COMPLETION, "COMPLETION-V1-" + cost.getId());
            saveAccountingEvent(companyId, order.getId(), accountingKey,
                request.getQuantity().multiply(cost.getCostPerUnit()), cost.getCurrencyCode(), "PC-" + saved.getId());
            saveOutbox(companyId, order, output, saved, request, inventory, accountingKey, true);
        } else {
            saveOutbox(companyId, order, output, saved, request, inventory, completionKey, false);
        }
        return response(saved, order, request, output);
    }

    private void validateRequest(ProductionCompletionRequest request) {
        if (request == null || request.getProductionOrderOutputId() == null || request.getQuantity() == null
                || request.getQuantity().signum() <= 0 || request.getUomId() == null
                || request.getWarehouseId() == null || request.getLocationId() == null
                || request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank()) {
            throw new BusinessValidationException("Valid production completion request is required");
        }
    }

    private void validateOrderState(ProductionOrder order) {
        if (order.getStatus() == null || (order.getStatus() != ProductionOrderStatus.RELEASED
                && order.getStatus() != ProductionOrderStatus.IN_PROGRESS
                && order.getStatus() != ProductionOrderStatus.PARTIALLY_COMPLETED)) {
            throw new BusinessValidationException("Production order is not completable in its current state");
        }
    }

    private void validateOutput(ProductionOrder order, ProductionOrderOutput output,
                                ProductionCompletionRequest request, UUID companyId) {
        if (!companyId.equals(output.getCompanyId()) || output.getProductionOrder() == null
                || !order.getId().equals(output.getProductionOrder().getId())) {
            throw new BusinessValidationException("Production output does not belong to the production order");
        }
        if (!companyId.equals(order.getCompanyId())) {
            throw new BusinessValidationException("Production order does not belong to the authenticated company");
        }
        if (!request.getUomId().equals(output.getUomId())) {
            throw new BusinessValidationException("UOM does not match the production output");
        }
        UUID expectedWarehouse = output.getWarehouseId() == null ? order.getWarehouseId() : output.getWarehouseId();
        UUID expectedLocation = output.getLocationId() == null ? order.getProductionLocationId() : output.getLocationId();
        if (!request.getWarehouseId().equals(expectedWarehouse)
                || (expectedLocation != null && !request.getLocationId().equals(expectedLocation))) {
            throw new BusinessValidationException("Warehouse or location does not match the production output");
        }
        if (output.getStatus() == ProductionOutputStatus.PRODUCED
                || output.getStatus() == ProductionOutputStatus.CANCELLED
                || output.getStatus() == ProductionOutputStatus.REJECTED) {
            throw new BusinessValidationException("Production output is not completable");
        }
    }

    private void updateOrderStatus(ProductionOrder order, BigDecimal completedQuantity, UUID companyId) {
        order.setProducedQuantity(nonNull(order.getProducedQuantity()).add(completedQuantity));
        order.setRemainingQuantity(nonNull(order.getPlannedQuantity()).subtract(order.getProducedQuantity()).max(BigDecimal.ZERO));
        List<ProductionOrderOutput> outputs = outputRepository.findAllByProductionOrder_IdAndCompanyId(order.getId(), companyId);
        boolean allProduced = outputs.stream().allMatch(output -> output.getStatus() == ProductionOutputStatus.PRODUCED);
        boolean allMaterialsConsumed = materialRepository.findAllByProductionOrderIdAndCompanyId(order.getId(), companyId)
                .stream().allMatch(material -> material.getStatus() == ProductionMaterialStatus.CONSUMED);
        if (allProduced && allMaterialsConsumed) {
            order.setStatus(ProductionOrderStatus.COMPLETED);
            order.setCompletedAt(LocalDateTime.now());
            order.setCompletedBy(TenantUtils.getCurrentUserId());
        } else {
            order.setStatus(ProductionOrderStatus.PARTIALLY_COMPLETED);
        }
        productionOrderRepository.save(order);
    }

        private ProductionStockInCostedInventoryResponse callCostedInventory(InventoryApiRequest<ProductionStockInCostedInventoryRequest> request,
                                           UUID companyId) {
        try {
            ResponseEntity<InventoryApiResponse<ProductionStockInCostedInventoryResponse>> response =
                inventoryFeignClient.createCostedProductionStockIn(request, companyId);
            InventoryApiResponse<ProductionStockInCostedInventoryResponse> body = response == null ? null : response.getBody();
            if (body == null || !body.isSuccess() || body.getData() == null
                    || body.getData().getInventoryMovementId() == null
                    || !"PRODUCTION_IN".equals(body.getData().getMovementType())
                    || !"PRODUCTION".equals(body.getData().getReferenceType())
                    || !companyId.equals(body.getData().getCompanyId())) {
                throw new ExternalServiceException("Inventory rejected production stock-in");
            }
            return body.getData();
        } catch (FeignException exception) {
            throw new ExternalServiceException("Inventory production stock-in call failed", exception);
        }
    }

    private void saveOutbox(UUID companyId, ProductionOrder order, ProductionOrderOutput output,
                            ProductionCompletion completion, ProductionCompletionRequest request,
                            ProductionStockInCostedInventoryResponse inventory, String completionKey,
                            boolean accountingEligible) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("companyId", companyId.toString());
        payload.put("productionOrderId", order.getId().toString());
        payload.put("productionOrderOutputId", output.getId().toString());
        payload.put("productionCompletionId", completion.getId().toString());
        payload.put("sourceModule", AccountingEventIdentity.SOURCE_MODULE);
        payload.put("sourceId", AccountingEventIdentity.sourceId(completionKey).toString());
        payload.put("eventType", OutboxEventType.PRODUCTION_COMPLETION.name());
        BigDecimal inventoryUnitCost = inventory.getUnitCost() == null ? BigDecimal.ZERO : inventory.getUnitCost();
        payload.put("amount", request.getQuantity().multiply(inventoryUnitCost).toPlainString());
        payload.put("accountingEligible", accountingEligible);
        payload.put("productId", output.getProductId().toString());
        payload.put("quantity", request.getQuantity().toPlainString());
        payload.put("uomId", request.getUomId().toString());
        payload.put("warehouseId", request.getWarehouseId().toString());
        payload.put("locationId", request.getLocationId().toString());
        payload.put("inventoryMovementId", inventory.getInventoryMovementId().toString());
        if (request.getBatchId() != null) payload.put("batchId", request.getBatchId().toString());
        if (request.getSerialId() != null) payload.put("serialId", request.getSerialId().toString());
        outboxRepository.save(ManufacturingOutbox.builder().companyId(companyId)
                .aggregateType("PRODUCTION_COMPLETION").aggregateId(completion.getId())
                .eventType(OutboxEventType.PRODUCTION_COMPLETION).idempotencyKey(completionKey)
                .payload(payload).status(OutboxStatus.PENDING).retryCount(0)
                .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build());
    }

    private void saveAccountingEvent(UUID companyId, UUID productionOrderId, String idempotencyKey,
                                     BigDecimal amount, String currencyCode, String referenceNo) {
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
                .eventType(OutboxEventType.PRODUCTION_COMPLETION)
                .sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                .sourceId(AccountingEventIdentity.sourceId(idempotencyKey))
                .referenceNo(referenceNo).amount(amount).currencyCode(currencyCode)
                .idempotencyKey(idempotencyKey).status(AccountingEventStatus.PENDING)
                .createdAt(now).updatedAt(now).build());
    }

    private String deterministicKey(UUID companyId, UUID orderId, UUID outputId, String requestKey) {
        return companyId + ":" + orderId + ":" + outputId + ":" + requestKey;
    }

    private ProductionCompletionResponse response(ProductionCompletion completion, ProductionOrder order,
                                                   ProductionCompletionRequest request, ProductionOrderOutput output) {
        return ProductionCompletionResponse.builder().productionCompletionId(completion.getId())
                .productionOrderId(order.getId()).productionOrderOutputId(request.getProductionOrderOutputId())
                .quantity(request.getQuantity()).uomId(request.getUomId()).inventoryMovementId(completion.getInventoryMovementId())
                .status(completion.getStatus()).outputStatus(output == null ? null : output.getStatus())
                .productionOrderStatus(order.getStatus()).build();
    }

    private BigDecimal nonNull(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
}
