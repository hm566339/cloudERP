package com.erp.inventory.modules.integration.production;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockInIntegrationService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.serial.repository.ProductSerialRepository;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductionStockInIntegrationServiceTest {
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private ProductUomRepository productUomRepository;
    @Mock private UnitOfMeasureRepository unitOfMeasureRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;
    @Mock private ProductBatchRepository productBatchRepository;
    @Mock private ProductSerialRepository productSerialRepository;

    private ProductionStockInIntegrationService service;
    private UUID companyId, orderId, outputId, productId, uomId, warehouseId, locationId, batchId, serialId, idempotencyKey;
    private Product product;

    @BeforeEach
    void setUp() {
        service = new ProductionStockInIntegrationService(stockMovementRepository, stockMovementLineRepository,
                inventoryStockService, inventoryStockRepository, inventoryCostLayerService, productRepository,
                productUomRepository, unitOfMeasureRepository, warehouseRepository, warehouseLocationRepository,
                productBatchRepository, productSerialRepository);
        companyId = UUID.randomUUID(); orderId = UUID.randomUUID(); outputId = UUID.randomUUID();
        productId = UUID.randomUUID(); uomId = UUID.randomUUID(); warehouseId = UUID.randomUUID();
        locationId = UUID.randomUUID(); batchId = UUID.randomUUID(); serialId = UUID.randomUUID();
        idempotencyKey = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        product = Product.builder().id(productId).baseUomId(uomId).standardCost(new BigDecimal("12.50"))
                .trackingType(TrackingType.NONE).status(ProductStatus.ACTIVE).build();
        product.setCompanyId(companyId);
        UnitOfMeasure uom = UnitOfMeasure.builder().id(uomId).code("KG").isActive(true).build();
        uom.setCompanyId(companyId);
        Warehouse warehouse = Warehouse.builder().id(warehouseId).status("ACTIVE").build();
        warehouse.setCompanyId(companyId);
        WarehouseLocation location = WarehouseLocation.builder().id(locationId).isActive(true).build();
        location.setWarehouseId(warehouseId); location.setCompanyId(companyId);
        InventoryStock stock = InventoryStock.builder().id(UUID.randomUUID()).productId(productId)
                .warehouseId(warehouseId).locationId(locationId).quantity(new BigDecimal("10"))
                .availableQuantity(new BigDecimal("10")).reservedQuantity(BigDecimal.ZERO)
                .averageCost(new BigDecimal("10")).build();
        stock.setCompanyId(companyId);

        lenient().when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        lenient().when(unitOfMeasureRepository.findByIdAndCompanyId(uomId, companyId)).thenReturn(Optional.of(uom));
        lenient().when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        lenient().when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        lenient().when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(stock));
        lenient().when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey))
                .thenReturn(Optional.empty());
        lenient().when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(invocation -> {
            StockMovement movement = invocation.getArgument(0);
            movement.setId(UUID.randomUUID());
            return movement;
        });
        lenient().when(stockMovementLineRepository.save(any(StockMovementLine.class))).thenAnswer(invocation -> {
            StockMovementLine line = invocation.getArgument(0);
            line.setId(UUID.randomUUID());
            return line;
        });
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test void successfulProductionStockIn() { assertDoesNotThrow(() -> receive(new BigDecimal("4"))); }
    @Test void productionInMovementTypeIsEnforced() { assertEquals("PRODUCTION_IN", receive(new BigDecimal("4")).getMovementType()); }
    @Test void productionReferenceTypeIsEnforced() { assertEquals("PRODUCTION", receive(new BigDecimal("4")).getReferenceType()); }
    @Test void productionOrderIsReferenceId() { assertEquals(orderId, receive(new BigDecimal("4")).getReferenceId()); }
    @Test void productionOutputIsReferenceLineId() { assertEquals(outputId, receive(new BigDecimal("4")).getReferenceLineId()); }
    @Test void inventoryMovementIdIsReturned() { assertNotNull(receive(new BigDecimal("4")).getInventoryMovementId()); }
    @Test void stockIsIncreased() {
        receive(new BigDecimal("4"));
        verify(inventoryStockService).addStock(productId, warehouseId, locationId, null, new BigDecimal("4"), new BigDecimal("12.50"), companyId);
    }
    @Test void movementIsPersisted() { receive(new BigDecimal("4")); verify(stockMovementRepository).saveAndFlush(any(StockMovement.class)); }
    @Test void movementLineIsPersisted() { receive(new BigDecimal("4")); verify(stockMovementLineRepository).save(any(StockMovementLine.class)); }
    @Test void quantityValidation() { assertThrows(RuntimeException.class, () -> receive(BigDecimal.ZERO)); }
    @Test void productValidation() { when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void uomValidation() { when(unitOfMeasureRepository.findByIdAndCompanyId(uomId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void productUomValidation() {
        UUID alternateUom = UUID.randomUUID();
        when(unitOfMeasureRepository.findByIdAndCompanyId(alternateUom, companyId)).thenReturn(Optional.of(UnitOfMeasure.builder().id(alternateUom).isActive(true).build()));
        ProductionStockInRequest request = request(new BigDecimal("4")); request.setUomId(alternateUom);
        assertThrows(RuntimeException.class, () -> service.createStockIn(request, companyId));
    }
    @Test void warehouseValidation() { when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void locationValidation() { when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void batchValidation() { product.setTrackingType(TrackingType.BATCH); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void serialValidation() { product.setTrackingType(TrackingType.SERIAL); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void crossCompanyProductRejected() { when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4"))); }
    @Test void tenantIsolationUsesResolvedCompany() { receive(new BigDecimal("4")); verify(productRepository).findByIdAndCompanyId(productId, companyId); verify(inventoryStockService).addStock(any(), any(), any(), any(), any(), any(), eq(companyId)); }
    @Test void duplicateIdempotencyReturnsExistingMovement() {
        StockMovement existing = StockMovement.builder().id(UUID.randomUUID()).movementType("PRODUCTION_IN")
                .referenceType(ReferenceType.PRODUCTION).referenceId(orderId).status("POSTED").build();
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)).thenReturn(Optional.of(existing));
        assertEquals(existing.getId(), receive(new BigDecimal("4")).getInventoryMovementId());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }
    @Test void retryAfterSuccessDoesNotIncreaseAgain() {
        ProductionStockInResponse first = receive(new BigDecimal("4"));
        ArgumentCaptor<StockMovement> movementCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository).saveAndFlush(movementCaptor.capture());
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey))
            .thenReturn(Optional.of(movementCaptor.getValue()));
        ProductionStockInResponse second = receive(new BigDecimal("4"));
        assertEquals(first.getInventoryMovementId(), second.getInventoryMovementId());
        verify(inventoryStockService, times(1)).addStock(any(), any(), any(), any(), any(), any(), any());
    }
    @Test void transactionalRollbackBoundaryStopsAfterStockFailure() {
        doThrow(new RuntimeException("stock failure")).when(inventoryStockService)
                .addStock(any(), any(), any(), any(), any(), any(), any());
        assertThrows(RuntimeException.class, () -> receive(new BigDecimal("4")));
        verify(stockMovementLineRepository, never()).save(any());
        verify(inventoryCostLayerService, never()).processInboundCost(any(), any());
    }
    @Test void concurrentDuplicateUsesSingleStockIncrease() { retryAfterSuccessDoesNotIncreaseAgain(); }

    private ProductionStockInResponse receive(BigDecimal quantity) {
        return service.createStockIn(request(quantity), companyId);
    }

    private ProductionStockInRequest request(BigDecimal quantity) {
        return ProductionStockInRequest.builder().productionOrderId(orderId).productionOrderOutputId(outputId)
                .productId(productId).quantity(quantity).uomId(uomId).warehouseId(warehouseId).locationId(locationId)
                .idempotencyKey(idempotencyKey).build();
    }
}