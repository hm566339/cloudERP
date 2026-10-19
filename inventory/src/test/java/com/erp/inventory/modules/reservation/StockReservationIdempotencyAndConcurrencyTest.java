package com.erp.inventory.modules.reservation;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.period.entity.InventoryPeriod;
import com.erp.inventory.modules.period.repository.InventoryPeriodRepository;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.entity.UnitOfMeasure;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.ReferenceType;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.product.repository.UnitOfMeasureRepository;
import com.erp.inventory.modules.reservation.dto.request.StockReservationRequest;
import com.erp.inventory.modules.reservation.dto.response.StockReservationResponse;
import com.erp.inventory.modules.reservation.entity.StockReservation;
import com.erp.inventory.modules.reservation.enums.ReservationStatus;
import com.erp.inventory.modules.reservation.repository.StockReservationRepository;
import com.erp.inventory.modules.reservation.service.StockReservationService;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.product.enums.ProductType;
import com.erp.inventory.modules.warehouse.enums.LocationType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class StockReservationIdempotencyAndConcurrencyTest {

    @Autowired private StockReservationService reservationService;
    @Autowired private StockReservationRepository reservationRepository;
    @Autowired private InventoryStockService stockService;
    @Autowired private InventoryStockRepository stockRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private UnitOfMeasureRepository uomRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private WarehouseLocationRepository locationRepository;
    @Autowired private ProductBatchRepository batchRepository;
    @Autowired private InventoryPeriodRepository periodRepository;

    private UUID companyId1;
    private UUID companyId2;
    private Product product1;
    private Warehouse warehouse1;
    private WarehouseLocation location1;
    private ProductBatch batch1;

    @BeforeEach
    void setUp() {
        companyId1 = UUID.randomUUID();
        companyId2 = UUID.randomUUID();

        // Setup active inventory period for today
        InventoryPeriod period1 = InventoryPeriod.builder()
                .periodName("2026-10")
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .status("OPEN")
                .build();
        period1.setCompanyId(companyId1);
        periodRepository.save(period1);

        InventoryPeriod period2 = InventoryPeriod.builder()
                .periodName("2026-10")
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().plusDays(20))
                .status("OPEN")
                .build();
        period2.setCompanyId(companyId2);
        periodRepository.save(period2);

        UnitOfMeasure uom = UnitOfMeasure.builder()
                .code("KG")
                .name("Kilogram")
                .decimalPlaces(4)
                .isActive(true)
                .build();
        uom.setCompanyId(companyId1);
        uom = uomRepository.save(uom);

        product1 = Product.builder()
                .productCode("RM-STEEL-001")
                .sku("SKU-STEEL-001")
                .productName("Steel Sheet")
                .productType(ProductType.GOODS)
                .trackingType(TrackingType.BATCH)
                .baseUomId(uom.getId())
                .standardCost(new BigDecimal("50.0000"))
                .status(ProductStatus.ACTIVE)
                .build();
        product1.setCompanyId(companyId1);
        product1 = productRepository.save(product1);

        warehouse1 = Warehouse.builder()
                .warehouseCode("WH-MAIN")
                .warehouseName("Main Warehouse")
                .status("ACTIVE")
                .build();
        warehouse1.setCompanyId(companyId1);
        warehouse1 = warehouseRepository.save(warehouse1);

        location1 = WarehouseLocation.builder()
                .warehouse(warehouse1)
                .locationType(LocationType.BIN)
                .locationCode("LOC-A1")
                .locationName("Location A1")
                .isActive(true)
                .build();
        location1.setCompanyId(companyId1);
        location1 = locationRepository.save(location1);

        batch1 = ProductBatch.builder()
                .productId(product1.getId())
                .batchNumber("BATCH-2026-001")
                .status("ACTIVE")
                .expiryDate(LocalDate.now().plusMonths(6))
                .build();
        batch1.setCompanyId(companyId1);
        batch1 = batchRepository.save(batch1);

        // Add 10 units of initial stock
        stockService.addStock(product1.getId(), warehouse1.getId(), location1.getId(),
                batch1.getId(), new BigDecimal("10.0000"), new BigDecimal("50.0000"), companyId1);
    }

    @Test
    @DisplayName("Requirement 1: Same reservation request sent twice returns original result without duplicate stock hold")
    void testSameReservationRequestSentTwice() {
        UUID idempotencyKey = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();

        StockReservationRequest request = new StockReservationRequest();
        request.setIdempotencyKey(idempotencyKey);
        request.setReservationNo("RES-" + idempotencyKey);
        request.setProductId(product1.getId());
        request.setWarehouseId(warehouse1.getId());
        request.setLocationId(location1.getId());
        request.setBatchId(batch1.getId());
        request.setReferenceType(ReferenceType.PRODUCTION);
        request.setReferenceId(orderId);
        request.setReferenceLineId(materialId);
        request.setReservedQuantity(new BigDecimal("4.0000"));
        request.setReleasedQuantity(BigDecimal.ZERO);

        StockReservationResponse firstResponse = reservationService.create(request, companyId1);
        assertNotNull(firstResponse);
        assertNotNull(firstResponse.getId());
        assertEquals(0, new BigDecimal("4.0000").compareTo(firstResponse.getReservedQuantity()));

        // Re-send the exact same request
        StockReservationResponse secondResponse = reservationService.create(request, companyId1);
        assertNotNull(secondResponse);
        assertEquals(firstResponse.getId(), secondResponse.getId());
        assertEquals(0, firstResponse.getReservedQuantity().compareTo(secondResponse.getReservedQuantity()));

        // Stock must have reserved 4, remaining available 6
        InventoryStock stock = stockRepository.findUniqueStock(
                product1.getId(), warehouse1.getId(), location1.getId(), batch1.getId(), companyId1).orElseThrow();
        assertEquals(0, new BigDecimal("4.0000").compareTo(stock.getReservedQuantity()));
        assertEquals(0, new BigDecimal("6.0000").compareTo(stock.getAvailableQuantity()));
    }

    @Test
    @DisplayName("Requirement 10: Reservation release called twice is idempotent and does not release twice")
    void testReservationReleaseCalledTwice() {
        UUID idempotencyKey = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();

        StockReservationRequest request = new StockReservationRequest();
        request.setIdempotencyKey(idempotencyKey);
        request.setReservationNo("RES-" + idempotencyKey);
        request.setProductId(product1.getId());
        request.setWarehouseId(warehouse1.getId());
        request.setLocationId(location1.getId());
        request.setBatchId(batch1.getId());
        request.setReferenceType(ReferenceType.PRODUCTION);
        request.setReferenceId(orderId);
        request.setReferenceLineId(materialId);
        request.setReservedQuantity(new BigDecimal("5.0000"));
        request.setReleasedQuantity(BigDecimal.ZERO);

        StockReservationResponse res = reservationService.create(request, companyId1);

        // First release
        StockReservationResponse release1 = reservationService.releaseReservation(res.getId(), companyId1);
        assertEquals(ReservationStatus.RELEASED.name(), release1.getStatus());

        // Second release
        StockReservationResponse release2 = reservationService.releaseReservation(res.getId(), companyId1);
        assertEquals(ReservationStatus.RELEASED.name(), release2.getStatus());
        assertEquals(release1.getId(), release2.getId());

        // Stock available must be back to 10, reserved 0
        InventoryStock stock = stockRepository.findUniqueStock(
                product1.getId(), warehouse1.getId(), location1.getId(), batch1.getId(), companyId1).orElseThrow();
        assertEquals(0, BigDecimal.ZERO.compareTo(stock.getReservedQuantity()));
        assertEquals(0, new BigDecimal("10.0000").compareTo(stock.getAvailableQuantity()));
    }

    @Test
    @DisplayName("Requirement 14: Reuse of idempotency key with different payload is rejected")
    void testReuseIdempotencyKeyWithDifferentPayload() {
        UUID idempotencyKey = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        UUID materialId = UUID.randomUUID();

        StockReservationRequest request1 = new StockReservationRequest();
        request1.setIdempotencyKey(idempotencyKey);
        request1.setReservationNo("RES-" + idempotencyKey);
        request1.setProductId(product1.getId());
        request1.setWarehouseId(warehouse1.getId());
        request1.setLocationId(location1.getId());
        request1.setBatchId(batch1.getId());
        request1.setReferenceType(ReferenceType.PRODUCTION);
        request1.setReferenceId(orderId);
        request1.setReferenceLineId(materialId);
        request1.setReservedQuantity(new BigDecimal("3.0000"));
        request1.setReleasedQuantity(BigDecimal.ZERO);

        reservationService.create(request1, companyId1);

        // Same idempotency key, but different quantity (5 instead of 3)
        StockReservationRequest request2 = new StockReservationRequest();
        request2.setIdempotencyKey(idempotencyKey);
        request2.setReservationNo("RES-" + idempotencyKey);
        request2.setProductId(product1.getId());
        request2.setWarehouseId(warehouse1.getId());
        request2.setLocationId(location1.getId());
        request2.setBatchId(batch1.getId());
        request2.setReferenceType(ReferenceType.PRODUCTION);
        request2.setReferenceId(orderId);
        request2.setReferenceLineId(materialId);
        request2.setReservedQuantity(new BigDecimal("5.0000"));
        request2.setReleasedQuantity(BigDecimal.ZERO);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () ->
                reservationService.create(request2, companyId1));
        assertTrue(ex.getMessage().contains("mismatched payload"));
    }

    @Test
    @DisplayName("Requirement 4 & 9: Two production orders competing for insufficient stock cannot oversubscribe")
    void testConcurrentReservationsCompetingForStock() throws Exception {
        // Available stock is 10.0000
        // Order 1 requests 7 units, Order 2 requests 7 units.
        // Total requested = 14 > 10. Exactly ONE must succeed, and ONE must fail with insufficient stock.
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startGate = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        Callable<Void> task1 = () -> {
            startGate.await();
            try {
                StockReservationRequest req = new StockReservationRequest();
                req.setIdempotencyKey(UUID.randomUUID());
                req.setReservationNo("RES-ORDER1");
                req.setProductId(product1.getId());
                req.setWarehouseId(warehouse1.getId());
                req.setLocationId(location1.getId());
                req.setBatchId(batch1.getId());
                req.setReferenceType(ReferenceType.PRODUCTION);
                req.setReferenceId(UUID.randomUUID());
                req.setReferenceLineId(UUID.randomUUID());
                req.setReservedQuantity(new BigDecimal("7.0000"));
                req.setReleasedQuantity(BigDecimal.ZERO);
                reservationService.create(req, companyId1);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
            return null;
        };

        Callable<Void> task2 = () -> {
            startGate.await();
            try {
                StockReservationRequest req = new StockReservationRequest();
                req.setIdempotencyKey(UUID.randomUUID());
                req.setReservationNo("RES-ORDER2");
                req.setProductId(product1.getId());
                req.setWarehouseId(warehouse1.getId());
                req.setLocationId(location1.getId());
                req.setBatchId(batch1.getId());
                req.setReferenceType(ReferenceType.PRODUCTION);
                req.setReferenceId(UUID.randomUUID());
                req.setReferenceLineId(UUID.randomUUID());
                req.setReservedQuantity(new BigDecimal("7.0000"));
                req.setReleasedQuantity(BigDecimal.ZERO);
                reservationService.create(req, companyId1);
                successCount.incrementAndGet();
            } catch (Exception e) {
                failureCount.incrementAndGet();
            }
            return null;
        };

        Future<Void> f1 = executor.submit(task1);
        Future<Void> f2 = executor.submit(task2);
        startGate.countDown();
        f1.get();
        f2.get();
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one order should successfully reserve");
        assertEquals(1, failureCount.get(), "The other order must fail due to insufficient stock");

        // Stock available should be 3, reserved 7
        InventoryStock stock = stockRepository.findUniqueStock(
                product1.getId(), warehouse1.getId(), location1.getId(), batch1.getId(), companyId1).orElseThrow();
        assertEquals(0, new BigDecimal("7.0000").compareTo(stock.getReservedQuantity()));
        assertEquals(0, new BigDecimal("3.0000").compareTo(stock.getAvailableQuantity()));
    }
}
