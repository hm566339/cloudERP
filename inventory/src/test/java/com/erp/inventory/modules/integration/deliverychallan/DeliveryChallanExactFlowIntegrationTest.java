package com.erp.inventory.modules.integration.deliverychallan;

import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutItemRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.response.DeliveryChallanStockOutResponse;
import com.erp.inventory.modules.integration.deliverychallan.service.impl.DeliveryChallanIntegrationServiceImpl;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DeliveryChallanExactFlowIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(DeliveryChallanExactFlowIntegrationTest.class);

    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;

    private InventoryStockServiceImpl inventoryStockService;
    private DeliveryChallanIntegrationServiceImpl deliveryChallanIntegrationService;

    private MockedStatic<TenantUtils> mockedTenantUtils;

    private final UUID companyId = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
    private final UUID dcId = UUID.fromString("c0a80101-9000-4000-8000-000000000001");
    private final UUID productId = UUID.fromString("f115afa2-d7ee-446a-8422-8312a993c103");
    private final UUID warehouseId = UUID.fromString("fdae1e76-82e9-4780-bbef-4937e7c32f1b");
    private final UUID locationId = UUID.fromString("ff9293d2-d3eb-48de-b6f9-26c27dae3ae2");

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> {
            UUID arg = i.getArgument(0);
            return arg != null ? arg : companyId;
        });

        inventoryStockService = new InventoryStockServiceImpl(
                inventoryStockRepository,
                null,
                productRepository,
                warehouseRepository,
                warehouseLocationRepository,
                null
        );

        deliveryChallanIntegrationService = new DeliveryChallanIntegrationServiceImpl(
                stockMovementRepository,
                stockMovementLineRepository,
                inventoryStockService,
                inventoryStockRepository,
                inventoryCostLayerService,
                productRepository,
                warehouseRepository,
                warehouseLocationRepository
        );
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    @DisplayName("Exact Reproduction for Delivery Challan DC-2026-09-000001 (Total: 53100) verifying Stock-OUT and Inventory Deduction")
    void testExactDeliveryChallanStockOutFlow() {
        // Prepare Request for exact DC-2026-09-000001
        DeliveryChallanStockOutRequest request = DeliveryChallanStockOutRequest.builder()
                .idempotencyKey(UUID.randomUUID())
                .companyId(companyId)
                .deliveryChallanId(dcId)
                .dcNumber("DC-2026-09-000001")
                .dcDate(LocalDate.of(2026, 9, 14))
                .movementType("OUT")
                .items(Collections.singletonList(
                        DeliveryChallanStockOutItemRequest.builder()
                                .productId(productId)
                                .quantity(new BigDecimal("1.0000"))
                                .unit("PCS")
                                .unitPrice(new BigDecimal("45000.0000"))
                                .warehouseId(warehouseId)
                                .locationId(locationId)
                                .build()
                ))
                .build();

        // 1. Mock Entities in DB
        Product product = new Product();
        product.setId(productId);
        product.setProductName("Industrial Pump Model X");
        product.setStatus(ProductStatus.ACTIVE);
        product.setBaseUomId(UUID.randomUUID());

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);

        // Initial inventory stock: quantity = 10, available = 10, avgCost = 35000
        InventoryStock stock = new InventoryStock();
        stock.setId(UUID.randomUUID());
        stock.setProductId(productId);
        stock.setWarehouseId(warehouseId);
        stock.setLocationId(locationId);
        stock.setCompanyId(companyId);
        stock.setQuantity(new BigDecimal("10.0000"));
        stock.setAvailableQuantity(new BigDecimal("10.0000"));
        stock.setReservedQuantity(BigDecimal.ZERO);
        stock.setAverageCost(new BigDecimal("35000.0000"));
        stock.setStockValue(new BigDecimal("350000.0000"));

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        // For idempotency check
        when(stockMovementRepository.findByCompanyIdAndIdempotencyKey(companyId, request.getIdempotencyKey()))
                .thenReturn(Optional.empty());
        when(stockMovementRepository.findByCompanyIdAndReferenceTypeAndReferenceId(companyId, ReferenceType.DELIVERY_CHALLAN, dcId))
                .thenReturn(Optional.empty());

        // For inventory lookup and pessimistic update in removeStock
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(stock));
        when(inventoryStockRepository.findUniqueStockForUpdate(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(stock));

        when(stockMovementRepository.saveAndFlush(any(StockMovement.class))).thenAnswer(i -> {
            StockMovement sm = i.getArgument(0);
            if (sm.getId() == null) {
                sm.setId(UUID.randomUUID());
            }
            log.info("Hibernate SQL (simulated): insert into stock_movement (company_id, movement_type, reference_type, reference_number, reference_id, status, total_quantity, total_value, id) values (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            return sm;
        });

        when(stockMovementLineRepository.saveAndFlush(any(StockMovementLine.class))).thenAnswer(i -> {
            StockMovementLine line = i.getArgument(0);
            if (line.getId() == null) {
                line.setId(UUID.randomUUID());
            }
            log.info("Hibernate SQL (simulated): insert into stock_movement_line (stock_movement_id, product_id, quantity, quantity_before, quantity_after, unit_cost, total_cost, id) values (?, ?, ?, ?, ?, ?, ?, ?)");
            return line;
        });

        when(inventoryStockRepository.save(any(InventoryStock.class))).thenAnswer(i -> {
            InventoryStock s = i.getArgument(0);
            log.info("Hibernate SQL (simulated): update inventory_stock set quantity=?, available_quantity=?, stock_value=?, last_movement_at=? where id=?");
            return s;
        });

        // 2. Execute Stock OUT for DC-2026-09-000001
        DeliveryChallanStockOutResponse response = deliveryChallanIntegrationService.createStockOut(request);

        // 3. Verify Response
        assertNotNull(response);
        assertEquals("POSTED", response.getStatus());
        assertEquals("OUT", response.getMovementType());
        assertEquals("DC-2026-09-000001", response.getDcNumber());
        assertEquals(dcId, response.getDeliveryChallanId());
        assertEquals(new BigDecimal("1.0000"), response.getTotalQuantity());
        assertEquals(new BigDecimal("35000.0000"), response.getTotalValue());

        // 4. Verify StockMovement Header created
        ArgumentCaptor<StockMovement> smCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository, atLeastOnce()).saveAndFlush(smCaptor.capture());
        StockMovement createdSm = smCaptor.getAllValues().get(0);
        assertEquals("OUT", createdSm.getMovementType());
        assertEquals("POSTED", createdSm.getStatus());
        assertEquals(ReferenceType.DELIVERY_CHALLAN, createdSm.getReferenceType());
        assertEquals(dcId, createdSm.getReferenceId());
        assertEquals("DC-2026-09-000001", createdSm.getReferenceNumber());

        // 5. Verify Inventory Stock Updated
        ArgumentCaptor<InventoryStock> stockCaptor = ArgumentCaptor.forClass(InventoryStock.class);
        verify(inventoryStockRepository, times(1)).save(stockCaptor.capture());
        InventoryStock updatedStock = stockCaptor.getValue();
        assertEquals(new BigDecimal("9.0000"), updatedStock.getQuantity(), "Quantity must decrease by 1.0000");
        assertEquals(new BigDecimal("9.0000"), updatedStock.getAvailableQuantity(), "Available quantity must decrease by 1.0000");
        assertEquals(new BigDecimal("35000.0000"), updatedStock.getAverageCost(), "Average cost must be maintained");
        assertEquals(new BigDecimal("315000.0000"), updatedStock.getStockValue(), "Stock value must be 9 * 35000 = 315000.0000");

        // 6. Verify Movement Line Created
        ArgumentCaptor<StockMovementLine> lineCaptor = ArgumentCaptor.forClass(StockMovementLine.class);
        verify(stockMovementLineRepository, times(1)).saveAndFlush(lineCaptor.capture());
        StockMovementLine createdLine = lineCaptor.getValue();
        assertEquals(productId, createdLine.getProductId());
        assertEquals(new BigDecimal("1.0000"), createdLine.getQuantity());
        assertEquals(new BigDecimal("10.0000"), createdLine.getQuantityBefore());
        assertEquals(new BigDecimal("9.0000"), createdLine.getQuantityAfter());

        // 7. Verify Outbound Cost Layer
        verify(inventoryCostLayerService, times(1)).processOutboundCost(eq(createdLine), eq(companyId));
    }
}
