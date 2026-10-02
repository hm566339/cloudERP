package com.erp.inventory.modules.integration.deliverychallan.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutItemRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.response.DeliveryChallanStockOutResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryChallanIntegrationServiceImplTest {

    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;

    @InjectMocks
    private DeliveryChallanIntegrationServiceImpl service;

    private DeliveryChallanStockOutRequest request;
    private UUID companyId;
    private UUID dcId;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        companyId = UUID.randomUUID();
        dcId = UUID.randomUUID();
        productId = UUID.randomUUID();
        warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID();

        request = DeliveryChallanStockOutRequest.builder()
                .idempotencyKey(UUID.randomUUID())
                .companyId(companyId)
                .deliveryChallanId(dcId)
                .dcNumber("DC-2026-09-000001")
                .dcDate(LocalDate.now())
                .movementType("OUT")
                .items(Collections.singletonList(
                        DeliveryChallanStockOutItemRequest.builder()
                                .productId(productId)
                                .quantity(new BigDecimal("10.0000"))
                                .unit("PCS")
                                .unitPrice(new BigDecimal("100.0000"))
                                .warehouseId(warehouseId)
                                .locationId(locationId)
                                .build()
                ))
                .build();
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    @DisplayName("Should successfully create OUT StockMovement and reduce stock when Delivery Challan is confirmed")
    void createStockOut_success() {
        Product product = new Product();
        product.setId(productId);
        product.setProductName("Test Widget");
        product.setStatus(ProductStatus.ACTIVE);
        product.setBaseUomId(UUID.randomUUID());

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);

        InventoryStock initialStock = new InventoryStock();
        initialStock.setQuantity(new BigDecimal("50.0000"));
        initialStock.setAvailableQuantity(new BigDecimal("50.0000"));
        initialStock.setAverageCost(new BigDecimal("80.0000"));

        InventoryStock updatedStock = new InventoryStock();
        updatedStock.setQuantity(new BigDecimal("40.0000"));
        updatedStock.setAvailableQuantity(new BigDecimal("40.0000"));
        updatedStock.setAverageCost(new BigDecimal("80.0000"));

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());
        when(stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(companyId, ReferenceType.DELIVERY_CHALLAN, dcId))
                .thenReturn(Optional.empty());

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(initialStock))
                .thenReturn(Optional.of(initialStock))
                .thenReturn(Optional.of(updatedStock));

        when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(i -> {
            StockMovement sm = i.getArgument(0);
            if (sm.getId() == null) {
                sm.setId(UUID.randomUUID());
            }
            return sm;
        });
        when(stockMovementLineRepository.saveAndFlush(any(StockMovementLine.class))).thenAnswer(i -> i.getArgument(0));

        DeliveryChallanStockOutResponse response = service.createStockOut(request);

        assertNotNull(response);
        assertEquals("POSTED", response.getStatus());
        assertEquals("OUT", response.getMovementType());
        assertEquals("DC-2026-09-000001", response.getDcNumber());
        assertEquals(dcId, response.getDeliveryChallanId());
        assertEquals(new BigDecimal("10.0000"), response.getTotalQuantity());

        // Verify StockMovement Header created with exact fields
        ArgumentCaptor<StockMovement> smCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository, atLeastOnce()).saveAndFlush(smCaptor.capture());
        StockMovement capturedHeader = smCaptor.getAllValues().get(0);
        assertEquals("OUT", capturedHeader.getMovementType());
        assertEquals("POSTED", capturedHeader.getStatus());
        assertEquals(ReferenceType.DELIVERY_CHALLAN, capturedHeader.getReferenceType());
        assertEquals(dcId, capturedHeader.getReferenceId());
        assertEquals("DC-2026-09-000001", capturedHeader.getReferenceNumber());
        assertEquals("Stock OUT against Delivery Challan DC-2026-09-000001", capturedHeader.getRemarks());

        // Verify InventoryStockService.removeStock called
        verify(inventoryStockService, times(1)).removeStock(
                eq(productId), eq(warehouseId), eq(locationId), eq(null), eq(new BigDecimal("10.0000")), eq(companyId)
        );

        // Verify StockMovementLine saved with correct quantities
        ArgumentCaptor<StockMovementLine> lineCaptor = ArgumentCaptor.forClass(StockMovementLine.class);
        verify(stockMovementLineRepository, times(1)).saveAndFlush(lineCaptor.capture());
        StockMovementLine capturedLine = lineCaptor.getValue();
        assertEquals(new BigDecimal("10.0000"), capturedLine.getQuantity());
        assertEquals(new BigDecimal("50.0000"), capturedLine.getQuantityBefore());
        assertEquals(new BigDecimal("40.0000"), capturedLine.getQuantityAfter());
        assertEquals(new BigDecimal("80.0000"), capturedLine.getUnitCost());
        assertEquals(new BigDecimal("800.0000"), capturedLine.getTotalCost());

        // Verify Cost Layer Outbound called
        verify(inventoryCostLayerService, times(1)).processOutboundCost(eq(capturedLine), eq(companyId));
    }

    @Test
    @DisplayName("Should throw BusinessValidationException when available stock is insufficient")
    void createStockOut_insufficientStock() {
        Product product = new Product();
        product.setId(productId);
        product.setStatus(ProductStatus.ACTIVE);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);

        InventoryStock lowStock = new InventoryStock();
        lowStock.setQuantity(new BigDecimal("5.0000"));
        lowStock.setAvailableQuantity(new BigDecimal("5.0000")); // Requested is 10.0000

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());
        when(stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(companyId, ReferenceType.DELIVERY_CHALLAN, dcId))
                .thenReturn(Optional.empty());

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(lowStock));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.createStockOut(request));
        assertTrue(ex.getMessage().contains("Insufficient available stock"));

        // Verify NO stock was removed and NO movement header was saved
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
        verify(stockMovementRepository, never()).saveAndFlush(any());
        verify(stockMovementLineRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should return existing StockMovement on duplicate request (Idempotency Protection)")
    void createStockOut_duplicateIdempotent() {
        StockMovement existing = new StockMovement();
        existing.setId(UUID.randomUUID());
        existing.setCompanyId(companyId);
        existing.setMovementType("OUT");
        existing.setStatus("POSTED");
        existing.setReferenceType(ReferenceType.DELIVERY_CHALLAN);
        existing.setReferenceId(dcId);
        existing.setReferenceNumber("DC-2026-09-000001");
        existing.setTotalQuantity(new BigDecimal("10.0000"));
        existing.setTotalValue(new BigDecimal("800.0000"));

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        DeliveryChallanStockOutResponse response = service.createStockOut(request);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getMovementId());
        assertEquals("POSTED", response.getStatus());
        assertTrue(response.getMessage().contains("already processed"));

        // Verify NO inventory or stock movement operations were triggered again
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
        verify(stockMovementRepository, never()).saveAndFlush(any());
        verify(stockMovementLineRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("Should throw BusinessValidationException when product is inactive")
    void createStockOut_inactiveProduct() {
        Product product = new Product();
        product.setId(productId);
        product.setStatus(ProductStatus.INACTIVE);

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());
        when(stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(companyId, ReferenceType.DELIVERY_CHALLAN, dcId))
                .thenReturn(Optional.empty());
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.createStockOut(request));
        assertTrue(ex.getMessage().contains("Product is not active"));

        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }
}
