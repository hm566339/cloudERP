package com.erp.manufacturing.integration.inventory.service;

import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.exception.BusinessValidationException;
import com.erp.manufacturing.integration.inventory.client.InventoryFeignClient;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiRequest;
import com.erp.manufacturing.integration.inventory.dto.InventoryApiResponse;
import com.erp.manufacturing.integration.inventory.dto.LocationStockInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ProductStockInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryRequest;
import com.erp.manufacturing.integration.inventory.dto.ReservationInventoryResponse;
import com.erp.manufacturing.integration.inventory.dto.WarehouseStockInventoryResponse;
import com.erp.manufacturing.outbox.repository.ManufacturingOutboxRepository;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.entity.ProductionOrderMaterial;
import com.erp.manufacturing.productionorder.repository.ProductionOrderMaterialRepository;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import feign.FeignException;
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
class PhaseCProductionOrderInventoryServiceTest {

    @Mock private ProductionOrderRepository productionOrderRepository;
    @Mock private ProductionOrderMaterialRepository materialRepository;
    @Mock private InventoryFeignClient inventoryFeignClient;
    @Mock private ManufacturingOutboxRepository outboxRepository;

    private ProductionOrderInventoryService service;
    private UUID companyId;
    private UUID orderId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID productId;
    private UUID uomId;
    private ProductionOrder order;
    private ProductionOrderMaterial material;

    @BeforeEach
    void setUp() {
        service = new ProductionOrderInventoryService(productionOrderRepository, materialRepository,
                inventoryFeignClient, outboxRepository, new ObjectMapper());
        companyId = UUID.randomUUID(); orderId = UUID.randomUUID(); warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID(); productId = UUID.randomUUID(); uomId = UUID.randomUUID();
        order = ProductionOrder.builder().companyId(companyId).finishedProductId(UUID.randomUUID())
                .warehouseId(warehouseId).productionLocationId(locationId)
                .status(ProductionOrderStatus.RELEASED).build();
        order.setId(orderId);
        material = ProductionOrderMaterial.builder().companyId(companyId).componentProductId(productId)
                .plannedQuantity(new BigDecimal("100.00")).consumedQuantity(BigDecimal.ZERO)
                .reservedQuantity(BigDecimal.ZERO).uomId(uomId).status(ProductionMaterialStatus.PLANNED).build();
        material.setId(UUID.randomUUID());
        material.setProductionOrder(order);
        lenient().when(productionOrderRepository.findByIdAndCompanyId(orderId, companyId)).thenReturn(Optional.of(order));
        lenient().when(materialRepository.findAllByProductionOrderIdAndCompanyId(orderId, companyId))
                .thenReturn(List.of(material));
    }

    @Test void allMaterialsAvailable() {
        stubStock(new BigDecimal("100.00"));
        assertEquals("AVAILABLE", service.getMaterialAvailability(orderId, companyId).get(0).getAvailabilityStatus());
    }

    @Test void partiallyAvailableMaterial() {
        stubStock(new BigDecimal("60.00"));
        var result = service.getMaterialAvailability(orderId, companyId).get(0);
        assertEquals(new BigDecimal("100.00"), result.getRemainingRequiredQuantity());
        assertEquals("PARTIALLY_AVAILABLE", result.getAvailabilityStatus());
    }

    @Test void materialNotAvailable() {
        stubStock(BigDecimal.ZERO);
        assertEquals("NOT_AVAILABLE", service.getMaterialAvailability(orderId, companyId).get(0).getAvailabilityStatus());
    }

    @Test void multipleMaterialsEvaluatedIndependently() {
        ProductionOrderMaterial second = material(productId, new BigDecimal("50"), uomId);
        when(materialRepository.findAllByProductionOrderIdAndCompanyId(orderId, companyId)).thenReturn(List.of(material, second));
        stubStock(new BigDecimal("100"));
        var result = service.getMaterialAvailability(orderId, companyId);
        assertEquals(2, result.size());
        verify(inventoryFeignClient, times(2)).getGroupedStock(companyId, productId, null);
    }

    @Test void decimalQuantityIsPreserved() {
        material.setPlannedQuantity(new BigDecimal("0.50"));
        stubStock(new BigDecimal("0.25"));
        var result = service.getMaterialAvailability(orderId, companyId).get(0);
        assertEquals(new BigDecimal("0.50"), result.getRequiredQuantity());
        assertEquals(new BigDecimal("0.25"), result.getAvailableQuantity());
    }

    @Test void kgQuantityIsSupported() {
        stubStock(new BigDecimal("2.00"));
        assertEquals(new BigDecimal("100.00"), service.getMaterialAvailability(orderId, companyId).get(0).getRequiredQuantity());
    }

    @Test void tonQuantityIsSupported() {
        material.setPlannedQuantity(new BigDecimal("0.25"));
        stubStock(new BigDecimal("0.25"));
        assertEquals("AVAILABLE", service.getMaterialAvailability(orderId, companyId).get(0).getAvailabilityStatus());
    }

    @Test void inventoryFailureIsTranslated() {
        when(inventoryFeignClient.getGroupedStock(companyId, productId, null))
            .thenThrow(mock(FeignException.class));
        assertThrows(RuntimeException.class, () -> service.getMaterialAvailability(orderId, companyId));
    }

    @Test void tenantIsolationUsesRepositoryCompanyScope() {
        UUID otherCompany = UUID.randomUUID();
        when(productionOrderRepository.findByIdAndCompanyId(orderId, otherCompany)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> service.getMaterialAvailability(orderId, otherCompany));
        verify(inventoryFeignClient, never()).getGroupedStock(any(), any(), any());
    }

    @Test void fullReservationPersistsReturnedReservation() {
        stubStock(new BigDecimal("100"));
        UUID reservationId = UUID.randomUUID();
        stubReservation(reservationId, new BigDecimal("100"));
        service.reserve(orderId, companyId);
        assertEquals(reservationId, material.getInventoryReservationId());
        assertEquals(new BigDecimal("100"), material.getReservedQuantity());
        assertEquals(ProductionMaterialStatus.RESERVED, material.getStatus());
        verify(materialRepository).save(material);
    }

    @Test void partialReservationPersistsActualQuantity() {
        stubStock(new BigDecimal("60"));
        UUID reservationId = UUID.randomUUID();
        stubReservation(reservationId, new BigDecimal("60"));
        service.reserve(orderId, companyId);
        assertEquals(new BigDecimal("60"), material.getReservedQuantity());
        assertEquals(ProductionMaterialStatus.PARTIALLY_RESERVED, material.getStatus());
    }

    @Test void insufficientStockDoesNotCallReservation() {
        stubStock(BigDecimal.ZERO);
        service.reserve(orderId, companyId);
        verify(inventoryFeignClient, never()).createReservation(any(), eq(companyId));
        assertEquals(ProductionMaterialStatus.PLANNED, material.getStatus());
    }

    @Test void reservationFailureDoesNotMarkReserved() {
        stubStock(new BigDecimal("100"));
        when(inventoryFeignClient.createReservation(any(), eq(companyId))).thenThrow(new RuntimeException("rejected"));
        assertThrows(RuntimeException.class, () -> service.reserve(orderId, companyId));
        assertEquals(ProductionMaterialStatus.PLANNED, material.getStatus());
        assertNull(material.getInventoryReservationId());
    }

    @Test void reservationRequestContainsProductionReferences() {
        stubStock(new BigDecimal("100"));
        stubReservation(UUID.randomUUID(), new BigDecimal("100"));
        service.reserve(orderId, companyId);
            ArgumentCaptor<InventoryApiRequest> captor = ArgumentCaptor.forClass(InventoryApiRequest.class);
        verify(inventoryFeignClient).createReservation(captor.capture(), eq(companyId));
            ReservationInventoryRequest request = (ReservationInventoryRequest) captor.getValue().getData();
            assertEquals("PRODUCTION", request.getReferenceType());
            assertEquals(orderId, request.getReferenceId());
            assertEquals(material.getId(), request.getReferenceLineId());
    }

        @Test void reservationIdIsPersistedFromInventoryResponse() {
            UUID reservationId = UUID.randomUUID();
            stubStock(new BigDecimal("100"));
            stubReservation(reservationId, new BigDecimal("100"));
            service.reserve(orderId, companyId);
            assertEquals(reservationId, material.getInventoryReservationId());
        }

        @Test void reservationUsesProductionOrderReferenceId() {
            stubStock(new BigDecimal("100"));
            stubReservation(UUID.randomUUID(), new BigDecimal("100"));
            service.reserve(orderId, companyId);
            ArgumentCaptor<InventoryApiRequest> captor = ArgumentCaptor.forClass(InventoryApiRequest.class);
            verify(inventoryFeignClient).createReservation(captor.capture(), eq(companyId));
            assertEquals(orderId, ((ReservationInventoryRequest) captor.getValue().getData()).getReferenceId());
        }

        @Test void reservationUsesProductionMaterialReferenceId() {
            stubStock(new BigDecimal("100"));
            stubReservation(UUID.randomUUID(), new BigDecimal("100"));
            service.reserve(orderId, companyId);
            ArgumentCaptor<InventoryApiRequest> captor = ArgumentCaptor.forClass(InventoryApiRequest.class);
            verify(inventoryFeignClient).createReservation(captor.capture(), eq(companyId));
            assertEquals(material.getId(), ((ReservationInventoryRequest) captor.getValue().getData()).getReferenceLineId());
        }

    @Test void duplicateReservationRequestDoesNotCreateAnotherReservation() {
        UUID reservationId = UUID.randomUUID();
        material.setInventoryReservationId(reservationId);
        material.setReservedQuantity(new BigDecimal("100"));
        material.setStatus(ProductionMaterialStatus.RESERVED);
        service.reserve(orderId, companyId);
        verify(inventoryFeignClient, never()).createReservation(any(), any());
    }

    @Test void cancelledOrderReservationIsRejected() {
        order.setStatus(ProductionOrderStatus.CANCELLED);
        assertThrows(BusinessValidationException.class, () -> service.reserve(orderId, companyId));
    }

    @Test void closedOrderReservationIsRejected() {
        order.setStatus(ProductionOrderStatus.CLOSED);
        assertThrows(BusinessValidationException.class, () -> service.reserve(orderId, companyId));
    }

    @Test void releaseReservationCallsInventoryAndClearsReference() {
        UUID reservationId = UUID.randomUUID();
        material.setInventoryReservationId(reservationId);
        material.setReservedQuantity(new BigDecimal("100"));
        when(inventoryFeignClient.releaseReservation(reservationId, companyId))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(reservation(reservationId, BigDecimal.ZERO, new BigDecimal("100")))));
        service.releaseReservations(orderId, companyId);
        verify(inventoryFeignClient).releaseReservation(reservationId, companyId);
        assertNull(material.getInventoryReservationId());
        assertEquals(BigDecimal.ZERO, material.getReservedQuantity());
        assertEquals(ProductionMaterialStatus.PLANNED, material.getStatus());
    }

    @Test void releaseFailureDoesNotClearReference() {
        UUID reservationId = UUID.randomUUID();
        material.setInventoryReservationId(reservationId);
        material.setReservedQuantity(new BigDecimal("100"));
        when(inventoryFeignClient.releaseReservation(reservationId, companyId)).thenThrow(new RuntimeException("unavailable"));
        assertThrows(RuntimeException.class, () -> service.releaseReservations(orderId, companyId));
        assertEquals(reservationId, material.getInventoryReservationId());
    }

    @Test void duplicateReleaseIsSafeToRetry() {
        material.setInventoryReservationId(null);
        material.setReservedQuantity(BigDecimal.ZERO);
        service.releaseReservations(orderId, companyId);
        verify(inventoryFeignClient, never()).releaseReservation(any(), any());
    }

    private void stubStock(BigDecimal available) {
        LocationStockInventoryResponse location = LocationStockInventoryResponse.builder()
                .locationId(locationId).batchId(UUID.randomUUID()).availableQuantity(available).build();
        WarehouseStockInventoryResponse warehouse = WarehouseStockInventoryResponse.builder()
                .warehouseId(warehouseId).locations(List.of(location)).build();
        ProductStockInventoryResponse stock = ProductStockInventoryResponse.builder()
                .productId(productId).warehouses(List.of(warehouse)).build();
        when(inventoryFeignClient.getGroupedStock(companyId, productId, null))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(List.of(stock))));
    }

    private void stubReservation(UUID reservationId, BigDecimal quantity) {
        ReservationInventoryResponse response = reservation(reservationId, quantity, BigDecimal.ZERO);
        when(inventoryFeignClient.createReservation(any(), eq(companyId)))
                .thenReturn(ResponseEntity.ok(InventoryApiResponse.success(response)));
    }

    private ReservationInventoryResponse reservation(UUID id, BigDecimal reserved, BigDecimal released) {
        return ReservationInventoryResponse.builder().id(id).reservedQuantity(reserved)
                .releasedQuantity(released).build();
    }

    private ProductionOrderMaterial material(UUID product, BigDecimal planned, UUID uom) {
        ProductionOrderMaterial value = ProductionOrderMaterial.builder().companyId(companyId).componentProductId(product)
                .plannedQuantity(planned).consumedQuantity(BigDecimal.ZERO).reservedQuantity(BigDecimal.ZERO)
                .uomId(uom).status(ProductionMaterialStatus.PLANNED).build();
        value.setId(UUID.randomUUID()); value.setProductionOrder(order); return value;
    }
}
