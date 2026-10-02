package com.erp.inventory.modules.integration.purchaseinvoice;

import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInItemRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.response.PurchaseInvoiceStockInResponse;
import com.erp.inventory.modules.integration.purchaseinvoice.service.impl.PurchaseInvoiceIntegrationServiceImpl;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.product.service.ProductUomConversionService;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.entity.StockMovementLine;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.serviceImpl.InventoryStockServiceImpl;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseInvoiceStockInIntegrationExactFlowTest {

    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;
    @Mock private UnitOfMeasureRepository unitOfMeasureRepository;
    @Mock private ProductUomRepository productUomRepository;

    private ProductUomConversionService productUomConversionService;
    private InventoryStockServiceImpl inventoryStockService;
    private PurchaseInvoiceIntegrationServiceImpl purchaseInvoiceService;

    private MockedStatic<TenantUtils> mockedTenantUtils;

    private final UUID companyId = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
    private final UUID productId = UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103");
    private final UUID warehouseId = UUID.fromString("fdae1e76-82e9-4780-bbef-4937e7c32f1b");
    private final UUID locationId = UUID.fromString("ff9293d2-d3eb-48de-b6f9-26c27dae3ae2");
    private final UUID uomId = UUID.fromString("234e93b7-e97c-47c5-96ce-8078c69969d9");

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> {
            UUID arg = i.getArgument(0);
            return arg != null ? arg : companyId;
        });

        productUomConversionService = new ProductUomConversionService(unitOfMeasureRepository, productUomRepository);
        inventoryStockService = new InventoryStockServiceImpl(
                inventoryStockRepository,
                null,
                productRepository,
                warehouseRepository,
                warehouseLocationRepository,
                null
        );

        purchaseInvoiceService = new PurchaseInvoiceIntegrationServiceImpl(
                stockMovementRepository,
                stockMovementLineRepository,
                inventoryStockService,
                inventoryStockRepository,
                inventoryCostLayerService,
                productRepository,
                warehouseRepository,
                warehouseLocationRepository,
                productUomConversionService
        );
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    @DisplayName("Exact Stock-IN flow reproduction for GRN-2026-09-000008 with quantity 5.0000 and 0-decimal UOM")
    void testExactStockInExecutionPath() {
        PurchaseInvoiceStockInRequest request = new PurchaseInvoiceStockInRequest();
        request.setIdempotencyKey(UUID.randomUUID());
        request.setCompanyId(companyId);
        request.setInvoiceId(UUID.randomUUID());
        request.setInvoiceNumber("GRN-2026-09-000008");
        request.setInvoiceDate(LocalDate.now());
        request.setMovementType("STOCK_IN");

        PurchaseInvoiceStockInItemRequest item = new PurchaseInvoiceStockInItemRequest();
        item.setProductId(productId);
        item.setQuantity(new BigDecimal("5.0000"));
        item.setUnit("PIE0826001");
        item.setUnitPrice(new BigDecimal("32000.0000"));
        item.setWarehouseId(warehouseId);
        item.setLocationId(locationId);
        item.setBatchId(null);
        request.setItems(Collections.singletonList(item));

        // 1. Mock existing movement idempotency
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());

        // 2. Mock movement saving
        when(stockMovementRepository.saveAndFlush(any(StockMovement.class)))
                .thenAnswer(i -> {
                    StockMovement sm = i.getArgument(0);
                    if (sm.getId() == null) {
                        sm.setId(UUID.randomUUID());
                    }
                    return sm;
                });

        // 3. Mock Product
        Product product = new Product();
        product.setId(productId);
        product.setProductName("Premium Ice Cream Freezer 300L");
        product.setStatus(ProductStatus.ACTIVE);
        product.setBaseUomId(uomId);
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        // 4. Mock Warehouse & Location
        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);
        when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        // 5. Mock UOM (PIE0826001 with 0 decimal places)
        UnitOfMeasure uom = new UnitOfMeasure();
        uom.setId(uomId);
        uom.setCode("PIE0826001");
        uom.setName("Pieces");
        uom.setDecimalPlaces(0);
        uom.setIsActive(true);
        uom.setIsDeleted(false);
        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("PIE0826001", companyId)).thenReturn(Optional.of(uom));
        when(unitOfMeasureRepository.findByIdAndCompanyId(uomId, companyId)).thenReturn(Optional.of(uom));

        // 6. Mock existing InventoryStock in DB with quantity = 8.0000
        InventoryStock existingStock = new InventoryStock();
        existingStock.setId(UUID.fromString("2040fb49-d1d0-4639-ae1e-50e72a39cb1c"));
        existingStock.setProductId(productId);
        existingStock.setWarehouseId(warehouseId);
        existingStock.setLocationId(locationId);
        existingStock.setBatchId(null);
        existingStock.setCompanyId(companyId);
        existingStock.setQuantity(new BigDecimal("8.0000"));
        existingStock.setAvailableQuantity(new BigDecimal("8.0000"));
        existingStock.setAverageCost(new BigDecimal("30000.0000"));
        existingStock.setStockValue(new BigDecimal("240000.0000"));
        when(inventoryStockRepository.findUniqueStockForUpdate(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(existingStock));

        when(inventoryStockRepository.saveAndFlush(any(InventoryStock.class)))
                .thenAnswer(i -> i.getArgument(0));

        when(stockMovementLineRepository.saveAndFlush(any(StockMovementLine.class)))
                .thenAnswer(i -> {
                    StockMovementLine line = i.getArgument(0);
                    line.setId(UUID.randomUUID());
                    return line;
                });

        // EXECUTE
        PurchaseInvoiceStockInResponse response = purchaseInvoiceService.createStockIn(request);

        // ASSERTIONS
        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());

        // 1. Verify inventoryStockRepository.findUniqueStockForUpdate WAS called
        verify(inventoryStockRepository).findUniqueStockForUpdate(productId, warehouseId, locationId, null, companyId);

        // 2. Verify inventoryStockRepository.saveAndFlush WAS called with updated quantity: 8 + 5 = 13!
        ArgumentCaptor<InventoryStock> stockCaptor = ArgumentCaptor.forClass(InventoryStock.class);
        verify(inventoryStockRepository).saveAndFlush(stockCaptor.capture());
        InventoryStock updatedStock = stockCaptor.getValue();
        assertEquals(new BigDecimal("13.0000"), updatedStock.getQuantity());
        assertEquals(new BigDecimal("13.0000"), updatedStock.getAvailableQuantity());

        // 3. Verify StockMovementLine was created with before = 8, after = 13
        ArgumentCaptor<StockMovementLine> lineCaptor = ArgumentCaptor.forClass(StockMovementLine.class);
        verify(stockMovementLineRepository).saveAndFlush(lineCaptor.capture());
        StockMovementLine createdLine = lineCaptor.getValue();
        assertEquals(new BigDecimal("8.0000"), createdLine.getQuantityBefore());
        assertEquals(new BigDecimal("13.0000"), createdLine.getQuantityAfter());
        assertEquals(new BigDecimal("5"), createdLine.getQuantity());

        // 4. Verify StockMovement was marked POSTED with total quantity = 5.0000
        ArgumentCaptor<StockMovement> smCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository, atLeast(2)).saveAndFlush(smCaptor.capture());
        StockMovement finalSm = smCaptor.getValue();
        assertEquals("POSTED", finalSm.getStatus());
        assertEquals(new BigDecimal("5.0000"), finalSm.getTotalQuantity());
    }

    @Test
    @DisplayName("Stock-IN flow creates brand new inventory_stock when no record exists")
    void testStockInCreatesNewInventoryStock() {
        PurchaseInvoiceStockInRequest request = new PurchaseInvoiceStockInRequest();
        request.setIdempotencyKey(UUID.randomUUID());
        request.setCompanyId(companyId);
        request.setInvoiceId(UUID.randomUUID());
        request.setInvoiceNumber("GRN-2026-09-000009");
        request.setInvoiceDate(LocalDate.now());
        request.setMovementType("STOCK_IN");

        PurchaseInvoiceStockInItemRequest item = new PurchaseInvoiceStockInItemRequest();
        item.setProductId(productId);
        item.setQuantity(new BigDecimal("5.0000"));
        item.setUnit("PIE0826001");
        item.setUnitPrice(new BigDecimal("32000.0000"));
        item.setWarehouseId(warehouseId);
        item.setLocationId(locationId);
        item.setBatchId(null);
        request.setItems(Collections.singletonList(item));

        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());
        when(stockMovementRepository.saveAndFlush(any(StockMovement.class)))
                .thenAnswer(i -> {
                    StockMovement sm = i.getArgument(0);
                    if (sm.getId() == null) sm.setId(UUID.randomUUID());
                    return sm;
                });

        Product product = new Product();
        product.setId(productId);
        product.setProductName("Premium Ice Cream Freezer 300L");
        product.setStatus(ProductStatus.ACTIVE);
        product.setBaseUomId(uomId);
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);
        when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        UnitOfMeasure uom = new UnitOfMeasure();
        uom.setId(uomId);
        uom.setCode("PIE0826001");
        uom.setName("Pieces");
        uom.setDecimalPlaces(0);
        uom.setIsActive(true);
        uom.setIsDeleted(false);
        when(unitOfMeasureRepository.findByCodeIgnoreCaseAndCompanyId("PIE0826001", companyId)).thenReturn(Optional.of(uom));
        when(unitOfMeasureRepository.findByIdAndCompanyId(uomId, companyId)).thenReturn(Optional.of(uom));

        // No existing stock record
        when(inventoryStockRepository.findUniqueStockForUpdate(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.empty());

        when(inventoryStockRepository.saveAndFlush(any(InventoryStock.class)))
                .thenAnswer(i -> {
                    InventoryStock s = i.getArgument(0);
                    s.setId(UUID.randomUUID());
                    return s;
                });

        when(stockMovementLineRepository.saveAndFlush(any(StockMovementLine.class)))
                .thenAnswer(i -> {
                    StockMovementLine line = i.getArgument(0);
                    line.setId(UUID.randomUUID());
                    return line;
                });

        // EXECUTE
        PurchaseInvoiceStockInResponse response = purchaseInvoiceService.createStockIn(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());

        // Verify INSERT on inventory_stock
        ArgumentCaptor<InventoryStock> stockCaptor = ArgumentCaptor.forClass(InventoryStock.class);
        verify(inventoryStockRepository).saveAndFlush(stockCaptor.capture());
        InventoryStock inserted = stockCaptor.getValue();
        assertEquals(new BigDecimal("5"), inserted.getQuantity());
        assertEquals(new BigDecimal("5"), inserted.getAvailableQuantity());
        assertEquals(productId, inserted.getProductId());
        assertEquals(warehouseId, inserted.getWarehouseId());
    }
}
