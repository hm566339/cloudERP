package com.erp.manufacturing.integration.inventory;

import com.erp.manufacturing.accounting.entity.ManufacturingAccountingEvent;
import com.erp.manufacturing.accounting.enums.AccountingEventStatus;
import com.erp.manufacturing.accounting.repository.ManufacturingAccountingEventRepository;
import com.erp.manufacturing.accounting.util.AccountingEventIdentity;
import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.entity.BomItem;
import com.erp.manufacturing.bom.entity.BomRevision;
import com.erp.manufacturing.bom.repository.BomItemRepository;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.bom.repository.BomRevisionRepository;
import com.erp.manufacturing.common.enums.*;
import com.erp.manufacturing.common.exception.ExternalServiceException;
import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.dto.ProductionCompletionResponse;
import com.erp.manufacturing.completion.repository.ProductionCompletionRepository;
import com.erp.manufacturing.completion.service.ProductionCompletionService;
import com.erp.manufacturing.consumption.dto.request.MaterialConsumptionRequest;
import com.erp.manufacturing.consumption.dto.response.MaterialConsumptionResponse;
import com.erp.manufacturing.consumption.repository.MaterialConsumptionRepository;
import com.erp.manufacturing.consumption.service.MaterialConsumptionService;
import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.integration.accounting.service.ManufacturingAccountingDispatcher;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.*;
import com.erp.manufacturing.integration.inventory.entity.ManufacturingOperationRecord;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationStatus;
import com.erp.manufacturing.integration.inventory.enums.ManufacturingOperationType;
import com.erp.manufacturing.integration.inventory.repository.ManufacturingOperationRecordRepository;
import com.erp.manufacturing.integration.inventory.service.ManufacturingInventoryReconciliationService;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.security.dto.sso.CompanyResponse;
import com.erp.manufacturing.security.dto.sso.ResponseWrapper;
import com.erp.manufacturing.security.sso.SsoFeignClient;
import com.erp.manufacturing.util.CurrentUserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import feign.FeignException;
import feign.Request;
import feign.RequestTemplate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
public class ManufacturingInventoryIdempotencyAndFailureRecoveryTest {

    @Autowired private MaterialConsumptionService consumptionService;
    @Autowired private MaterialConsumptionRepository consumptionRepository;
    @Autowired private ProductionCompletionService completionService;
    @Autowired private ProductionCompletionRepository completionRepository;
    @Autowired private ProductionOrderRepository productionOrderRepository;
    @Autowired private ProductionOrderMaterialRepository materialRepository;
    @Autowired private ProductionOrderOutputRepository outputRepository;
    @Autowired private ProductionCostRepository costRepository;
    @Autowired private ManufacturingOperationRecordRepository operationRecordRepository;
    @Autowired private ManufacturingOutboxRepository outboxRepository;
    @Autowired private ManufacturingAccountingEventRepository accountingEventRepository;
    @Autowired private ManufacturingAccountingDispatcher accountingDispatcher;
    @Autowired private ManufacturingInventoryReconciliationService reconciliationService;
    @Autowired private BomRepository bomRepository;
    @Autowired private BomRevisionRepository bomRevisionRepository;
    @Autowired private BomItemRepository bomItemRepository;
    @Autowired private ObjectMapper objectMapper;

    @MockitoBean private InventoryFeignClient inventoryFeignClient;
    @MockitoBean private SsoFeignClient ssoFeignClient;

    private UUID companyId1;
    private UUID companyId2;
    private UUID warehouseId;
    private UUID locationId;
    private UUID productId;
    private UUID outputProductId;
    private UUID uomId;
    private UUID reservationId;

    private ProductionOrder orderCompany1;
    private ProductionOrderMaterial materialCompany1;
    private ProductionOrderOutput outputCompany1;

    @BeforeEach
    void setUp() {
        companyId1 = UUID.randomUUID();
        companyId2 = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        productId = UUID.randomUUID();
        outputProductId = UUID.randomUUID();
        uomId = UUID.randomUUID();
        reservationId = UUID.randomUUID();

        // SSO mocks
        when(ssoFeignClient.verifyCompany(eq(companyId1), any(), any())).thenReturn(
                ResponseWrapper.success(CompanyResponse.builder().id(companyId1).baseCurrency("USD").build()));
        when(ssoFeignClient.verifyCompany(eq(companyId2), any(), any())).thenReturn(
                ResponseWrapper.success(CompanyResponse.builder().id(companyId2).baseCurrency("USD").build()));

        // Setup BOM for company 1
        Bom bom = bomRepository.save(stamp(Bom.builder().companyId(companyId1).bomNumber("BOM-" + UUID.randomUUID())
                .finishedProductId(outputProductId).name("Test BOM").bomType(BomType.STANDARD)
                .status(BomStatus.ACTIVE).isDefault(true).currentRevision(1).build()));

        BomRevision rev = bomRevisionRepository.save(stamp(BomRevision.builder().companyId(companyId1)
                .bom(bom).revisionNumber(1).status(BomRevisionStatus.ACTIVE).build()));

        BomItem bomItem = bomItemRepository.save(stamp(BomItem.builder()
                .companyId(companyId1).bomRevision(rev).componentProductId(productId)
                .quantity(new BigDecimal("1.0000")).uomId(uomId)
                .scrapPercentage(BigDecimal.ZERO).wastagePercentage(BigDecimal.ZERO)
                .sequenceNo(1).isOptional(false).isActive(true).build()));

        // Setup ProductionOrder for company 1
        orderCompany1 = productionOrderRepository.save(stamp(ProductionOrder.builder()
                .companyId(companyId1).productionOrderNo("PO-" + UUID.randomUUID())
                .finishedProductId(outputProductId).bom(bom).bomRevision(rev)
                .warehouseId(warehouseId).productionLocationId(locationId)
                .plannedQuantity(new BigDecimal("10.0000")).producedQuantity(BigDecimal.ZERO)
                .rejectedQuantity(BigDecimal.ZERO).scrapQuantity(BigDecimal.ZERO)
                .remainingQuantity(new BigDecimal("10.0000")).status(ProductionOrderStatus.RELEASED).build()));

        // Setup Material
        materialCompany1 = materialRepository.save(stamp(ProductionOrderMaterial.builder()
                .companyId(companyId1).productionOrder(orderCompany1).bomItem(bomItem)
                .componentProductId(productId).plannedQuantity(new BigDecimal("10.0000"))
                .consumedQuantity(BigDecimal.ZERO).reservedQuantity(new BigDecimal("10.0000"))
                .returnedQuantity(BigDecimal.ZERO).wastageQuantity(BigDecimal.ZERO).scrapQuantity(BigDecimal.ZERO)
                .sequenceNo(1).uomId(uomId).inventoryReservationId(reservationId)
                .status(ProductionMaterialStatus.RESERVED).build()));

        // Setup Output
        outputCompany1 = outputRepository.save(stamp(ProductionOrderOutput.builder()
                .companyId(companyId1).productionOrder(orderCompany1)
                .productId(outputProductId).outputType(ProductionOutputType.FINISHED_GOOD)
                .plannedQuantity(new BigDecimal("10.0000")).producedQuantity(BigDecimal.ZERO)
                .rejectedQuantity(BigDecimal.ZERO).scrapQuantity(BigDecimal.ZERO)
                .uomId(uomId).warehouseId(warehouseId).locationId(locationId)
                .status(ProductionOutputStatus.PLANNED).build()));

        // Setup Cost
        costRepository.save(stamp(ProductionCost.builder().companyId(companyId1).productionOrder(orderCompany1)
                .materialCost(new BigDecimal("100.0000")).laborCost(BigDecimal.ZERO).machineCost(BigDecimal.ZERO)
                .overheadCost(BigDecimal.ZERO).subcontractCost(BigDecimal.ZERO).scrapRecovery(BigDecimal.ZERO)
                .byProductCredit(BigDecimal.ZERO).totalCost(new BigDecimal("100.0000"))
                .goodOutputQuantity(new BigDecimal("10.0000")).costPerUnit(new BigDecimal("10.0000"))
                .currencyCode("USD").status(ProductionCostStatus.FINALIZED)
                .calculatedAt(LocalDateTime.now()).build()));
    }

    private <T extends com.erp.manufacturing.common.entity.BaseEntity> T stamp(T entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setIsDeleted(false);
        return entity;
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Requirement 1 & 5: The same consumption request sent twice returns original result without second Inventory call")
    void testSameConsumptionRequestSentTwice() {
        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(), eq(companyId1)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .companyId(companyId1)
                                .quantity(new BigDecimal("4.0000"))
                                .build())));

        when(inventoryFeignClient.getProductionStockOutCost(any(), eq(orderCompany1.getId()), eq(materialCompany1.getId()), eq(companyId1)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutCostInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementLineId(UUID.randomUUID())
                                .productionOrderId(orderCompany1.getId())
                                .productionOrderMaterialId(materialCompany1.getId())
                                .productId(productId)
                                .unitCost(new BigDecimal("10.0000"))
                                .totalCost(new BigDecimal("40.0000"))
                                .currencyCode("USD")
                                .build())));

        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialCompany1.getId())
                .quantity(new BigDecimal("4.0000"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("OP-CONS-001")
                .build();

        // First call
        MaterialConsumptionResponse firstResponse = consumptionService.consumeMaterial(orderCompany1.getId(), request, companyId1);
        assertNotNull(firstResponse);
        assertEquals(movementId, firstResponse.getInventoryMovementId());

        // Second call with same idempotency key
        MaterialConsumptionResponse secondResponse = consumptionService.consumeMaterial(orderCompany1.getId(), request, companyId1);
        assertNotNull(secondResponse);
        assertEquals(firstResponse.getMaterialConsumptionId(), secondResponse.getMaterialConsumptionId());
        assertEquals(firstResponse.getInventoryMovementId(), secondResponse.getInventoryMovementId());

        // Inventory Feign call should have occurred only ONCE!
        verify(inventoryFeignClient, times(1)).createProductionStockOut(any(), eq(companyId1));
    }

    @Test
    @DisplayName("Requirement 1 & 5: The same production completion request sent twice returns original result without second Inventory call")
    void testSameProductionCompletionRequestSentTwice() {
        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createCostedProductionStockIn(any(), eq(companyId1)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockInCostedInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_IN")
                                .referenceType("PRODUCTION")
                                .companyId(companyId1)
                                .quantity(new BigDecimal("5.0000"))
                                .unitCost(new BigDecimal("10.0000"))
                                .totalCost(new BigDecimal("50.0000"))
                                .build())));

        ProductionCompletionRequest request = ProductionCompletionRequest.builder()
                .productionOrderOutputId(outputCompany1.getId())
                .quantity(new BigDecimal("5.0000"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .idempotencyKey("OP-COMP-001")
                .build();

        // First call
        ProductionCompletionResponse firstResponse = completionService.complete(orderCompany1.getId(), request, companyId1);
        assertNotNull(firstResponse);
        assertEquals(movementId, firstResponse.getInventoryMovementId());

        // Second call with same idempotency key
        ProductionCompletionResponse secondResponse = completionService.complete(orderCompany1.getId(), request, companyId1);
        assertNotNull(secondResponse);
        assertEquals(firstResponse.getProductionCompletionId(), secondResponse.getProductionCompletionId());
        assertEquals(firstResponse.getInventoryMovementId(), secondResponse.getInventoryMovementId());

        // Inventory Feign call should have occurred only ONCE!
        verify(inventoryFeignClient, times(1)).createCostedProductionStockIn(any(), eq(companyId1));
    }

    @Test
    @DisplayName("Requirement 2 & 8: Timeout after Inventory changes stock recovers via idempotency lookup")
    void testConsumptionTimeoutWithSuccessfulInventoryUpdateRecovers() {
        UUID movementId = UUID.randomUUID();
        Request feignRequest = Request.create(Request.HttpMethod.POST, "/api/inventory/integration/production/stock-out",
                Collections.emptyMap(), null, StandardCharsets.UTF_8, new RequestTemplate());

        // Stock-out call throws a network timeout exception
        when(inventoryFeignClient.createProductionStockOut(any(), eq(companyId1)))
                .thenThrow(new FeignException.GatewayTimeout("HTTP 504 Gateway Timeout", feignRequest, null, Collections.emptyMap()));

        // Initial idempotency lookup before call finds nothing, subsequent lookup after timeout discovers the movement
        when(inventoryFeignClient.getMovementByIdempotencyKey(any(), eq(companyId1)))
                .thenThrow(new FeignException.NotFound("Not found", feignRequest, null, Collections.emptyMap()))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .companyId(companyId1)
                                .quantity(new BigDecimal("3.0000"))
                                .build())));

        when(inventoryFeignClient.getProductionStockOutCost(any(), eq(orderCompany1.getId()), eq(materialCompany1.getId()), eq(companyId1)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutCostInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementLineId(UUID.randomUUID())
                                .productionOrderId(orderCompany1.getId())
                                .productionOrderMaterialId(materialCompany1.getId())
                                .productId(productId)
                                .unitCost(new BigDecimal("10.0000"))
                                .totalCost(new BigDecimal("30.0000"))
                                .currencyCode("USD")
                                .build())));

        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialCompany1.getId())
                .quantity(new BigDecimal("3.0000"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("OP-TIMEOUT-001")
                .build();

        // Should recover seamlessly and return the response with movementId
        MaterialConsumptionResponse response = consumptionService.consumeMaterial(orderCompany1.getId(), request, companyId1);
        assertNotNull(response);
        assertEquals(movementId, response.getInventoryMovementId());

        // Operation record should be SUCCEEDED
        Optional<ManufacturingOperationRecord> op = operationRecordRepository.findByCompanyIdAndOperationTypeAndIdempotencyKey(
                companyId1, ManufacturingOperationType.MATERIAL_CONSUMPTION,
                companyId1 + ":" + orderCompany1.getId() + ":" + materialCompany1.getId() + ":OP-TIMEOUT-001");
        assertTrue(op.isPresent());
        assertEquals(ManufacturingOperationStatus.SUCCEEDED, op.get().getStatus());
        assertEquals(movementId, op.get().getInventoryReferenceId());
    }

    @Test
    @DisplayName("Requirement 3 & 12: Network failure marks RECONCILIATION_REQUIRED and reconciles later")
    void testInventoryUnavailableAndScheduledReconciliation() {
        UUID movementId = UUID.randomUUID();
        Request feignRequest = Request.create(Request.HttpMethod.POST, "/api/inventory/integration/production/stock-out",
                Collections.emptyMap(), null, StandardCharsets.UTF_8, new RequestTemplate());

        // Both stock-out and initial lookup throw exception (inventory down)
        when(inventoryFeignClient.createProductionStockOut(any(), eq(companyId1)))
                .thenThrow(new FeignException.ServiceUnavailable("HTTP 503 Service Unavailable", feignRequest, null, Collections.emptyMap()));
        when(inventoryFeignClient.getMovementByIdempotencyKey(any(), eq(companyId1)))
                .thenThrow(new FeignException.ServiceUnavailable("HTTP 503 Service Unavailable", feignRequest, null, Collections.emptyMap()));

        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialCompany1.getId())
                .quantity(new BigDecimal("2.0000"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("OP-RECON-001")
                .build();

        assertThrows(ExternalServiceException.class, () ->
                consumptionService.consumeMaterial(orderCompany1.getId(), request, companyId1));

        String idempotencyKey = companyId1 + ":" + orderCompany1.getId() + ":" + materialCompany1.getId() + ":OP-RECON-001";
        ManufacturingOperationRecord op = operationRecordRepository.findByCompanyIdAndOperationTypeAndIdempotencyKey(
                companyId1, ManufacturingOperationType.MATERIAL_CONSUMPTION, idempotencyKey).orElseThrow();
        assertEquals(ManufacturingOperationStatus.RECONCILIATION_REQUIRED, op.getStatus());

        // Now Inventory comes back up and discovers the movement
        when(inventoryFeignClient.getMovementByIdempotencyKey(any(), eq(companyId1)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .companyId(companyId1)
                                .quantity(new BigDecimal("2.0000"))
                                .build())));

        // Run reconciliation
        reconciliationService.reconcilePendingAndUnknownOperations();

        ManufacturingOperationRecord reconciled = operationRecordRepository.findById(op.getId()).orElseThrow();
        assertEquals(ManufacturingOperationStatus.SUCCEEDED, reconciled.getStatus());
        assertEquals(movementId, reconciled.getInventoryReferenceId());
    }

    @Test
    @DisplayName("Requirement 5 & 11: Outbox processing multi-instance coordination with atomic claim")
    void testOutboxMultiInstanceCoordination() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("companyId", companyId1.toString());

        ManufacturingOutbox outbox = outboxRepository.save(ManufacturingOutbox.builder()
                .companyId(companyId1)
                .aggregateType("TEST")
                .aggregateId(UUID.randomUUID())
                .eventType(OutboxEventType.PRODUCTION_MATERIAL_RESERVATION)
                .idempotencyKey("OUTBOX-CLAIM-TEST")
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // Instance 1 claims it
        int claim1 = outboxRepository.claimForProcessing(outbox.getId(), OutboxStatus.PROCESSING,
                OutboxStatus.PENDING, OutboxStatus.FAILED, LocalDateTime.now());
        assertEquals(1, claim1, "Instance 1 should successfully claim the message");

        // Instance 2 tries to claim the same record concurrently
        int claim2 = outboxRepository.claimForProcessing(outbox.getId(), OutboxStatus.PROCESSING,
                OutboxStatus.PENDING, OutboxStatus.FAILED, LocalDateTime.now());
        assertEquals(0, claim2, "Instance 2 must NOT be able to claim an already claimed message");
    }

    @Test
    @DisplayName("Requirement 5: Non-accounting outbox events marked SUCCESS instead of stuck in PENDING")
    void testNonAccountingOutboxEventsMarkedSuccess() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("companyId", companyId1.toString());

        ManufacturingOutbox outbox = outboxRepository.save(ManufacturingOutbox.builder()
                .companyId(companyId1)
                .aggregateType("PRODUCTION_ORDER")
                .aggregateId(orderCompany1.getId())
                .eventType(OutboxEventType.PRODUCTION_MATERIAL_RESERVATION)
                .idempotencyKey("OUTBOX-NON-ACCT-01")
                .payload(payload)
                .status(OutboxStatus.PENDING)
                .retryCount(0)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        accountingDispatcher.dispatch(outbox.getId());

        ManufacturingOutbox processed = outboxRepository.findById(outbox.getId()).orElseThrow();
        assertEquals(OutboxStatus.SUCCESS, processed.getStatus(), "Non-accounting events must be marked SUCCESS");
        assertNotNull(processed.getProcessedAt());
    }

    @Test
    @DisplayName("Requirement 5: Outbox terminal failure transitions to DEAD_LETTER after 5 retries")
    void testOutboxTerminalFailureTransitionsToDeadLetter() {
        UUID sourceId = UUID.randomUUID();
        String acctKey = "ACCT-DL-" + sourceId;

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("sourceId", sourceId.toString());

        ManufacturingOutbox outbox = outboxRepository.save(ManufacturingOutbox.builder()
                .companyId(companyId1)
                .aggregateType("MATERIAL_CONSUMPTION")
                .aggregateId(UUID.randomUUID())
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .idempotencyKey(acctKey)
                .payload(payload)
                .status(OutboxStatus.FAILED)
                .retryCount(4) // 4 prior failures
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        accountingEventRepository.save(ManufacturingAccountingEvent.builder()
                .companyId(companyId1)
                .productionOrderId(orderCompany1.getId())
                .eventType(OutboxEventType.PRODUCTION_WIP_ACCUMULATION)
                .sourceModule(AccountingEventIdentity.SOURCE_MODULE)
                .sourceId(sourceId)
                .amount(new BigDecimal("100.0000"))
                .currencyCode("USD")
                .idempotencyKey(acctKey)
                .status(AccountingEventStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        // Dispatch will fail because Account Feign client throws exception
        accountingDispatcher.dispatch(outbox.getId());

        ManufacturingOutbox dlOutbox = outboxRepository.findById(outbox.getId()).orElseThrow();
        assertEquals(5, dlOutbox.getRetryCount());
        assertEquals(OutboxStatus.DEAD_LETTER, dlOutbox.getStatus());
        assertNull(dlOutbox.getNextAttemptAt());
    }

    @Test
    @DisplayName("Requirement 13: Cross-company idempotency isolation")
    void testCrossCompanyIdempotencyIsolation() {
        String commonKey = "COMMON-KEY-001";

        ManufacturingOperationRecord op1 = operationRecordRepository.save(ManufacturingOperationRecord.builder()
                .companyId(companyId1)
                .operationType(ManufacturingOperationType.MATERIAL_CONSUMPTION)
                .businessId(UUID.randomUUID())
                .idempotencyKey(commonKey)
                .status(ManufacturingOperationStatus.SUCCEEDED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        ManufacturingOperationRecord op2 = operationRecordRepository.save(ManufacturingOperationRecord.builder()
                .companyId(companyId2)
                .operationType(ManufacturingOperationType.MATERIAL_CONSUMPTION)
                .businessId(UUID.randomUUID())
                .idempotencyKey(commonKey)
                .status(ManufacturingOperationStatus.SUCCEEDED)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        assertNotNull(op1.getId());
        assertNotNull(op2.getId());
        assertNotEquals(op1.getId(), op2.getId());

        Optional<ManufacturingOperationRecord> found1 = operationRecordRepository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId1, ManufacturingOperationType.MATERIAL_CONSUMPTION, commonKey);
        Optional<ManufacturingOperationRecord> found2 = operationRecordRepository
                .findByCompanyIdAndOperationTypeAndIdempotencyKey(companyId2, ManufacturingOperationType.MATERIAL_CONSUMPTION, commonKey);

        assertTrue(found1.isPresent());
        assertTrue(found2.isPresent());
        assertEquals(companyId1, found1.get().getCompanyId());
        assertEquals(companyId2, found2.get().getCompanyId());
    }
}
