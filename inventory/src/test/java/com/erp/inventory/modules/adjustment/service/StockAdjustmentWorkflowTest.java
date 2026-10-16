package com.erp.inventory.modules.adjustment.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentLineRequest;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentResponse;
import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import com.erp.inventory.modules.adjustment.entity.StockAdjustmentLine;
import com.erp.inventory.modules.adjustment.mapper.StockAdjustmentMapper;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentLineRepository;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentRepository;
import com.erp.inventory.modules.adjustment.service.serviceImpl.StockAdjustmentServiceImpl;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.workflow.client.WorkflowClient;
import com.erp.inventory.modules.workflow.document.StockAdjustmentWorkflowAdapter;
import com.erp.inventory.modules.workflow.document.WorkflowDocument;
import com.erp.inventory.modules.workflow.dto.WorkflowTransactionDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockAdjustmentWorkflowTest {

    @Mock private StockAdjustmentRepository repository;
    @Mock private StockAdjustmentLineRepository lineRepository;
    @Mock private StockAdjustmentMapper mapper;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository locationRepository;
    @Mock private ProductRepository productRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private InventoryPeriodService inventoryPeriodService;
    @Mock private WorkflowClient workflowClient;

    @InjectMocks
    private StockAdjustmentServiceImpl service;

    private StockAdjustmentWorkflowAdapter adapter;

    private final UUID companyId = UUID.randomUUID();
    private final UUID warehouseId = UUID.randomUUID();
    private final UUID locationId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID adjustmentId = UUID.randomUUID();

    private StockAdjustment adjustment;
    private StockAdjustmentLine adjustmentLine;
    private Warehouse warehouse;
    private WarehouseLocation location;
    private Product product;

    @BeforeEach
    void setUp() {
        adapter = new StockAdjustmentWorkflowAdapter(repository, lineRepository, service);

        warehouse = new Warehouse();
        warehouse.setId(warehouseId);
        warehouse.setStatus("ACTIVE");

        location = new WarehouseLocation();
        location.setId(locationId);
        location.setWarehouseId(warehouseId);
        location.setIsActive(true);

        product = new Product();
        product.setId(productId);
        product.setStatus(ProductStatus.ACTIVE);
        product.setBaseUomId(UUID.randomUUID());

        adjustment = new StockAdjustment();
        adjustment.setId(adjustmentId);
        adjustment.setCompanyId(companyId);
        adjustment.setAdjustmentNo("ADJ-2026-001");
        adjustment.setStatus("DRAFT");
        adjustment.setWarehouseId(warehouseId);
        adjustment.setLocationId(locationId);
        adjustment.setAdjustmentDate(LocalDateTime.now());

        adjustmentLine = new StockAdjustmentLine();
        adjustmentLine.setId(UUID.randomUUID());
        adjustmentLine.setStockAdjustmentId(adjustmentId);
        adjustmentLine.setCompanyId(companyId);
        adjustmentLine.setProductId(productId);
        adjustmentLine.setAdjustmentType("INCREASE");
        adjustmentLine.setQuantity(new BigDecimal("15"));
        adjustmentLine.setUnitCost(new BigDecimal("100.00"));
        adjustmentLine.setAdjustmentValue(new BigDecimal("1500.00"));
    }

    @Test
    void create_DraftAdjustment_DoesNotMoveStockPrematurely() {
        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setAdjustmentNo("ADJ-DRAFT-01");
        request.setWarehouseId(warehouseId);
        request.setLocationId(locationId);
        request.setStatus("DRAFT");

        StockAdjustmentLineRequest lineReq = new StockAdjustmentLineRequest();
        lineReq.setProductId(productId);
        lineReq.setAdjustmentType("INCREASE");
        lineReq.setQuantity(new BigDecimal("15"));
        lineReq.setUnitCost(new BigDecimal("100.00"));
        request.setLines(List.of(lineReq));

        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(locationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));
        when(mapper.toEntity(any())).thenReturn(adjustment);
        when(repository.save(any())).thenReturn(adjustment);
        when(lineRepository.save(any())).thenReturn(adjustmentLine);
        when(mapper.toResponse(any())).thenReturn(new StockAdjustmentResponse());

        StockAdjustmentResponse response = service.create(request, companyId);

        assertNotNull(response);
        assertEquals("DRAFT", adjustment.getStatus());
        assertNull(adjustment.getStockMovementId());
        // Verify no stock mutation occurred
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    void submitForApproval_Success_DispatchesWorkflowAndSetsPending() {
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(null);

        WorkflowTransactionDto txDto = new WorkflowTransactionDto();
        txDto.setId(UUID.randomUUID());
        txDto.setStatus("PENDING");
        when(workflowClient.submitWorkflow(eq(companyId), eq("STOCK_ADJUSTMENT"), eq(adjustmentId), eq(adjustment.getAdjustmentNo()), any()))
                .thenReturn(txDto);

        when(repository.save(any())).thenReturn(adjustment);
        when(mapper.toResponse(any())).thenReturn(new StockAdjustmentResponse());

        StockAdjustmentResponse response = service.submitForApproval(adjustmentId, companyId, "Inventory variance count approval");

        assertNotNull(response);
        assertEquals("PENDING_APPROVAL", adjustment.getStatus());
        verify(workflowClient).submitWorkflow(eq(companyId), eq("STOCK_ADJUSTMENT"), eq(adjustmentId), eq("ADJ-2026-001"), eq("Inventory variance count approval"));
        verify(repository).save(adjustment);
    }

    @Test
    void submitForApproval_DuplicateSubmissionBlocked() {
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowTransactionDto existingTx = new WorkflowTransactionDto();
        existingTx.setId(UUID.randomUUID());
        existingTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(existingTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.submitForApproval(adjustmentId, companyId, "Submit again"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        assertEquals("DRAFT", adjustment.getStatus());
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void submitForApproval_EngineFailure_PreservesDraftState() {
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(null);
        when(workflowClient.submitWorkflow(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Workflow engine timeout"));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.submitForApproval(adjustmentId, companyId, "Submit"));

        assertTrue(ex.getMessage().contains("Failed to submit stock adjustment for workflow approval"));
        assertEquals("DRAFT", adjustment.getStatus());
        verify(repository, never()).save(argThat(a -> "PENDING_APPROVAL".equals(a.getStatus())));
    }

    @Test
    void approveAdjustment_BypassBlockedWhenWorkflowActive() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.approveAdjustment(adjustmentId, companyId));

        assertTrue(ex.getMessage().contains("cannot be approved directly while workflow approval is pending"));
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void rejectAdjustment_BypassBlockedWhenWorkflowActive() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.rejectAdjustment(adjustmentId, companyId, "Variance too high"));

        assertTrue(ex.getMessage().contains("cannot be rejected directly while workflow approval is pending"));
        assertEquals("PENDING_APPROVAL", adjustment.getStatus());
    }

    @Test
    void cancelAdjustment_BypassBlockedWhenWorkflowActive() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("IN_PROGRESS");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.cancelAdjustment(adjustmentId, companyId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        assertEquals("PENDING_APPROVAL", adjustment.getStatus());
    }

    @Test
    void approveAdjustment_DirectSuccessWhenNoWorkflow() {
        adjustment.setStatus("DRAFT");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_ADJUSTMENT", adjustmentId)).thenReturn(null);
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(locationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        when(lineRepository.findAllByStockAdjustmentIdAndCompanyId(adjustmentId, companyId)).thenReturn(List.of(adjustmentLine));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        StockMovement movement = new StockMovement();
        movement.setId(UUID.randomUUID());
        when(stockMovementRepository.save(any())).thenReturn(movement);

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(new BigDecimal("15"));
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(stock));

        when(repository.save(any())).thenReturn(adjustment);
        when(mapper.toResponse(any())).thenReturn(new StockAdjustmentResponse());

        StockAdjustmentResponse response = service.approveAdjustment(adjustmentId, companyId);

        assertNotNull(response);
        assertEquals("APPROVED", adjustment.getStatus());
        assertNotNull(adjustment.getStockMovementId());
        verify(inventoryStockService).addStock(productId, warehouseId, locationId, null, new BigDecimal("15"), new BigDecimal("100.00"), companyId);
    }

    @Test
    void workflowAdapter_OnWorkflowApproved_ExecutesMovementAndSetsApproved() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));
        when(lineRepository.findAllByStockAdjustmentIdAndCompanyId(adjustmentId, companyId)).thenReturn(List.of(adjustmentLine));
        when(warehouseRepository.findByIdAndCompanyId(warehouseId, companyId)).thenReturn(Optional.of(warehouse));
        when(locationRepository.findByIdAndCompanyId(locationId, companyId)).thenReturn(Optional.of(location));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        StockMovement movement = new StockMovement();
        movement.setId(UUID.randomUUID());
        when(stockMovementRepository.save(any())).thenReturn(movement);

        InventoryStock stock = new InventoryStock();
        stock.setQuantity(new BigDecimal("15"));
        when(inventoryStockRepository.findUniqueStock(productId, warehouseId, locationId, null, companyId))
                .thenReturn(Optional.of(stock));

        WorkflowDocument doc = adapter.find(adjustmentId, companyId);
        assertNotNull(doc);
        assertEquals("STOCK_ADJUSTMENT", doc.getDocumentType());
        assertEquals("ADJ-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("1500.00"), doc.getAmount());

        doc.onWorkflowApproved();

        assertEquals("APPROVED", adjustment.getStatus());
        assertNotNull(adjustment.getApprovedAt());
        assertNotNull(adjustment.getStockMovementId());
        verify(inventoryStockService).addStock(productId, warehouseId, locationId, null, new BigDecimal("15"), new BigDecimal("100.00"), companyId);
    }

    @Test
    void workflowAdapter_OnWorkflowApproved_IdempotentCheckPreventsDuplicateMovement() {
        adjustment.setStatus("APPROVED");
        adjustment.setStockMovementId(UUID.randomUUID()); // Already moved
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowDocument doc = adapter.find(adjustmentId, companyId);
        assertNotNull(doc);

        doc.onWorkflowApproved();

        verify(stockMovementRepository, never()).save(any());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void workflowAdapter_OnWorkflowRejected_CancelsWithoutStockMovement() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowDocument doc = adapter.find(adjustmentId, companyId);
        assertNotNull(doc);

        doc.onWorkflowRejected();

        assertEquals("REJECTED", adjustment.getStatus());
        assertNull(adjustment.getStockMovementId());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void workflowAdapter_OnWorkflowReturned_ResetsToDraftWithoutStockMovement() {
        adjustment.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(adjustmentId, companyId)).thenReturn(Optional.of(adjustment));

        WorkflowDocument doc = adapter.find(adjustmentId, companyId);
        assertNotNull(doc);

        doc.onWorkflowReturned();

        assertEquals("DRAFT", adjustment.getStatus());
        assertNull(adjustment.getStockMovementId());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
    }
}
