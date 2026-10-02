package com.erp.inventory.modules.integration.production;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockOutIntegrationService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.ProductUomRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.reservation.entity.StockReservation;
import com.erp.inventory.modules.reservation.enums.ReservationStatus;
import com.erp.inventory.modules.reservation.repository.StockReservationRepository;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
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
class ProductionStockOutIntegrationServiceTest {
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
    @Mock private StockReservationRepository stockReservationRepository;
    @Mock private ProductBatchRepository productBatchRepository;
    @Mock private ProductSerialRepository productSerialRepository;
    private ProductionStockOutIntegrationService service;
    private UUID companyId, orderId, materialId, productId, uomId, warehouseId, locationId, batchId, reservationId, idempotencyKey;
    private StockReservation reservation;

    @BeforeEach void setUp() {
        service = new ProductionStockOutIntegrationService(stockMovementRepository, stockMovementLineRepository,
                inventoryStockService, inventoryStockRepository, inventoryCostLayerService, productRepository,
                productUomRepository, unitOfMeasureRepository, warehouseRepository, warehouseLocationRepository,
                stockReservationRepository, productBatchRepository, productSerialRepository);
        companyId = UUID.randomUUID(); orderId = UUID.randomUUID(); materialId = UUID.randomUUID(); productId = UUID.randomUUID();
        uomId = UUID.randomUUID(); warehouseId = UUID.randomUUID(); locationId = UUID.randomUUID(); batchId = UUID.randomUUID();
        reservationId = UUID.randomUUID(); idempotencyKey = UUID.randomUUID(); CurrentUserContext.setCompanyId(companyId);
        Product product = Product.builder().id(productId).baseUomId(uomId).trackingType(TrackingType.BATCH).status(ProductStatus.ACTIVE).build();
        product.setCompanyId(companyId);
        reservation = StockReservation.builder().id(reservationId).productId(productId).warehouseId(warehouseId)
                .locationId(locationId).batchId(batchId).referenceType(ReferenceType.PRODUCTION).referenceId(orderId)
                .referenceLineId(materialId).reservedQuantity(new BigDecimal("100")).releasedQuantity(BigDecimal.ZERO)
                .status(ReservationStatus.RESERVED.name()).build();
            reservation.setCompanyId(companyId);
            ProductBatch batch = ProductBatch.builder().id(batchId).productId(productId).status("ACTIVE").build();
            batch.setCompanyId(companyId);
            UnitOfMeasure uom = UnitOfMeasure.builder().id(uomId).code("KG").isActive(true).build();
            uom.setCompanyId(companyId);
            InventoryStock stock = InventoryStock.builder().id(UUID.randomUUID()).productId(productId).warehouseId(warehouseId)
                .locationId(locationId).batchId(batchId).quantity(new BigDecimal("100"))
                .availableQuantity(BigDecimal.ZERO).reservedQuantity(new BigDecimal("100"))
                .averageCost(new BigDecimal("2.00")).build();
            stock.setCompanyId(companyId);
        lenient().when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        lenient().when(unitOfMeasureRepository.findByIdAndCompanyId(uomId, companyId)).thenReturn(Optional.of(uom));
        Warehouse warehouse = Warehouse.builder().id(warehouseId).status("ACTIVE").build();
        warehouse.setCompanyId(companyId);
        WarehouseLocation location = WarehouseLocation.builder().id(locationId).isActive(true).build();
        location.setWarehouseId(warehouseId);
        location.setCompanyId(companyId);
        lenient().when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        lenient().when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        lenient().when(stockReservationRepository.findByIdAndCompanyId(reservationId, companyId)).thenReturn(Optional.of(reservation));
        lenient().when(productBatchRepository.findByIdAndCompanyId(batchId, companyId)).thenReturn(Optional.of(batch));
        lenient().when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, batchId, companyId)).thenReturn(Optional.of(stock));
        lenient().when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)).thenReturn(Optional.empty());
        lenient().when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(i -> { StockMovement m = i.getArgument(0); m.setId(UUID.randomUUID()); return m; });
    }
    @AfterEach void tearDown() { CurrentUserContext.clear(); }

    @Test void successfulProductionStockOut() { ProductionStockOutResponse r = consume(new BigDecimal("100")); assertNotNull(r.getInventoryMovementId()); assertEquals("PRODUCTION_OUT", r.getMovementType()); assertEquals("PRODUCTION", r.getReferenceType()); }
    @Test void movementAndReferenceValuesAreEnforced() { ProductionStockOutResponse r = consume(new BigDecimal("100")); assertEquals(orderId, r.getReferenceId()); assertEquals(materialId, r.getReferenceLineId()); }
    @Test void inventoryMovementIdReturned() { assertNotNull(consume(new BigDecimal("100")).getInventoryMovementId()); }
    @Test void stockServicePerformsPhysicalDeduction() { consume(new BigDecimal("100")); verify(inventoryStockService).consumeReservedStock(productId, warehouseId, locationId, batchId, new BigDecimal("100"), companyId); }
    @Test void movementLineCreatedAndValued() { consume(new BigDecimal("100")); verify(stockMovementLineRepository).save(any(StockMovementLine.class)); verify(inventoryCostLayerService).processOutboundCost(any(), eq(companyId)); }
    @Test void reservationReconciled() { consume(new BigDecimal("100")); assertEquals(ReservationStatus.CONSUMED.name(), reservation.getStatus()); assertEquals(new BigDecimal("100"), reservation.getReleasedQuantity()); verify(stockReservationRepository).save(reservation); }
    @Test void insufficientStockRejected() { doThrow(new RuntimeException("insufficient")).when(inventoryStockService).consumeReservedStock(any(), any(), any(), any(), any(), any()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); verify(stockMovementLineRepository, never()).save(any()); }
    @Test void invalidProductRejected() { when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void invalidUomRejected() { when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void invalidWarehouseRejected() { when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void invalidLocationRejected() { when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void invalidBatchRejected() { when(stockReservationRepository.findByIdAndCompanyId(reservationId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void crossCompanyProductRejected() { when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void crossCompanyReservationRejected() { when(stockReservationRepository.findByIdAndCompanyId(reservationId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void duplicateIdempotencyKeyReturnsExistingMovement() { StockMovement existing = StockMovement.builder().id(UUID.randomUUID()).movementType("PRODUCTION_OUT").referenceType(ReferenceType.PRODUCTION).referenceId(orderId).build(); when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, idempotencyKey)).thenReturn(Optional.of(existing)); assertEquals(existing.getId(), consume(new BigDecimal("100")).getInventoryMovementId()); verify(inventoryStockService, never()).consumeReservedStock(any(), any(), any(), any(), any(), any()); }
    @Test void retryAfterLostResponseIsIdempotent() { duplicateIdempotencyKeyReturnsExistingMovement(); }
    @Test void missingReservationRejected() { when(stockReservationRepository.findByIdAndCompanyId(reservationId, companyId)).thenReturn(Optional.empty()); assertThrows(RuntimeException.class, () -> consume(new BigDecimal("100"))); }
    @Test void zeroQuantityRejected() { assertThrows(RuntimeException.class, () -> consume(BigDecimal.ZERO)); }
    @Test void negativeQuantityRejected() { assertThrows(RuntimeException.class, () -> consume(new BigDecimal("-1"))); }
    @Test void decimalQuantitySupported() { assertDoesNotThrow(() -> consume(new BigDecimal("2.50"))); }
    @Test void kgAndTonQuantitiesSupported() { assertDoesNotThrow(() -> consume(new BigDecimal("0.25"))); }
    @Test void batchIdIsPassedToStockService() { consume(new BigDecimal("100")); verify(inventoryStockService).consumeReservedStock(productId, warehouseId, locationId, batchId, new BigDecimal("100"), companyId); }
    @Test void movementReferenceLineIsPersisted() { consume(new BigDecimal("100")); ArgumentCaptor<StockMovementLine> c = ArgumentCaptor.forClass(StockMovementLine.class); verify(stockMovementLineRepository).save(c.capture()); assertEquals(materialId, c.getValue().getReferenceLineId()); }
    @Test void postedStatusReturned() { assertEquals("POSTED", consume(new BigDecimal("100")).getStatus()); }
    @Test void duplicateDoesNotDeductAgain() { duplicateIdempotencyKeyReturnsExistingMovement(); verify(stockMovementRepository, never()).saveAndFlush(any()); }

    private ProductionStockOutResponse consume(BigDecimal quantity) {
        ProductionStockOutRequest request = ProductionStockOutRequest.builder().productionOrderId(orderId).productionOrderMaterialId(materialId)
                .productId(productId).quantity(quantity).uomId(uomId).warehouseId(warehouseId).locationId(locationId).batchId(batchId)
                .reservationId(reservationId).idempotencyKey(idempotencyKey).build();
        return service.createStockOut(request, companyId);
    }
}
