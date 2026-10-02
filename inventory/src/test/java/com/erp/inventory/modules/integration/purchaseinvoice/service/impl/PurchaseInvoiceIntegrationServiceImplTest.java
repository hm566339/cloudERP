package com.erp.inventory.modules.integration.purchaseinvoice.service.impl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInItemRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.response.PurchaseInvoiceStockInResponse;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.service.ProductUomConversionService;
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
class PurchaseInvoiceIntegrationServiceImplTest {

    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;
    @Mock private ProductUomConversionService productUomConversionService;

    @InjectMocks
    private PurchaseInvoiceIntegrationServiceImpl service;

    private PurchaseInvoiceStockInRequest request;
    private UUID companyId;
    private UUID invoiceId;
    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        companyId = UUID.randomUUID();
        invoiceId = UUID.randomUUID();

        request = new PurchaseInvoiceStockInRequest();
        request.setCompanyId(companyId);
        request.setInvoiceId(invoiceId);
        request.setInvoiceNumber("AP-INV-001");
        request.setInvoiceDate(LocalDate.now());
        request.setMovementType("STOCK_IN");

        PurchaseInvoiceStockInItemRequest item = new PurchaseInvoiceStockInItemRequest();
        item.setProductId(UUID.randomUUID());
        item.setQuantity(BigDecimal.valueOf(50));
        item.setUnit("PIECE");
        item.setUnitPrice(BigDecimal.valueOf(850));
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
    void createStockIn_success() {
        request.setIdempotencyKey(UUID.randomUUID());

        Product product = new Product();
        product.setId(request.getItems().get(0).getProductId());
        product.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);

        when(productUomConversionService.normalize(eq(product), eq(request.getItems().get(0).getQuantity()),
            eq(request.getItems().get(0).getUnit()), eq(companyId)))
            .thenReturn(new ProductUomConversionService.NormalizedQuantity(
                UUID.randomUUID(), UUID.randomUUID(), BigDecimal.valueOf(50), BigDecimal.valueOf(50), BigDecimal.ONE));
        when(productUomConversionService.normalizeUnitCost(BigDecimal.valueOf(850), BigDecimal.ONE))
            .thenReturn(BigDecimal.valueOf(850));

        Warehouse warehouse = new Warehouse();
        warehouse.setId(request.getItems().get(0).getWarehouseId());

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(BigDecimal.valueOf(96));
        stock.setAverageCost(BigDecimal.valueOf(50));
        
        InventoryStock newStock = new InventoryStock();
        newStock.setQuantity(BigDecimal.valueOf(146));
        newStock.setAverageCost(BigDecimal.valueOf(50));

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());

        when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(inv -> {
            StockMovement m = inv.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        when(productRepository.findByIdAndCompanyId(product.getId(), companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouse.getId(), companyId)).thenReturn(Optional.of(warehouse));
        lenient().when(inventoryStockRepository.findUniqueStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), eq(companyId)))
                .thenReturn(Optional.of(stock));

        when(inventoryStockService.addStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), any(), any(), eq(companyId)))
                .thenReturn(newStock);

        PurchaseInvoiceStockInResponse response = service.createStockIn(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals("Stock-in processed successfully", response.getMessage());
        verify(inventoryStockService, times(1)).addStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), eq(BigDecimal.valueOf(50)), eq(BigDecimal.valueOf(850)), eq(companyId));
        verify(inventoryCostLayerService, times(1)).processInboundCost(any(), eq(companyId));
    }

    @Test
    void createStockIn_duplicateReturnsExisting() {
        request.setIdempotencyKey(UUID.randomUUID());

        StockMovement existing = new StockMovement();
        existing.setId(UUID.randomUUID());
        existing.setCompanyId(companyId);
        existing.setMovementType("IN");
        existing.setStatus("POSTED");

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        PurchaseInvoiceStockInResponse response = service.createStockIn(request);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getTransactionId());
        verify(stockMovementRepository, never()).saveAndFlush(any());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void getExistingStockIn_success() {
        request.setIdempotencyKey(UUID.randomUUID());
        StockMovement existing = new StockMovement();
        existing.setId(UUID.randomUUID());
        existing.setCompanyId(companyId);
        existing.setMovementType("IN");
        existing.setStatus("POSTED");

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.of(existing));

        PurchaseInvoiceStockInResponse response = service.getExistingStockIn(companyId, request.getIdempotencyKey(), request);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getTransactionId());
        assertEquals("Stock-in already processed", response.getMessage());
    }

    @Test
    void getExistingStockIn_notFound() {
        UUID idempotencyKey = UUID.randomUUID();
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> {
            service.getExistingStockIn(companyId, idempotencyKey, request);
        });
    }

    @Test
    void createStockIn_invalidMovementType() {
        request.setMovementType("OUT");

        BusinessValidationException exception = assertThrows(BusinessValidationException.class, () -> {
            service.createStockIn(request);
        });

        assertEquals("Only STOCK_IN movement type is supported for Purchase Invoice Integration", exception.getMessage());
    }

    @Test
    void createStockIn_inventoryStockFailure_throwsExceptionAndDoesNotPostMovement() {
        request.setIdempotencyKey(UUID.randomUUID());

        Product product = new Product();
        product.setId(request.getItems().get(0).getProductId());
        product.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);

        when(productUomConversionService.normalize(eq(product), eq(request.getItems().get(0).getQuantity()),
            eq(request.getItems().get(0).getUnit()), eq(companyId)))
            .thenReturn(new ProductUomConversionService.NormalizedQuantity(
                UUID.randomUUID(), UUID.randomUUID(), BigDecimal.valueOf(50), BigDecimal.valueOf(50), BigDecimal.ONE));
        when(productUomConversionService.normalizeUnitCost(BigDecimal.valueOf(850), BigDecimal.ONE))
            .thenReturn(BigDecimal.valueOf(850));

        Warehouse warehouse = new Warehouse();
        warehouse.setId(request.getItems().get(0).getWarehouseId());

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());

        when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(inv -> {
            StockMovement m = inv.getArgument(0);
            if (m.getId() == null) m.setId(UUID.randomUUID());
            return m;
        });

        when(productRepository.findByIdAndCompanyId(product.getId(), companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouse.getId(), companyId)).thenReturn(Optional.of(warehouse));

        when(inventoryStockService.addStock(
                eq(product.getId()), eq(warehouse.getId()), any(), any(), any(), any(), eq(companyId)))
                .thenThrow(new BusinessValidationException("Inventory stock failure"));

        assertThrows(BusinessValidationException.class, () -> {
            service.createStockIn(request);
        });

        // Verify that stockMovement was never saved with POSTED status
        verify(stockMovementRepository, never()).saveAndFlush(argThat(m -> "POSTED".equals(m.getStatus())));
    }
}
