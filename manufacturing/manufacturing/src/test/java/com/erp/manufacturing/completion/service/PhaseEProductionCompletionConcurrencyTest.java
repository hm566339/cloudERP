package com.erp.manufacturing.completion.service;

import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.entity.BomRevision;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.bom.repository.BomRevisionRepository;
import com.erp.manufacturing.common.enums.BomRevisionStatus;
import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.common.enums.BomType;
import com.erp.manufacturing.common.enums.CompletionStatus;
import com.erp.manufacturing.common.enums.ProductionCostStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
import com.erp.manufacturing.common.enums.ProductionOutputType;
import com.erp.manufacturing.completion.entity.ProductionCompletion;
import com.erp.manufacturing.completion.entity.ProductionCompletionLine;
import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.repository.ProductionCompletionLineRepository;
import com.erp.manufacturing.completion.repository.ProductionCompletionRepository;
import com.erp.manufacturing.cost.entity.ProductionCost;
import com.erp.manufacturing.cost.repository.ProductionCostRepository;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryResponse;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.util.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
class PhaseEProductionCompletionConcurrencyTest {
    @Autowired private ProductionCompletionService completionService;
    @Autowired private ProductionOrderRepository orderRepository;
    @Autowired private ProductionOrderOutputRepository outputRepository;
    @Autowired private ProductionCompletionRepository completionRepository;
    @Autowired private ProductionCompletionLineRepository completionLineRepository;
    @Autowired private ProductionCostRepository costRepository;
    @Autowired private ProductionOrderMaterialRepository materialRepository;
    @Autowired private ManufacturingOutboxRepository outboxRepository;
    @Autowired private BomRepository bomRepository;
    @Autowired private BomRevisionRepository bomRevisionRepository;

    @MockitoBean private InventoryFeignClient inventoryFeignClient;

    private UUID companyId;
    private UUID orderId;
    private UUID outputId;
    private UUID productId;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        productId = UUID.randomUUID();
        uomId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();

        Bom bom = bomRepository.save(stamp(Bom.builder().companyId(companyId).bomNumber("BOM-" + companyId)
                .finishedProductId(productId).name("Concurrency BOM").bomType(BomType.STANDARD)
                .status(BomStatus.ACTIVE).isDefault(true).currentRevision(1).build()));
        BomRevision revision = bomRevisionRepository.save(stamp(BomRevision.builder().companyId(companyId)
                .bom(bom).revisionNumber(1).status(BomRevisionStatus.ACTIVE).build()));

        ProductionOrder order = stamp(ProductionOrder.builder().companyId(companyId)
                .productionOrderNo("PO-" + companyId).finishedProductId(productId).bom(bom).bomRevision(revision)
                .warehouseId(warehouseId).productionLocationId(locationId).plannedQuantity(new BigDecimal("100"))
                .producedQuantity(new BigDecimal("80")).rejectedQuantity(BigDecimal.ZERO).scrapQuantity(BigDecimal.ZERO)
                .remainingQuantity(new BigDecimal("20")).status(ProductionOrderStatus.IN_PROGRESS).build());
        order = orderRepository.save(order);
        orderId = order.getId();

        ProductionOrderOutput output = stamp(ProductionOrderOutput.builder().companyId(companyId)
                .productionOrder(order).productId(productId).outputType(ProductionOutputType.FINISHED_GOOD)
                .plannedQuantity(new BigDecimal("100")).producedQuantity(new BigDecimal("80"))
                .rejectedQuantity(BigDecimal.ZERO).scrapQuantity(BigDecimal.ZERO).uomId(uomId)
                .warehouseId(warehouseId).locationId(locationId).status(ProductionOutputStatus.PARTIALLY_PRODUCED)
                .build());
        output = outputRepository.save(output);
        outputId = output.getId();

        costRepository.save(stamp(ProductionCost.builder().companyId(companyId).productionOrder(order)
                .materialCost(new BigDecimal("200")).laborCost(BigDecimal.ZERO).machineCost(BigDecimal.ZERO)
                .overheadCost(BigDecimal.ZERO).subcontractCost(BigDecimal.ZERO).scrapRecovery(BigDecimal.ZERO)
                .byProductCredit(BigDecimal.ZERO).totalCost(new BigDecimal("200"))
                .goodOutputQuantity(new BigDecimal("100")).costPerUnit(new BigDecimal("2"))
                .currencyCode("USD").status(ProductionCostStatus.FINALIZED).calculatedAt(LocalDateTime.now()).build()));

        when(inventoryFeignClient.createCostedProductionStockIn(any(), eq(companyId)))
                .thenAnswer(invocation -> inventoryResponse(invocation.getArgument(0)));
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    void concurrentCompletionsAllowOnlyOneRequestToConsumeRemainingQuantity() throws Exception {
        CyclicBarrier start = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Throwable> first = executor.submit(() -> invokeConcurrently(start, "A"));
            Future<Throwable> second = executor.submit(() -> invokeConcurrently(start, "B"));

            List<Throwable> failures = Arrays.asList(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
            long successfulRequests = failures.stream().filter(value -> value == null).count();
            assertEquals(1, successfulRequests, "Exactly one concurrent completion should succeed");
            assertEquals(1, failures.stream().filter(value -> value != null).count(), "Exactly one request should be rejected");
                assertTrue(failures.stream().anyMatch(value -> value instanceof com.erp.manufacturing.common.exception.BusinessValidationException), failures.toString());
        } finally {
            executor.shutdownNow();
        }

        ProductionOrderOutput output = outputRepository.findById(outputId).orElseThrow();
        assertEquals(new BigDecimal("100.000000"), output.getProducedQuantity());
        assertEquals(ProductionOutputStatus.PRODUCED, output.getStatus());
        assertEquals(1, completionRepository.count());
        assertEquals(1, completionLineRepository.count());
        assertEquals(1, outboxRepository.count());
        verify(inventoryFeignClient, times(1)).createCostedProductionStockIn(any(), eq(companyId));
    }

    private Throwable invokeConcurrently(CyclicBarrier start, String key) {
        try {
            start.await(30, TimeUnit.SECONDS);
            CurrentUserContext.setCompanyId(companyId);
            completionService.complete(orderId, ProductionCompletionRequest.builder()
                    .productionOrderOutputId(outputId).quantity(new BigDecimal("20"))
                    .uomId(uomId).warehouseId(warehouseId).locationId(locationId)
                    .idempotencyKey(key).build(), companyId);
            return null;
        } catch (Throwable throwable) {
            return unwrap(throwable);
        } finally {
            CurrentUserContext.clear();
        }
    }

    private Throwable unwrap(Throwable throwable) {
        if (throwable instanceof ExecutionException && throwable.getCause() != null) {
            return throwable.getCause();
        }
        return throwable;
    }

        private ResponseEntity<InventoryApiResponse<ProductionStockInCostedInventoryResponse>> inventoryResponse(
            InventoryApiRequest<ProductionStockInCostedInventoryRequest> request) {
        ProductionStockInCostedInventoryRequest data = request.getData();
        return ResponseEntity.ok(InventoryApiResponse.<ProductionStockInCostedInventoryResponse>builder().success(true)
            .data(ProductionStockInCostedInventoryResponse.builder().inventoryMovementId(UUID.randomUUID())
                        .movementType("PRODUCTION_IN").referenceType("PRODUCTION")
                        .referenceId(data.getProductionOrderId()).referenceLineId(data.getProductionOrderOutputId())
                        .companyId(companyId).quantity(data.getQuantity()).uomId(data.getUomId()).status("POSTED")
                        .build()).build());
    }

    private <T extends com.erp.manufacturing.common.entity.BaseEntity> T stamp(T entity) {
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setIsDeleted(false);
        return entity;
    }
}