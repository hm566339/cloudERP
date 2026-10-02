package com.erp.inventory.modules.stock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryStockServiceImplTest {

    @Mock private InventoryStockRepository repository;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;
    @Mock private ProductBatchRepository productBatchRepository;

    @InjectMocks
    private InventoryStockServiceImpl service;

    private UUID companyId = UUID.randomUUID();
    private UUID warehouseId = UUID.randomUUID();
    private UUID locationId = UUID.randomUUID();
    private UUID productId = UUID.randomUUID();
    private UUID batchId = UUID.randomUUID();
    private org.mockito.MockedStatic<com.erp.inventory.common.util.TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(com.erp.inventory.common.util.TenantUtils.class);
        mockedTenantUtils.when(() -> com.erp.inventory.common.util.TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));

        Product product = new Product();
        product.setId(productId);
        lenient().when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        lenient().when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);
        lenient().when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        ProductBatch batch = new ProductBatch();
        batch.setId(batchId);
        batch.setProductId(productId);
        lenient().when(productBatchRepository.findByIdAndCompanyId(batchId, companyId)).thenReturn(Optional.of(batch));

        lenient().when(repository.saveAndFlush(any(InventoryStock.class))).thenAnswer(inv -> {
            InventoryStock stock = inv.getArgument(0);
            if (stock.getId() == null) stock.setId(UUID.randomUUID());
            return stock;
        });
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    void addStock_NewStock_InsertsNewRecord() {
        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.empty());

        InventoryStock result = service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("10.5"), new BigDecimal("12.25"), companyId);

        ArgumentCaptor<InventoryStock> captor = ArgumentCaptor.forClass(InventoryStock.class);
        verify(repository).saveAndFlush(captor.capture());

        InventoryStock stock = captor.getValue();
        assertEquals(new BigDecimal("10.5"), stock.getQuantity());
        assertEquals(new BigDecimal("10.5"), stock.getAvailableQuantity());
        assertEquals(BigDecimal.ZERO, stock.getReservedQuantity());
        assertEquals(new BigDecimal("12.25"), stock.getAverageCost());
        assertEquals(new BigDecimal("128.6250"), stock.getStockValue());
        assertNotNull(stock.getLastMovementAt());
        assertEquals(companyId, stock.getCompanyId());
        assertFalse(stock.getIsDeleted());
        assertNotNull(result);
    }

    @Test
    void addStock_ExistingStock_UpdatesQuantityAndWeightedAverage() {
        InventoryStock existing = new InventoryStock();
        existing.setId(UUID.randomUUID());
        existing.setQuantity(new BigDecimal("100"));
        existing.setAvailableQuantity(new BigDecimal("100"));
        existing.setAverageCost(new BigDecimal("1250"));
        existing.setStockValue(new BigDecimal("125000"));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.of(existing));

        // Adding 50 units at 800 cost (Value = 40000)
        // Total Qty = 150. Total Value = 165000. Avg Cost = 1100.
        InventoryStock result = service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("50"), new BigDecimal("800"), companyId);

        ArgumentCaptor<InventoryStock> captor = ArgumentCaptor.forClass(InventoryStock.class);
        verify(repository).saveAndFlush(captor.capture());

        InventoryStock stock = captor.getValue();
        assertEquals(new BigDecimal("150"), stock.getQuantity());
        assertEquals(new BigDecimal("150"), stock.getAvailableQuantity());
        assertEquals(new BigDecimal("165000.0000"), stock.getStockValue());
        assertEquals(new BigDecimal("1100.0000"), stock.getAverageCost());
        assertNotNull(stock.getLastMovementAt());
        assertNotNull(stock.getUpdatedAt());
        assertSame(existing, result);
    }

    @Test
    void addStock_NullBatchId_Success() {
        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.empty());

        InventoryStock stock = service.addStock(productId, warehouseId, locationId, null, new BigDecimal("20"), new BigDecimal("100"), companyId);

        assertNotNull(stock);
        assertEquals(new BigDecimal("20"), stock.getQuantity());
        assertNull(stock.getBatchId());
        verify(productBatchRepository, never()).findByIdAndCompanyId(any(), any());
    }

    @Test
    void addStock_NullLocationId_Success() {
        when(repository.findUniqueStockForUpdate(productId, warehouseId, null, batchId, companyId))
                .thenReturn(Optional.empty());

        InventoryStock stock = service.addStock(productId, warehouseId, null, batchId, new BigDecimal("30"), new BigDecimal("200"), companyId);

        assertNotNull(stock);
        assertEquals(new BigDecimal("30"), stock.getQuantity());
        assertNull(stock.getLocationId());
        verify(warehouseLocationRepository, never()).findByIdAndCompanyId(any(), any());
    }

    @Test
    void addStock_MultipleOperations_QuantityCumulative() {
        InventoryStock stock = new InventoryStock();
        stock.setId(UUID.randomUUID());
        stock.setQuantity(new BigDecimal("10"));
        stock.setAvailableQuantity(new BigDecimal("10"));
        stock.setAverageCost(new BigDecimal("50"));
        stock.setStockValue(new BigDecimal("500"));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.of(stock));

        // First addition: +15 @ 60
        service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("15"), new BigDecimal("60"), companyId);
        assertEquals(new BigDecimal("25"), stock.getQuantity());
        assertEquals(new BigDecimal("25"), stock.getAvailableQuantity());

        // Second addition: +25 @ 70
        service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("25"), new BigDecimal("70"), companyId);
        assertEquals(new BigDecimal("50"), stock.getQuantity());
        assertEquals(new BigDecimal("50"), stock.getAvailableQuantity());
        verify(repository, times(2)).saveAndFlush(stock);
    }

    @Test
    void addStock_ConcurrentInsertRace_ResolvesWithoutLoss() {
        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.empty());

        InventoryStock existingFromOtherThread = new InventoryStock();
        existingFromOtherThread.setId(UUID.randomUUID());
        existingFromOtherThread.setQuantity(new BigDecimal("10"));
        existingFromOtherThread.setAvailableQuantity(new BigDecimal("10"));
        existingFromOtherThread.setAverageCost(new BigDecimal("100"));
        existingFromOtherThread.setStockValue(new BigDecimal("1000"));

        // First saveAndFlush fails with unique constraint violation, second succeeds on concurrent existing row
        when(repository.saveAndFlush(any(InventoryStock.class)))
                .thenThrow(new DataIntegrityViolationException("Unique constraint violation"))
                .thenAnswer(inv -> inv.getArgument(0));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(existingFromOtherThread));

        InventoryStock result = service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("20"), new BigDecimal("100"), companyId);

        assertNotNull(result);
        assertEquals(new BigDecimal("30"), result.getQuantity());
        assertEquals(new BigDecimal("30"), result.getAvailableQuantity());
    }

    @Test
    void addStock_ExistingQuantity10_Add5_Yields15() {
        InventoryStock existing = new InventoryStock();
        existing.setId(UUID.randomUUID());
        existing.setQuantity(new BigDecimal("10.0000"));
        existing.setAvailableQuantity(new BigDecimal("10.0000"));
        existing.setReservedQuantity(new BigDecimal("2.0000")); // reserved should not change
        existing.setAverageCost(new BigDecimal("100.0000"));
        existing.setStockValue(new BigDecimal("1000.0000"));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, locationId, batchId, companyId))
                .thenReturn(Optional.of(existing));

        // Add 5 @ 100
        InventoryStock result = service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("5.0000"), new BigDecimal("100.0000"), companyId);

        assertEquals(new BigDecimal("15.0000"), result.getQuantity());
        assertEquals(new BigDecimal("15.0000"), result.getAvailableQuantity());
        assertEquals(new BigDecimal("2.0000"), result.getReservedQuantity()); // reserved untouched
        assertEquals(new BigDecimal("100.0000"), result.getAverageCost());
        assertEquals(new BigDecimal("1500.0000"), result.getStockValue());
    }

    @Test
    void addStock_LocationSpecific_UpdatesCorrectRow() {
        UUID otherLocationId = UUID.randomUUID();
        WarehouseLocation otherLocation = new WarehouseLocation();
        otherLocation.setId(otherLocationId);
        otherLocation.setWarehouseId(warehouseId);
        when(warehouseLocationRepository.findByIdAndCompanyId(otherLocationId, companyId))
                .thenReturn(Optional.of(otherLocation));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, otherLocationId, batchId, companyId))
                .thenReturn(Optional.empty());

        InventoryStock result = service.addStock(productId, warehouseId, otherLocationId, batchId, new BigDecimal("8.0000"), new BigDecimal("50.0000"), companyId);

        assertNotNull(result);
        assertEquals(otherLocationId, result.getLocationId());
        assertEquals(new BigDecimal("8.0000"), result.getQuantity());
    }

    @Test
    void addStock_DifferentWarehouse_SeparateRow() {
        UUID otherWarehouseId = UUID.randomUUID();
        Warehouse otherWarehouse = new Warehouse();
        otherWarehouse.setId(otherWarehouseId);
        when(warehouseRepository.findByIdAndCompanyId(otherWarehouseId, companyId))
                .thenReturn(Optional.of(otherWarehouse));

        when(repository.findUniqueStockForUpdate(productId, otherWarehouseId, null, null, companyId))
                .thenReturn(Optional.empty());

        InventoryStock result = service.addStock(productId, otherWarehouseId, null, null, new BigDecimal("12.0000"), new BigDecimal("40.0000"), companyId);

        assertNotNull(result);
        assertEquals(otherWarehouseId, result.getWarehouseId());
        assertNull(result.getLocationId());
        assertNull(result.getBatchId());
        assertEquals(new BigDecimal("12.0000"), result.getQuantity());
    }

    @Test
    void addStock_DifferentCompany_SeparateRow() {
        UUID otherCompanyId = UUID.randomUUID();
        Product otherCompanyProduct = new Product();
        otherCompanyProduct.setId(productId);
        when(productRepository.findByIdAndCompanyId(productId, otherCompanyId))
                .thenReturn(Optional.of(otherCompanyProduct));

        Warehouse otherCompanyWarehouse = new Warehouse();
        otherCompanyWarehouse.setId(warehouseId);
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, otherCompanyId))
                .thenReturn(Optional.of(otherCompanyWarehouse));

        when(repository.findUniqueStockForUpdate(productId, warehouseId, null, null, otherCompanyId))
                .thenReturn(Optional.empty());

        InventoryStock result = service.addStock(productId, warehouseId, null, null, new BigDecimal("7.0000"), new BigDecimal("35.0000"), otherCompanyId);

        assertNotNull(result);
        assertEquals(otherCompanyId, result.getCompanyId());
        assertEquals(new BigDecimal("7.0000"), result.getQuantity());
    }

    @Test
    void addStock_InvalidQuantity_ThrowsException() {
        assertThrows(BusinessValidationException.class, () -> {
            service.addStock(productId, warehouseId, locationId, batchId, BigDecimal.ZERO, new BigDecimal("10"), companyId);
        });

        assertThrows(BusinessValidationException.class, () -> {
            service.addStock(productId, warehouseId, locationId, batchId, new BigDecimal("-5"), new BigDecimal("10"), companyId);
        });

        assertThrows(BusinessValidationException.class, () -> {
            service.addStock(productId, warehouseId, locationId, batchId, null, new BigDecimal("10"), companyId);
        });
    }
}
