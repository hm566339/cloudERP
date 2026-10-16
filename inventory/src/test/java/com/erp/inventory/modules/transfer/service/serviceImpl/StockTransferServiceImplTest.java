package com.erp.inventory.modules.transfer.service.serviceImpl;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.transfer.entity.StockTransfer;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.mapper.StockTransferMapper;
import com.erp.inventory.modules.transfer.mapper.StockTransferLineMapper;
import com.erp.inventory.modules.transfer.repository.StockTransferRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import com.erp.inventory.modules.workflow.client.WorkflowClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockTransferServiceImplTest {

    @Mock private StockTransferRepository repository;
    @Mock private StockTransferLineRepository lineRepository;
    @Mock private StockTransferMapper mapper;
    @Mock private StockTransferLineMapper lineMapper;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository locationRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private InventoryPeriodService inventoryPeriodService;
    @Mock private WorkflowClient workflowClient;

    @InjectMocks
    private StockTransferServiceImpl service;

    private UUID companyId = UUID.randomUUID();
    private UUID sourceWarehouseId = UUID.randomUUID();
    private UUID destWarehouseId = UUID.randomUUID();
    private UUID sourceLocationId = UUID.randomUUID();
    private UUID destLocationId = UUID.randomUUID();
    private UUID productId = UUID.randomUUID();

    private StockTransferRequest request;
    private Warehouse sourceWarehouse;
    private Warehouse destWarehouse;
    private WarehouseLocation sourceLocation;
    private WarehouseLocation destLocation;
    private Product product;

    @BeforeEach
    void setUp() {
        com.erp.inventory.common.security.CurrentUserContext.clear();
        com.erp.inventory.common.security.CurrentUserContext.setCompanyId(companyId);
        lenient().doNothing().when(inventoryPeriodService).validateTransactionDate(any(), any());

        request = new StockTransferRequest();
        request.setSourceWarehouseId(sourceWarehouseId);
        request.setDestinationWarehouseId(destWarehouseId);
        request.setTransferNo("TR-001");
        
        StockTransferLineRequest lineReq = new StockTransferLineRequest();
        lineReq.setProductId(productId);
        lineReq.setQuantity(new BigDecimal("30"));
        lineReq.setUnitCost(new BigDecimal("1250"));
        lineReq.setSourceLocationId(sourceLocationId);
        lineReq.setDestinationLocationId(destLocationId);
        
        List<StockTransferLineRequest> lines = new ArrayList<>();
        lines.add(lineReq);
        request.setLines(lines);

        sourceWarehouse = new Warehouse();
        sourceWarehouse.setId(sourceWarehouseId);
        sourceWarehouse.setStatus("ACTIVE");

        destWarehouse = new Warehouse();
        destWarehouse.setId(destWarehouseId);
        destWarehouse.setStatus("ACTIVE");

        sourceLocation = new WarehouseLocation();
        sourceLocation.setId(sourceLocationId);
        sourceLocation.setWarehouseId(sourceWarehouseId);
        sourceLocation.setIsActive(true);

        destLocation = new WarehouseLocation();
        destLocation.setId(destLocationId);
        destLocation.setWarehouseId(destWarehouseId);
        destLocation.setIsActive(true);

        product = new Product();
        product.setId(productId);
        product.setTrackingType(TrackingType.NONE);
        product.setStatus(com.erp.inventory.modules.product.enums.ProductStatus.ACTIVE);
        product.setValuationMethod(com.erp.inventory.modules.product.enums.ValuationMethod.WEIGHTED_AVERAGE);
    }

    @Test
    void create_Success_CallsStockService() {
        when(warehouseRepository.findByIdAndCompanyId(sourceWarehouseId, companyId)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepository.findByIdAndCompanyId(destWarehouseId, companyId)).thenReturn(Optional.of(destWarehouse));
        when(locationRepository.findByIdAndCompanyId(sourceLocationId, companyId)).thenReturn(Optional.of(sourceLocation));
        when(locationRepository.findByIdAndCompanyId(destLocationId, companyId)).thenReturn(Optional.of(destLocation));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        
        StockMovement movement = new StockMovement();
        movement.setId(UUID.randomUUID());
        movement.setMovementDate(LocalDateTime.now());
        when(stockMovementRepository.save(any(StockMovement.class))).thenReturn(movement);
        
        StockTransfer transfer = new StockTransfer();
        transfer.setId(UUID.randomUUID());
        transfer.setSourceWarehouseId(sourceWarehouseId);
        transfer.setDestinationWarehouseId(destWarehouseId);
        when(mapper.toEntity(any())).thenReturn(transfer);
        when(repository.save(any(StockTransfer.class))).thenReturn(transfer);
        
        StockTransferLine transferLine = new StockTransferLine();
        transferLine.setId(UUID.randomUUID());
        transferLine.setQuantity(new BigDecimal("30"));
        transferLine.setUnitCost(new BigDecimal("1250"));
        transferLine.setProductId(productId);
        transferLine.setSourceLocationId(sourceLocationId);
        transferLine.setDestinationLocationId(destLocationId);
        when(lineMapper.toEntity(any())).thenReturn(transferLine);
        when(lineRepository.save(any())).thenReturn(transferLine);
        
        InventoryStock sourceStock = new InventoryStock();
        sourceStock.setQuantity(new BigDecimal("100"));
        when(inventoryStockRepository.findUniqueStock(productId, sourceWarehouseId, sourceLocationId, null, companyId))
                .thenReturn(Optional.of(sourceStock));

        service.create(request, companyId);

        verify(inventoryStockService).removeStock(productId, sourceWarehouseId, sourceLocationId, null, new BigDecimal("30"), companyId);
        verify(inventoryStockService).addStock(productId, destWarehouseId, destLocationId, null, new BigDecimal("30"), new BigDecimal("1250"), companyId);
        verify(stockMovementRepository, atLeastOnce()).save(any(StockMovement.class));
    }

    @Test
    void create_Fails_SameWarehouseAndLocation() {
        lenient().when(warehouseRepository.findByIdAndCompanyId(sourceWarehouseId, companyId)).thenReturn(Optional.of(sourceWarehouse));
        lenient().when(warehouseRepository.findByIdAndCompanyId(destWarehouseId, companyId)).thenReturn(Optional.of(destWarehouse));
        
        StockTransfer transfer = new StockTransfer();
        lenient().when(mapper.toEntity(any())).thenReturn(transfer);
        lenient().when(repository.save(any(StockTransfer.class))).thenReturn(transfer);
        
        request.setDestinationWarehouseId(sourceWarehouseId);
        request.getLines().get(0).setDestinationLocationId(sourceLocationId);
        
        BusinessValidationException ex = assertThrows(BusinessValidationException.class, () -> service.create(request, companyId));
        assertTrue(ex.getMessage().contains("Cannot transfer to the exact same warehouse and location"));
    }

    @Test
    void reverse_Success_ValidTransfer() {
        UUID transferId = UUID.randomUUID();
        
        StockTransfer transfer = new StockTransfer();
        transfer.setId(transferId);
        transfer.setStatus("COMPLETED");
        transfer.setSourceWarehouseId(sourceWarehouseId);
        transfer.setDestinationWarehouseId(destWarehouseId);
        transfer.setTransferNo("TRF-1001");
        
        StockTransferLine line = new StockTransferLine();
        line.setId(UUID.randomUUID());
        line.setProductId(productId);
        line.setQuantity(new BigDecimal("30"));
        line.setUnitCost(new BigDecimal("1250"));
        line.setSourceLocationId(sourceLocationId);
        line.setDestinationLocationId(destLocationId);
        
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        when(lineRepository.findAllByStockTransferIdAndCompanyId(transferId, companyId)).thenReturn(List.of(line));
        when(stockMovementRepository.save(any(StockMovement.class))).thenAnswer(i -> {
            StockMovement sm = i.getArgument(0);
            sm.setId(UUID.randomUUID());
            return sm;
        });
        
        InventoryStock destStock = new InventoryStock();
        destStock.setQuantity(new BigDecimal("30"));
        when(inventoryStockRepository.findUniqueStock(
                eq(productId), eq(destWarehouseId), eq(destLocationId), any(), eq(companyId)))
                .thenReturn(Optional.of(destStock));
                
        when(repository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(mapper.toResponse(any())).thenReturn(new com.erp.inventory.modules.transfer.dto.response.StockTransferResponse());

        service.reverse(transferId, companyId);
        
        verify(inventoryStockService).removeStock(productId, destWarehouseId, destLocationId, null, new BigDecimal("30"), companyId);
        verify(inventoryStockService).addStock(productId, sourceWarehouseId, sourceLocationId, null, new BigDecimal("30"), new BigDecimal("1250"), companyId);
        assertEquals("REVERSED", transfer.getStatus());
    }

    @Test
    void reverse_Fails_AlreadyReversed() {
        UUID transferId = UUID.randomUUID();
        
        StockTransfer transfer = new StockTransfer();
        transfer.setId(transferId);
        transfer.setStatus("REVERSED");
        
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        
        BusinessValidationException ex = assertThrows(
                BusinessValidationException.class,
                () -> service.reverse(transferId, companyId)
        );
        assertTrue(ex.getMessage().contains("already reversed or cancelled"));
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.inventory.common.security.CurrentUserContext.clear();
    }
}
