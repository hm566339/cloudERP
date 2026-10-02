package com.erp.inventory.modules.valuation.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.common.exception.ResourceNotFoundException;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.valuation.dto.request.InventoryValuationRequest;
import com.erp.inventory.modules.valuation.dto.response.InventoryValuationResponse;
import com.erp.inventory.modules.valuation.entity.InventoryValuation;
import com.erp.inventory.modules.valuation.mapper.InventoryValuationMapper;
import com.erp.inventory.modules.valuation.repository.InventoryValuationRepository;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryValuationServiceImplTest {

    @Mock private InventoryValuationRepository repository;
    @Mock private InventoryValuationMapper mapper;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository locationRepository;
    @Mock private ProductBatchRepository batchRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private InventoryPeriodService inventoryPeriodService;

    @InjectMocks
    private InventoryValuationServiceImpl service;

    private UUID companyId = UUID.randomUUID();
    private UUID productId = UUID.randomUUID();
    private UUID warehouseId = UUID.randomUUID();
    private UUID locationId = UUID.randomUUID();
    private UUID batchId = UUID.randomUUID();

    private MockedStatic<TenantUtils> mockedTenantUtils;

    @BeforeEach
    void setUp() {
        mockedTenantUtils = mockStatic(TenantUtils.class);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenAnswer(i -> i.getArgument(0));
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyIdForQuery(any())).thenAnswer(i -> i.getArgument(0));

        lenient().when(repository.saveAndFlush(any(InventoryValuation.class))).thenAnswer(i -> {
            InventoryValuation val = i.getArgument(0);
            if (val.getId() == null) val.setId(UUID.randomUUID());
            return val;
        });

        lenient().when(mapper.toEntity(any(InventoryValuationRequest.class))).thenAnswer(i -> {
            InventoryValuationRequest req = i.getArgument(0);
            InventoryValuation v = new InventoryValuation();
            v.setStockMovementId(req.getStockMovementId());
            v.setStockMovementLineId(req.getStockMovementLineId());
            v.setProductId(req.getProductId());
            v.setWarehouseId(req.getWarehouseId());
            v.setLocationId(req.getLocationId());
            v.setBatchId(req.getBatchId());
            v.setValuationDate(req.getValuationDate());
            return v;
        });

        lenient().when(mapper.toResponse(any(InventoryValuation.class))).thenAnswer(i -> {
            InventoryValuation v = i.getArgument(0);
            InventoryValuationResponse resp = new InventoryValuationResponse();
            resp.setId(v.getId());
            resp.setCompanyId(v.getCompanyId());
            resp.setProductId(v.getProductId());
            resp.setWarehouseId(v.getWarehouseId());
            resp.setLocationId(v.getLocationId());
            resp.setBatchId(v.getBatchId());
            resp.setQuantity(v.getQuantity());
            resp.setAverageCost(v.getAverageCost());
            resp.setStockValue(v.getStockValue());
            resp.setValuationDate(v.getValuationDate());
            return resp;
        });
    }

    @AfterEach
    void tearDown() {
        if (mockedTenantUtils != null) {
            mockedTenantUtils.close();
        }
    }

    @Test
    void create_NewValuation_Success() {
        Product product = new Product();
        product.setId(productId);
        product.setTrackingType(TrackingType.NONE);
        product.setValuationMethod(ValuationMethod.WEIGHTED_AVERAGE);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(new BigDecimal("100.0000"));
        stock.setAverageCost(new BigDecimal("50.0000"));
        stock.setStockValue(new BigDecimal("5000.0000"));

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, null, null, companyId))
                .thenReturn(Optional.of(stock));
        when(repository.findDuplicateValuation(eq(companyId), eq(productId), eq(warehouseId), eq(null), eq(null), any()))
                .thenReturn(Optional.empty());

        InventoryValuationRequest request = new InventoryValuationRequest();
        request.setProductId(productId);
        request.setWarehouseId(warehouseId);
        request.setValuationDate(LocalDate.now());

        InventoryValuationResponse response = service.create(request, companyId);

        assertNotNull(response);
        assertEquals(new BigDecimal("100.0000"), response.getQuantity());
        assertEquals(new BigDecimal("50.0000"), response.getAverageCost());
        assertEquals(new BigDecimal("5000.0000"), response.getStockValue());
        verify(repository, times(1)).saveAndFlush(any(InventoryValuation.class));
    }

    @Test
    void create_DuplicateValuation_UpdatesExistingSnapshot() {
        Product product = new Product();
        product.setId(productId);
        product.setTrackingType(TrackingType.NONE);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(new BigDecimal("150.0000"));
        stock.setAverageCost(new BigDecimal("60.0000"));
        stock.setStockValue(new BigDecimal("9000.0000"));

        InventoryValuation existing = new InventoryValuation();
        existing.setId(UUID.randomUUID());
        existing.setQuantity(new BigDecimal("100.0000"));

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, null, null, companyId))
                .thenReturn(Optional.of(stock));
        when(repository.findDuplicateValuation(eq(companyId), eq(productId), eq(warehouseId), eq(null), eq(null), any()))
                .thenReturn(Optional.of(existing));

        InventoryValuationRequest request = new InventoryValuationRequest();
        request.setProductId(productId);
        request.setWarehouseId(warehouseId);
        request.setValuationDate(LocalDate.now());

        InventoryValuationResponse response = service.create(request, companyId);

        assertNotNull(response);
        assertEquals(existing.getId(), response.getId());
        assertEquals(new BigDecimal("150.0000"), response.getQuantity());
        assertEquals(new BigDecimal("60.0000"), response.getAverageCost());
        assertEquals(new BigDecimal("9000.0000"), response.getStockValue());
        verify(repository, times(1)).saveAndFlush(existing);
    }

    @Test
    void create_LocationBelongsToDifferentWarehouse_ThrowsException() {
        Product product = new Product();
        product.setId(productId);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        WarehouseLocation location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(UUID.randomUUID()); // Different warehouse

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(locationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));

        InventoryValuationRequest request = new InventoryValuationRequest();
        request.setProductId(productId);
        request.setWarehouseId(warehouseId);
        request.setLocationId(locationId);

        assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
    }

    @Test
    void create_BatchTrackedProductWithoutBatch_ThrowsException() {
        Product product = new Product();
        product.setId(productId);
        product.setTrackingType(TrackingType.BATCH);

        Warehouse warehouse = new Warehouse();
        warehouse.setId(warehouseId);

        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));

        InventoryValuationRequest request = new InventoryValuationRequest();
        request.setProductId(productId);
        request.setWarehouseId(warehouseId);
        request.setBatchId(null);

        assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
    }

    @Test
    void update_ThrowsBusinessValidationException() {
        assertThrows(BusinessValidationException.class, () -> 
                service.update(UUID.randomUUID(), new InventoryValuationRequest(), companyId));
    }

    @Test
    void delete_ThrowsBusinessValidationException() {
        assertThrows(BusinessValidationException.class, () -> 
                service.delete(UUID.randomUUID(), companyId));
    }
}
