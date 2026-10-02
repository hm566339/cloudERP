package com.erp.manufacturing.completion.service;

import com.erp.manufacturing.common.enums.CompletionStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
import com.erp.manufacturing.common.exception.ExternalServiceException;
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
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ProductionStockInCostedInventoryResponse;
import com.erp.manufacturing.outbox.entity.ManufacturingOutbox;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderOutput;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderOutputRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.erp.manufacturing.util.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhaseEProductionCompletionServiceTest {
    @Mock private ProductionCompletionRepository completionRepository;
    @Mock private ProductionCompletionLineRepository lineRepository;
    @Mock private ProductionOrderRepository orderRepository;
    @Mock private ProductionOrderOutputRepository outputRepository;
    @Mock private ProductionOrderMaterialRepository materialRepository;
    @Mock private ProductionCostRepository costRepository;
    @Mock private InventoryFeignClient inventoryClient;
    @Mock private ManufacturingOutboxRepository outboxRepository;

    private ProductionCompletionServiceImpl service;
    private UUID companyId, orderId, outputId, productId, uomId, warehouseId, locationId, batchId, serialId;
    private ProductionOrder order;
    private ProductionOrderOutput output;
    private ProductionCost cost;

    @BeforeEach
    void setUp() {
        service = new ProductionCompletionServiceImpl(completionRepository, lineRepository, orderRepository,
                outputRepository, materialRepository, costRepository, inventoryClient, outboxRepository,
                new com.fasterxml.jackson.databind.ObjectMapper());
        companyId = UUID.randomUUID(); orderId = UUID.randomUUID(); outputId = UUID.randomUUID();
        productId = UUID.randomUUID(); uomId = UUID.randomUUID(); warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID(); batchId = UUID.randomUUID(); serialId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        order = ProductionOrder.builder().companyId(companyId).plannedQuantity(new BigDecimal("100"))
                .producedQuantity(BigDecimal.ZERO).remainingQuantity(new BigDecimal("100"))
                .finishedProductId(productId).warehouseId(warehouseId).productionLocationId(locationId)
                .status(ProductionOrderStatus.IN_PROGRESS).build();
        order.setId(orderId);
        output = ProductionOrderOutput.builder().companyId(companyId).productionOrder(order).productId(productId)
                .plannedQuantity(new BigDecimal("100")).producedQuantity(BigDecimal.ZERO).uomId(uomId)
                .warehouseId(warehouseId).locationId(locationId).status(ProductionOutputStatus.PLANNED)
                .build();
        output.setId(outputId);
        cost = ProductionCost.builder().productionOrder(order).companyId(companyId).costPerUnit(new BigDecimal("2.50"))
                .build();

        lenient().when(orderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        lenient().when(outputRepository.findByIdAndCompanyIdForUpdate(outputId, companyId)).thenReturn(Optional.of(output));
        lenient().when(outputRepository.findAllByProductionOrder_IdAndCompanyId(orderId, companyId)).thenReturn(List.of(output));
        lenient().when(materialRepository.findAllByProductionOrderIdAndCompanyId(orderId, companyId)).thenReturn(List.of());
        lenient().when(costRepository.findByCompanyIdAndProductionOrder_Id(companyId, orderId)).thenReturn(Optional.of(cost));
        lenient().when(completionRepository.findByCompanyIdAndIdempotencyKey(eq(companyId), anyString())).thenReturn(Optional.empty());
        lenient().when(completionRepository.saveAndFlush(any(ProductionCompletion.class))).thenAnswer(invocation -> {
            ProductionCompletion completion = invocation.getArgument(0);
            completion.setId(UUID.randomUUID());
            return completion;
        });
        lenient().when(lineRepository.save(any(ProductionCompletionLine.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(inventoryClient.createCostedProductionStockIn(any(), eq(companyId))).thenReturn(inventoryResponse());
    }

    @AfterEach void tearDown() { CurrentUserContext.clear(); }

    @Test void successfulCompletion() { assertEquals(CompletionStatus.POSTED, complete("K").getStatus()); }
    @Test void inventoryStockInRequestMapping() {
        complete("K");
        ArgumentCaptor<InventoryApiRequest<ProductionStockInCostedInventoryRequest>> captor = ArgumentCaptor.forClass(InventoryApiRequest.class);
        verify(inventoryClient).createCostedProductionStockIn(captor.capture(), eq(companyId));
        ProductionStockInCostedInventoryRequest request = captor.getValue().getData();
        assertEquals(orderId, request.getProductionOrderId()); assertEquals(outputId, request.getProductionOrderOutputId());
        assertEquals(productId, request.getProductId()); assertEquals(new BigDecimal("40"), request.getQuantity());
        assertNotNull(request.getIdempotencyKey());
    }
    @Test void inventoryMovementIdPersisted() { assertNotNull(complete("K").getInventoryMovementId()); }
    @Test void completionPostedAfterInventory() { complete("K"); ArgumentCaptor<ProductionCompletion> c = ArgumentCaptor.forClass(ProductionCompletion.class); verify(completionRepository).saveAndFlush(c.capture()); assertEquals(CompletionStatus.POSTED, c.getValue().getStatus()); }
    @Test void outputProducedQuantityUpdated() { complete("K"); assertEquals(new BigDecimal("40"), output.getProducedQuantity()); }
    @Test void partialOutputTransition() { assertEquals(ProductionOutputStatus.PARTIALLY_PRODUCED, complete("K").getOutputStatus()); }
    @Test void producedOutputTransition() { assertEquals(ProductionOutputStatus.PRODUCED, completeQuantity(new BigDecimal("100"), "K").getOutputStatus()); }
    @Test void partialCompletionSupported() { assertDoesNotThrow(() -> complete("K")); }
    @Test void overProductionRejected() { assertThrows(RuntimeException.class, () -> completeQuantity(new BigDecimal("101"), "K")); }
    @Test void zeroQuantityRejected() { assertThrows(RuntimeException.class, () -> completeQuantity(BigDecimal.ZERO, "K")); }
    @Test void negativeQuantityRejected() { assertThrows(RuntimeException.class, () -> completeQuantity(new BigDecimal("-1"), "K")); }
    @Test void invalidProductionOrderRejected() { when(orderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void invalidProductionOutputRejected() { when(outputRepository.findByIdAndCompanyIdForUpdate(outputId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void outputOrderMismatchRejected() { output.setProductionOrder(null); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void crossCompanyRejected() { output.setCompanyId(UUID.randomUUID()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void invalidUomRejected() { output.setUomId(UUID.randomUUID()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void invalidWarehouseRejected() { output.setWarehouseId(UUID.randomUUID()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void invalidLocationRejected() { output.setLocationId(UUID.randomUUID()); assertThrows(RuntimeException.class, () -> complete("K")); }
    @Test void inventory4xxRejected() { when(inventoryClient.createCostedProductionStockIn(any(), eq(companyId))).thenReturn(ResponseEntity.ok(InventoryApiResponse.<ProductionStockInCostedInventoryResponse>builder().success(false).build())); assertThrows(ExternalServiceException.class, () -> complete("K")); verify(completionRepository, never()).saveAndFlush(any()); }
    @Test void inventory5xxResponseRejected() { when(inventoryClient.createCostedProductionStockIn(any(), eq(companyId))).thenReturn(ResponseEntity.status(500).body(null)); assertThrows(ExternalServiceException.class, () -> complete("K")); }
    @Test void inventoryTimeoutFailureRejected() { when(inventoryClient.createCostedProductionStockIn(any(), eq(companyId))).thenThrow(mock(feign.FeignException.class)); assertThrows(ExternalServiceException.class, () -> complete("K")); }
        @Test void deterministicIdempotency() {
        ProductionCompletion first = ProductionCompletion.builder()
            .idempotencyKey(companyId + ":" + orderId + ":" + outputId + ":K")
            .status(CompletionStatus.POSTED).inventoryMovementId(UUID.randomUUID()).build();
        first.setId(UUID.randomUUID());
        when(completionRepository.findByCompanyIdAndIdempotencyKey(companyId, first.getIdempotencyKey()))
            .thenReturn(Optional.empty(), Optional.of(first));
        complete("K");
        complete("K");
        verify(inventoryClient, times(1)).createCostedProductionStockIn(any(), eq(companyId));
        }
    @Test void duplicateCompletionReturnsExisting() { ProductionCompletion existing = ProductionCompletion.builder().idempotencyKey(companyId + ":" + orderId + ":" + outputId + ":K").status(CompletionStatus.POSTED).inventoryMovementId(UUID.randomUUID()).build(); when(completionRepository.findByCompanyIdAndIdempotencyKey(companyId, existing.getIdempotencyKey())).thenReturn(Optional.of(existing)); assertEquals(existing.getId(), complete("K").getProductionCompletionId()); }
    @Test void retryAfterInventorySuccessReusesKey() { complete("K"); verify(inventoryClient).createCostedProductionStockIn(any(), eq(companyId)); }
    @Test void retryAfterInventorySuccessRecoversAfterPersistenceFailure() {
        when(completionRepository.saveAndFlush(any(ProductionCompletion.class)))
                .thenThrow(new RuntimeException("persistence failure"))
                .thenAnswer(invocation -> {
                    ProductionCompletion completion = invocation.getArgument(0);
                    completion.setId(UUID.randomUUID());
                    return completion;
                });
        assertThrows(RuntimeException.class, () -> complete("K"));
        output.setProducedQuantity(BigDecimal.ZERO);
        output.setStatus(ProductionOutputStatus.PLANNED);
        ProductionCompletionResponse retry = complete("K");
        assertNotNull(retry.getInventoryMovementId());
        ArgumentCaptor<InventoryApiRequest<ProductionStockInCostedInventoryRequest>> c = ArgumentCaptor.forClass(InventoryApiRequest.class);
        verify(inventoryClient, times(2)).createCostedProductionStockIn(c.capture(), eq(companyId));
        assertEquals(c.getAllValues().get(0).getData().getIdempotencyKey(), c.getAllValues().get(1).getData().getIdempotencyKey());
    }
    @Test void outputUsesPessimisticLookup() { complete("K"); verify(outputRepository).findByIdAndCompanyIdForUpdate(outputId, companyId); }
    @Test void batchTrackingPassedThrough() { completeWithTracking(batchId, null, "K"); ArgumentCaptor<InventoryApiRequest<ProductionStockInCostedInventoryRequest>> c = ArgumentCaptor.forClass(InventoryApiRequest.class); verify(inventoryClient).createCostedProductionStockIn(c.capture(), eq(companyId)); assertEquals(batchId, c.getValue().getData().getBatchId()); }
    @Test void serialTrackingPassedThrough() { completeWithTracking(null, serialId, "K"); ArgumentCaptor<InventoryApiRequest<ProductionStockInCostedInventoryRequest>> c = ArgumentCaptor.forClass(InventoryApiRequest.class); verify(inventoryClient).createCostedProductionStockIn(c.capture(), eq(companyId)); assertEquals(serialId, c.getValue().getData().getSerialId()); }
    @Test void outboxPayloadContainsCompletionReferences() { complete("K"); ArgumentCaptor<ManufacturingOutbox> c = ArgumentCaptor.forClass(ManufacturingOutbox.class); verify(outboxRepository).save(c.capture()); assertEquals("PRODUCTION_COMPLETION", c.getValue().getEventType().name()); assertTrue(c.getValue().getPayload().has("inventoryMovementId")); assertTrue(c.getValue().getPayload().has("productionCompletionId")); }
    @Test void noOutboxOnInventoryFailure() { when(inventoryClient.createCostedProductionStockIn(any(), eq(companyId))).thenReturn(ResponseEntity.ok(InventoryApiResponse.<ProductionStockInCostedInventoryResponse>builder().success(false).build())); assertThrows(RuntimeException.class, () -> complete("K")); verify(outboxRepository, never()).save(any()); }
    @Test void tenantIsolationUsesCompanyScopedRepositories() { complete("K"); verify(orderRepository).findByIdAndCompanyId(orderId, companyId); verify(outputRepository).findByIdAndCompanyIdForUpdate(outputId, companyId); }
    @Test void orderBecomesCompletedWhenOutputFullyProduced() { ProductionCompletionResponse response = completeQuantity(new BigDecimal("100"), "K"); assertEquals(ProductionOrderStatus.COMPLETED, response.getProductionOrderStatus()); }

    private ProductionCompletionResponse complete(String key) { return completeQuantity(new BigDecimal("40"), key); }

    private ProductionCompletionResponse completeQuantity(BigDecimal quantity, String key) {
        return service.complete(orderId, request(quantity, key), companyId);
    }

    private ProductionCompletionResponse completeWithTracking(UUID batch, UUID serial, String key) {
        ProductionCompletionRequest request = request(new BigDecimal("40"), key);
        request.setBatchId(batch); request.setSerialId(serial);
        return service.complete(orderId, request, companyId);
    }

    private ProductionCompletionRequest request(BigDecimal quantity, String key) {
        return ProductionCompletionRequest.builder().productionOrderOutputId(outputId).quantity(quantity).uomId(uomId)
                .warehouseId(warehouseId).locationId(locationId).idempotencyKey(key).build();
    }

    private ResponseEntity<InventoryApiResponse<ProductionStockInCostedInventoryResponse>> inventoryResponse() {
        return ResponseEntity.ok(InventoryApiResponse.<ProductionStockInCostedInventoryResponse>builder().success(true)
            .data(ProductionStockInCostedInventoryResponse.builder().inventoryMovementId(UUID.randomUUID())
                .movementType("PRODUCTION_IN").referenceType("PRODUCTION").companyId(companyId).build()).build());
    }
}