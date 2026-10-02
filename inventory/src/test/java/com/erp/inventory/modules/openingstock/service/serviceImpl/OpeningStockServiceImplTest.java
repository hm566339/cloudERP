package com.erp.inventory.modules.openingstock.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.batch.repository.ProductBatchRepository;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockLineRequest;
import com.erp.inventory.modules.openingstock.dto.request.OpeningStockRequest;
import com.erp.inventory.modules.openingstock.entity.OpeningStock;
import com.erp.inventory.modules.openingstock.mapper.OpeningStockMapper;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockRepository;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpeningStockServiceImplTest {

    @Mock private OpeningStockRepository repository;
    @Mock private OpeningStockMapper mapper;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseLocationRepository warehouseLocationRepository;
    @Mock private OpeningStockLineRepository openingStockLineRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private ProductBatchRepository productBatchRepository;

    @InjectMocks
    private OpeningStockServiceImpl service;

    private UUID companyId = UUID.randomUUID();
    private UUID warehouseId = UUID.randomUUID();
    private UUID locationId = UUID.randomUUID();
    private UUID productId = UUID.randomUUID();
    private UUID batchId = UUID.randomUUID();

    private OpeningStockRequest request;
    private Warehouse warehouse;
    private WarehouseLocation location;
    private Product product;
    private ProductBatch batch;

    @BeforeEach
    void setUp() {
        request = new OpeningStockRequest();
        request.setWarehouseId(warehouseId);
        request.setOpeningStockNo("OS-001");
        request.setLines(new ArrayList<>());

        warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        warehouse.setStatus("ACTIVE");

        location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);
        location.setIsActive(true);

        product = new Product();
        product.setId(productId);
        product.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);
        product.setTrackingType(TrackingType.BATCH);

        batch = new ProductBatch();
        batch.setId(batchId);
        batch.setProductId(productId);
    }

    private void mockCommon() {
        lenient().when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        lenient().when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        lenient().when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        lenient().when(warehouseLocationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        lenient().when(productBatchRepository.findByIdAndCompanyId(batchId, companyId)).thenReturn(Optional.of(batch));

        StockMovement mov = new StockMovement();
        mov.setId(UUID.randomUUID());
        lenient().when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(mov);

        OpeningStock os = new OpeningStock();
        os.setId(UUID.randomUUID());
        lenient().when(mapper.toEntity(any())).thenReturn(os);
        lenient().when(repository.save(any(OpeningStock.class))).thenReturn(os);
        lenient().when(mapper.toResponse(any())).thenReturn(new com.erp.inventory.modules.openingstock.dto.response.OpeningStockResponse());
    }

    @Test
    void create_Fails_WhenBatchNotFound() {
        mockCommon();
        when(productBatchRepository.findByIdAndCompanyId(batchId, companyId)).thenReturn(Optional.empty());

        OpeningStockLineRequest lineReq = new OpeningStockLineRequest();
        lineReq.setProductId(productId);
        lineReq.setWarehouseLocationId(locationId);
        lineReq.setBatchId(batchId);
        lineReq.setQuantity(new BigDecimal("10"));
        lineReq.setUnitCost(new BigDecimal("100"));
        request.getLines().add(lineReq);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
        assertTrue(ex.getMessage().contains("Batch not found"));
    }

    @Test
    void create_Fails_WhenBatchBelongsToDifferentProduct() {
        mockCommon();
        batch.setProductId(UUID.randomUUID());

        OpeningStockLineRequest lineReq = new OpeningStockLineRequest();
        lineReq.setProductId(productId);
        lineReq.setWarehouseLocationId(locationId);
        lineReq.setBatchId(batchId);
        lineReq.setQuantity(new BigDecimal("10"));
        lineReq.setUnitCost(new BigDecimal("100"));
        request.getLines().add(lineReq);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
        assertTrue(ex.getMessage().contains("Batch does not belong to product"));
    }

    @Test
    void create_Success_MultiLineTotalsAndRollback() {
        mockCommon();
        product.setTrackingType(TrackingType.NONE);

        OpeningStockLineRequest l1 = new OpeningStockLineRequest();
        l1.setProductId(productId);
        l1.setWarehouseLocationId(locationId);
        l1.setQuantity(new BigDecimal("100"));
        l1.setUnitCost(new BigDecimal("1250"));
        request.getLines().add(l1);

        OpeningStockLineRequest l2 = new OpeningStockLineRequest();
        l2.setProductId(productId);
        l2.setWarehouseLocationId(locationId);
        l2.setQuantity(new BigDecimal("50"));
        l2.setUnitCost(new BigDecimal("800"));
        request.getLines().add(l2);

        service.create(request, companyId);

        ArgumentCaptor<StockMovement> movCaptor = ArgumentCaptor.forClass(StockMovement.class);
        verify(stockMovementRepository, times(2)).save(movCaptor.capture());
        
        StockMovement savedMov = movCaptor.getAllValues().get(1);
        assertEquals(new BigDecimal("150"), savedMov.getTotalQuantity());
        assertEquals(new BigDecimal("165000"), savedMov.getTotalValue());
    }

    @Test
    void create_Rollsback_OnSecondLineInvalid() {
        mockCommon();
        product.setTrackingType(TrackingType.NONE);

        OpeningStockLineRequest l1 = new OpeningStockLineRequest();
        l1.setProductId(productId);
        l1.setWarehouseLocationId(locationId);
        l1.setQuantity(new BigDecimal("100"));
        l1.setUnitCost(new BigDecimal("1250"));
        request.getLines().add(l1);

        OpeningStockLineRequest l2 = new OpeningStockLineRequest();
        l2.setProductId(productId);
        l2.setWarehouseLocationId(locationId);
        l2.setQuantity(new BigDecimal("-50")); // invalid
        l2.setUnitCost(new BigDecimal("800"));
        request.getLines().add(l2);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
        assertTrue(ex.getMessage().contains("Quantity must be greater than zero"));
    }
}
