package com.erp.manufacturing.consumption.service;

import com.erp.manufacturing.common.enums.ConsumptionStatus;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.exception.BusinessValidationException;
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
import com.erp.manufacturing.util.CurrentUserContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PhaseDMaterialConsumptionServiceTest {

    @Mock private ProductionOrderRepository productionOrderRepository;
    @Mock private ProductionOrderMaterialRepository productionOrderMaterialRepository;
    @Mock private MaterialConsumptionRepository materialConsumptionRepository;
    @Mock private InventoryFeignClient inventoryFeignClient;
    @Mock private ManufacturingOutboxRepository outboxRepository;
    @Mock private com.erp.manufacturing.security.sso.CompanyCurrencyService companyCurrencyService;

    private MaterialConsumptionServiceImpl service;
    private UUID companyId;
    private UUID orderId;
    private UUID materialId;
    private UUID productId;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID reservationId;
    private ProductionOrder order;
    private ProductionOrderMaterial material;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        lenient().when(companyCurrencyService.getCompanyCurrency(companyId)).thenReturn("USD");
        service = new MaterialConsumptionServiceImpl(productionOrderRepository, productionOrderMaterialRepository,
                materialConsumptionRepository, inventoryFeignClient, outboxRepository, new ObjectMapper(), null, companyCurrencyService);
        orderId = UUID.randomUUID();
        materialId = UUID.randomUUID();
        productId = UUID.randomUUID();
        uomId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();
        reservationId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        order = ProductionOrder.builder()
                .companyId(companyId)
                .warehouseId(warehouseId)
                .productionLocationId(locationId)
                .status(ProductionOrderStatus.RELEASED)
                .build();
        order.setId(orderId);

        material = ProductionOrderMaterial.builder()
                .companyId(companyId)
                .componentProductId(productId)
                .plannedQuantity(new BigDecimal("100.00"))
                .consumedQuantity(BigDecimal.ZERO)
                .reservedQuantity(new BigDecimal("100.00"))
                .uomId(uomId)
                .inventoryReservationId(reservationId)
                .status(ProductionMaterialStatus.RESERVED)
                .build();
        material.setId(materialId);
        material.setProductionOrder(order);

        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderMaterialRepository.findByIdAndCompanyId(materialId, companyId)).thenReturn(Optional.of(material));
        lenient().when(materialConsumptionRepository.findByCompanyIdAndIdempotencyKey(eq(companyId), anyString())).thenReturn(Optional.empty());
        lenient().when(materialConsumptionRepository.saveAndFlush(any(MaterialConsumption.class))).thenAnswer(invocation -> {
            MaterialConsumption consumption = invocation.getArgument(0);
            if (consumption.getId() == null) {
                consumption.setId(UUID.randomUUID());
            }
            return consumption;
        });
        lenient().when(inventoryFeignClient.getProductionStockOutCost(any(), eq(orderId), eq(materialId), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(ProductionStockOutCostInventoryResponse.builder()
                        .inventoryMovementId(UUID.randomUUID()).movementLineId(UUID.randomUUID()).productionOrderId(orderId)
                        .productionOrderMaterialId(materialId).productId(productId).unitCost(new BigDecimal("2.00"))
                        .totalCost(new BigDecimal("200.00")).referenceType("PRODUCTION").build())));
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    void successfulPartialConsumptionUsesInventoryProductionStockOut() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .batchId(UUID.randomUUID())
                .idempotencyKey("op-1")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .referenceType("PRODUCTION")
                                .referenceId(orderId)
                                .referenceLineId(materialId)
                                .status("POSTED")
                                .build())));

        MaterialConsumptionResponse response = service.consumeMaterial(orderId, request, companyId);

        assertNotNull(response.getInventoryMovementId());
        assertEquals(movementId, response.getInventoryMovementId());
        assertEquals(ConsumptionStatus.POSTED, response.getStatus());
        assertEquals(ProductionMaterialStatus.PARTIALLY_CONSUMED, material.getStatus());
        assertEquals(new BigDecimal("40.00"), material.getConsumedQuantity());

        ArgumentCaptor<InventoryApiRequest> requestCaptor = ArgumentCaptor.forClass(InventoryApiRequest.class);
        verify(inventoryFeignClient).createProductionStockOut(requestCaptor.capture(), eq(companyId));
        ProductionStockOutInventoryRequest payload = (ProductionStockOutInventoryRequest) requestCaptor.getValue().getData();
        assertEquals(orderId, payload.getProductionOrderId());
        assertEquals(materialId, payload.getProductionOrderMaterialId());
        assertEquals(productId, payload.getProductId());
        assertEquals(new BigDecimal("40.00"), payload.getQuantity());
        assertEquals(reservationId, payload.getReservationId());
        assertNotNull(payload.getIdempotencyKey());

        verify(outboxRepository).save(any(ManufacturingOutbox.class));
    }

    @Test
    void overConsumptionIsRejectedBeforeCallingInventory() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("101.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("op-2")
                .build();

        assertThrows(BusinessValidationException.class, () -> service.consumeMaterial(orderId, request, companyId));
        verify(inventoryFeignClient, never()).createProductionStockOut(any(), any());
    }

    @Test
    void deterministicIdempotencySkipsDuplicateConsumption() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("op-1")
                .build();

        MaterialConsumption existing = MaterialConsumption.builder()
                .companyId(companyId)
                .productionOrder(order)
                .productionOrderMaterial(material)
                .componentProductId(productId)
                .plannedQuantity(new BigDecimal("100.00"))
                .actualQuantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .status(ConsumptionStatus.POSTED)
                .inventoryMovementId(UUID.randomUUID())
                .idempotencyKey("" + companyId + ":" + orderId + ":" + materialId + ":op-1")
                .consumptionDate(LocalDateTime.now())
                .build();

        when(materialConsumptionRepository.findByCompanyIdAndIdempotencyKey(eq(companyId), anyString()))
                .thenReturn(Optional.of(existing));

        MaterialConsumptionResponse response = service.consumeMaterial(orderId, request, companyId);

        assertEquals(existing.getInventoryMovementId(), response.getInventoryMovementId());
        verify(inventoryFeignClient, never()).createProductionStockOut(any(), any());
    }

    @Test
    void statusTransitionAndRejectedExtraConsumptionAreValidated() {
        MaterialConsumptionRequest firstRequest = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("op-40")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .referenceType("PRODUCTION")
                                .referenceId(orderId)
                                .referenceLineId(materialId)
                                .status("POSTED")
                                .build())));

        MaterialConsumptionResponse first = service.consumeMaterial(orderId, firstRequest, companyId);
        assertEquals(new BigDecimal("40.00"), material.getConsumedQuantity());
        assertEquals(ProductionMaterialStatus.PARTIALLY_CONSUMED, material.getStatus());
        assertEquals(movementId, first.getInventoryMovementId());

        MaterialConsumptionRequest secondRequest = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("60.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("op-60")
                .build();

        MaterialConsumptionResponse second = service.consumeMaterial(orderId, secondRequest, companyId);
        assertEquals(new BigDecimal("100.00"), material.getConsumedQuantity());
        assertEquals(ProductionMaterialStatus.CONSUMED, material.getStatus());
        assertEquals(movementId, second.getInventoryMovementId());

        MaterialConsumptionRequest thirdRequest = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("1.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("op-extra")
                .build();

        assertThrows(BusinessValidationException.class, () -> service.consumeMaterial(orderId, thirdRequest, companyId));
        assertEquals(new BigDecimal("100.00"), material.getConsumedQuantity());
        verify(inventoryFeignClient, times(2)).createProductionStockOut(any(), eq(companyId));
    }

    @Test
    void validationRejectsInvalidInputsBeforeInventoryCall() {
        MaterialConsumptionRequest invalidZero = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(BigDecimal.ZERO)
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("zero")
                .build();
        assertThrows(BusinessValidationException.class, () -> service.consumeMaterial(orderId, invalidZero, companyId));

        MaterialConsumptionRequest invalidNegative = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("-1.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("negative")
                .build();
        assertThrows(BusinessValidationException.class, () -> service.consumeMaterial(orderId, invalidNegative, companyId));

        MaterialConsumptionRequest invalidOrder = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("bad-order")
                .build();
        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> service.consumeMaterial(orderId, invalidOrder, companyId));

        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        when(productionOrderMaterialRepository.findByIdAndCompanyId(materialId, companyId)).thenReturn(Optional.empty());
        assertThrows(Exception.class, () -> service.consumeMaterial(orderId, invalidOrder, companyId));

        verify(inventoryFeignClient, never()).createProductionStockOut(any(), any());
    }

    @Test
    void inventoryFailureDoesNotPostConsumptionOrPersistMovement() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("fail-4xx")
                .build();

        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.status(400).body(InventoryApiResponse.<ProductionStockOutInventoryResponse>builder()
                        .success(false)
                        .status(400)
                        .message("bad request")
                        .build()));

        assertThrows(RuntimeException.class, () -> service.consumeMaterial(orderId, request, companyId));
        assertEquals(BigDecimal.ZERO, material.getConsumedQuantity());
        assertEquals(ProductionMaterialStatus.RESERVED, material.getStatus());
        verify(outboxRepository, never()).save(any(ManufacturingOutbox.class));
    }

    @Test
    void batchAndSerialArePassedThroughToInventoryRequest() {
        UUID batchId = UUID.randomUUID();
        UUID serialId = UUID.randomUUID();
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .batchId(batchId)
                .serialId(serialId)
                .reservationId(reservationId)
                .idempotencyKey("tracking")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .referenceType("PRODUCTION")
                                .referenceId(orderId)
                                .referenceLineId(materialId)
                                .status("POSTED")
                                .build())));

        service.consumeMaterial(orderId, request, companyId);
        ArgumentCaptor<InventoryApiRequest> requestCaptor = ArgumentCaptor.forClass(InventoryApiRequest.class);
        verify(inventoryFeignClient).createProductionStockOut(requestCaptor.capture(), eq(companyId));
        ProductionStockOutInventoryRequest payload = (ProductionStockOutInventoryRequest) requestCaptor.getValue().getData();
        assertEquals(batchId, payload.getBatchId());
        assertEquals(serialId, payload.getSerialId());
    }

    @Test
    void outboxPayloadContainsRequiredFieldsAfterSuccessfulConsumption() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .batchId(UUID.randomUUID())
                .serialId(UUID.randomUUID())
                .idempotencyKey("outbox")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .referenceType("PRODUCTION")
                                .referenceId(orderId)
                                .referenceLineId(materialId)
                                .status("POSTED")
                                .build())));

        service.consumeMaterial(orderId, request, companyId);
        ArgumentCaptor<ManufacturingOutbox> outboxCaptor = ArgumentCaptor.forClass(ManufacturingOutbox.class);
        verify(outboxRepository).save(outboxCaptor.capture());
        ManufacturingOutbox event = outboxCaptor.getValue();
        assertEquals(companyId, event.getCompanyId());
        assertNotNull(event.getAggregateId());
        assertNotNull(event.getPayload());
        assertTrue(event.getPayload().has("materialConsumptionId"));
        assertEquals(event.getAggregateId().toString(), event.getPayload().get("materialConsumptionId").asText());
        assertTrue(event.getPayload().has("inventoryMovementId"));
        assertTrue(event.getPayload().has("reservationId"));
        assertTrue(event.getPayload().has("batchId"));
        assertTrue(event.getPayload().has("serialId"));
    }

    @Test
    void crossCompanyContextIsRejectedBeforeInventoryCall() {
        UUID otherCompany = UUID.randomUUID();
        ProductionOrder otherOrder = ProductionOrder.builder()
                .companyId(otherCompany)
                .warehouseId(warehouseId)
                .productionLocationId(locationId)
                .status(ProductionOrderStatus.RELEASED)
                .build();
        otherOrder.setId(orderId);

        when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(otherOrder));
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("10.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("cross-company")
                .build();

        assertThrows(BusinessValidationException.class, () -> service.consumeMaterial(orderId, request, companyId));
        verify(inventoryFeignClient, never()).createProductionStockOut(any(), any());
    }

    @Test
    void retryAfterInventorySuccessWithoutPersistenceIsNotSafe() {
        MaterialConsumptionRequest request = MaterialConsumptionRequest.builder()
                .productionOrderMaterialId(materialId)
                .quantity(new BigDecimal("40.00"))
                .uomId(uomId)
                .warehouseId(warehouseId)
                .locationId(locationId)
                .reservationId(reservationId)
                .idempotencyKey("safe-retry")
                .build();

        UUID movementId = UUID.randomUUID();
        when(inventoryFeignClient.createProductionStockOut(any(InventoryApiRequest.class), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(
                        ProductionStockOutInventoryResponse.builder()
                                .inventoryMovementId(movementId)
                                .movementType("PRODUCTION_OUT")
                                .referenceType("PRODUCTION")
                                .referenceId(orderId)
                                .referenceLineId(materialId)
                                .status("POSTED")
                                .build())));

        when(materialConsumptionRepository.saveAndFlush(any(MaterialConsumption.class)))
                .thenThrow(new RuntimeException("persistence failure"))
                .thenAnswer(invocation -> {
                    MaterialConsumption consumption = invocation.getArgument(0);
                    if (consumption.getId() == null) {
                        consumption.setId(UUID.randomUUID());
                    }
                    return consumption;
                });

        assertThrows(RuntimeException.class, () -> service.consumeMaterial(orderId, request, companyId));
        MaterialConsumptionResponse retry = service.consumeMaterial(orderId, request, companyId);

        assertEquals(movementId, retry.getInventoryMovementId());
        verify(inventoryFeignClient, times(2)).createProductionStockOut(any(), eq(companyId));
    }
}
