package com.erp.inventory.modules.integration.salesinvoice.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutItemRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.response.SalesInvoiceStockOutResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import com.erp.inventory.common.util.TenantUtils;
import org.mockito.InjectMocks;
import org.mockito.Mock;
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
class SalesInvoiceIntegrationServiceImplTest {

    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;

    @InjectMocks
    private SalesInvoiceIntegrationServiceImpl service;

    private SalesInvoiceStockOutRequest request;
    private UUID companyId;
    private UUID invoiceId;
    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        companyId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();

        request = new SalesInvoiceStockOutRequest();
        request.setCompanyId(companyId);
        request.setInvoiceId(invoiceId);
        request.setInvoiceNumber("INV-123");
        request.setInvoiceDate(LocalDate.now());
        request.setMovementType("OUT");

        SalesInvoiceStockOutItemRequest item = new SalesInvoiceStockOutItemRequest();
        item.setProductId(UUID.randomUUID());
        item.setQuantity(BigDecimal.ONE);
        item.setUnit("PCS");
        item.setUnitPrice(BigDecimal.valueOf(100));
        item.setWarehouseId(UUID.randomUUID());
        request.setItems(Collections.singletonList(item));
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    void createStockOut_success() {
        request.setIdempotencyKey(UUID.randomUUID());

        Product product = new Product();
        product.setId(request.getItems().get(0).getProductId());
        product.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(request.getItems().get(0).getWarehouseId());

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(BigDecimal.TEN);
        stock.setAverageCost(BigDecimal.valueOf(50));

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());

        when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(inv -> {
            StockMovement m = inv.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        when(productRepository.findByIdAndCompanyId(product.getId(), companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouse.getId(), companyId)).thenReturn(Optional.of(warehouse));
        when(inventoryStockRepository.findUniqueStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), eq(companyId)))
                .thenReturn(Optional.of(stock));

        SalesInvoiceStockOutResponse response = service.createStockOut(request);

        assertNotNull(response);
        assertEquals(invoiceId, response.getInvoiceId());
        assertEquals("POSTED", response.getStatus());
        verify(inventoryStockService, times(1)).removeStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), eq(BigDecimal.ONE), eq(companyId));
        verify(inventoryCostLayerService, times(1)).processOutboundCost(any(), eq(companyId));
    }

    @Test
    void createStockOut_duplicateReturnsExisting() {
        request.setIdempotencyKey(UUID.randomUUID());

        StockMovement existing = new StockMovement();
        existing.setId(UUID.randomUUID());
        existing.setCompanyId(companyId);
        existing.setMovementType("OUT");
        existing.setStatus("POSTED");

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        SalesInvoiceStockOutResponse response = service.createStockOut(request);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getMovementId());
        verify(stockMovementRepository, never()).saveAndFlush(any());
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }

    @Test
    void getExistingStockOut_success() {
        request.setIdempotencyKey(UUID.randomUUID());
        StockMovement existing = new StockMovement();
        existing.setId(UUID.randomUUID());
        existing.setCompanyId(companyId);
        existing.setMovementType("OUT");
        existing.setStatus("POSTED");

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        SalesInvoiceStockOutResponse response = service.getExistingStockOut(companyId, request.getIdempotencyKey(), request);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getMovementId());
    }

    @Test
    void getExistingStockOut_notFound() {
        UUID idempotencyKey = UUID.randomUUID();
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            service.getExistingStockOut(companyId, idempotencyKey, request);
        });
    }

    @Test
    void createStockOut_invalidMovementType() {
        request.setMovementType("IN");

        BusinessValidationException exception = assertThrows(BusinessValidationException.class, () -> {
            service.createStockOut(request);
        });

        assertEquals("Only OUT movement type is supported for Sales Invoice Integration", exception.getMessage());
    }
}
