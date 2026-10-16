package com.erp.inventory.modules.transfer.service;

import com.erp.inventory.common.exception.BusinessValidationException;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.enums.ProductStatus;
import com.erp.inventory.modules.product.enums.TrackingType;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import com.erp.inventory.modules.stock.entity.StockMovement;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.stock.repository.StockMovementLineRepository;
import com.erp.inventory.modules.stock.repository.StockMovementRepository;
import com.erp.inventory.modules.stock.service.InventoryStockService;
import com.erp.inventory.modules.period.service.InventoryPeriodService;
import com.erp.inventory.modules.valuation.service.InventoryCostLayerService;
import com.erp.inventory.modules.transfer.dto.request.StockTransferLineRequest;
import com.erp.inventory.modules.transfer.dto.request.StockTransferRequest;
import com.erp.inventory.modules.transfer.dto.response.StockTransferResponse;
import com.erp.inventory.modules.transfer.entity.StockTransfer;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import com.erp.inventory.modules.transfer.mapper.StockTransferLineMapper;
import com.erp.inventory.modules.transfer.mapper.StockTransferMapper;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferRepository;
import com.erp.inventory.modules.transfer.service.serviceImpl.StockTransferServiceImpl;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.repository.WarehouseLocationRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.workflow.client.WorkflowClient;
import com.erp.inventory.modules.workflow.document.StockTransferWorkflowAdapter;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StockTransferWorkflowTest {

    @Mock private StockTransferRepository repository;
    @Mock private StockTransferLineRepository lineRepository;
    @Mock private StockTransferMapper mapper;
    @Mock private StockTransferLineMapper lineMapper;
    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private WarehouseLocationRepository locationRepository;
    @Mock private InventoryStockRepository inventoryStockRepository;
    @Mock private InventoryStockService inventoryStockService;
    @Mock private StockMovementRepository stockMovementRepository;
    @Mock private StockMovementLineRepository stockMovementLineRepository;
    @Mock private InventoryCostLayerService inventoryCostLayerService;
    @Mock private InventoryPeriodService inventoryPeriodService;
    @Mock private WorkflowClient workflowClient;

    @InjectMocks
    private StockTransferServiceImpl service;

    private StockTransferWorkflowAdapter adapter;

    private final UUID companyId = UUID.randomUUID();
    private final UUID sourceWarehouseId = UUID.randomUUID();
    private final UUID destWarehouseId = UUID.randomUUID();
    private final UUID sourceLocationId = UUID.randomUUID();
    private final UUID destLocationId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID transferId = UUID.randomUUID();

    private StockTransfer transfer;
    private StockTransferLine transferLine;
    private Warehouse sourceWarehouse;
    private Warehouse destWarehouse;
    private WarehouseLocation sourceLocation;
    private WarehouseLocation destLocation;
    private Product product;

    @BeforeEach
    void setUp() {
        com.erp.inventory.common.security.CurrentUserContext.clear();
        com.erp.inventory.common.security.CurrentUserContext.setCompanyId(companyId);
        adapter = new StockTransferWorkflowAdapter(repository, lineRepository, service);

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
        product.setStatus(ProductStatus.ACTIVE);
        product.setTrackingType(TrackingType.NONE);

        transfer = new StockTransfer();
        transfer.setId(transferId);
        transfer.setCompanyId(companyId);
        transfer.setTransferNo("TRF-2026-001");
        transfer.setStatus("DRAFT");
        transfer.setSourceWarehouseId(sourceWarehouseId);
        transfer.setDestinationWarehouseId(destWarehouseId);
        transfer.setTransferDate(LocalDateTime.now());

        transferLine = new StockTransferLine();
        transferLine.setId(UUID.randomUUID());
        transferLine.setStockTransferId(transferId);
        transferLine.setCompanyId(companyId);
        transferLine.setProductId(productId);
        transferLine.setSourceLocationId(sourceLocationId);
        transferLine.setDestinationLocationId(destLocationId);
        transferLine.setQuantity(new BigDecimal("10"));
        transferLine.setUnitCost(new BigDecimal("250.00"));
    }

    @Test
    void create_DraftTransfer_DoesNotMoveStockPrematurely() {
        StockTransferRequest request = new StockTransferRequest();
        request.setTransferNo("TRF-DRAFT-01");
        request.setSourceWarehouseId(sourceWarehouseId);
        request.setDestinationWarehouseId(destWarehouseId);
        request.setStatus("DRAFT");
        StockTransferLineRequest lineReq = new StockTransferLineRequest();
        lineReq.setProductId(productId);
        lineReq.setSourceLocationId(sourceLocationId);
        lineReq.setDestinationLocationId(destLocationId);
        lineReq.setQuantity(new BigDecimal("10"));
        lineReq.setUnitCost(new BigDecimal("250.00"));
        request.setLines(List.of(lineReq));

        when(warehouseRepository.findByIdAndCompanyId(sourceWarehouseId, companyId)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepository.findByIdAndCompanyId(destWarehouseId, companyId)).thenReturn(Optional.of(destWarehouse));
        when(locationRepository.findByIdAndCompanyId(sourceLocationId, companyId)).thenReturn(Optional.of(sourceLocation));
        when(locationRepository.findByIdAndCompanyId(destLocationId, companyId)).thenReturn(Optional.of(destLocation));
        when(productRepository.findByIdAndCompanyId(any(), eq(companyId))).thenReturn(Optional.of(product));
        when(mapper.toEntity(any())).thenReturn(transfer);
        when(repository.save(any())).thenReturn(transfer);
        when(lineMapper.toEntity(any())).thenReturn(transferLine);
        when(lineRepository.save(any())).thenReturn(transferLine);
        when(mapper.toResponse(any())).thenReturn(new StockTransferResponse());

        StockTransferResponse response = service.create(request, companyId);

        assertNotNull(response);
        assertEquals("DRAFT", transfer.getStatus());
        assertNull(transfer.getStockMovementId());
        // Verify no stock mutations occurred prematurely
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
        verify(inventoryStockService, never()).addStock(any(), any(), any(), any(), any(), any(), any());
        verify(stockMovementRepository, never()).save(any());
    }

    @Test
    void submitForApproval_Success_DispatchesWorkflowAndSetsPending() {
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(null);

        WorkflowTransactionDto txDto = new WorkflowTransactionDto();
        txDto.setId(UUID.randomUUID());
        txDto.setStatus("PENDING");
        when(workflowClient.submitWorkflow(eq(companyId), eq("STOCK_TRANSFER"), eq(transferId), eq(transfer.getTransferNo()), any()))
                .thenReturn(txDto);

        when(repository.save(any())).thenReturn(transfer);
        when(mapper.toResponse(any())).thenReturn(new StockTransferResponse());

        StockTransferResponse response = service.submitForApproval(transferId, companyId, "Ready for warehouse authorization");

        assertNotNull(response);
        assertEquals("PENDING_APPROVAL", transfer.getStatus());
        verify(workflowClient).submitWorkflow(eq(companyId), eq("STOCK_TRANSFER"), eq(transferId), eq("TRF-2026-001"), eq("Ready for warehouse authorization"));
        verify(repository).save(transfer);
    }

    @Test
    void submitForApproval_FailsWhenAlreadyCompleted() {
        transfer.setStatus("COMPLETED");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.submitForApproval(transferId, companyId, "Submit"));
        assertTrue(ex.getMessage().contains("Only DRAFT stock transfers can be submitted"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void submitForApproval_DuplicateSubmissionBlocked() {
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowTransactionDto existingTx = new WorkflowTransactionDto();
        existingTx.setId(UUID.randomUUID());
        existingTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(existingTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.submitForApproval(transferId, companyId, "Submit again"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        assertEquals("DRAFT", transfer.getStatus());
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void submitForApproval_EngineFailure_PreservesDraftState() {
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(null);
        when(workflowClient.submitWorkflow(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Connection refused to workflow engine"));

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.submitForApproval(transferId, companyId, "Submit"));

        assertTrue(ex.getMessage().contains("Failed to submit stock transfer for workflow approval"));
        assertEquals("DRAFT", transfer.getStatus());
        verify(repository, never()).save(argThat(t -> "PENDING_APPROVAL".equals(t.getStatus())));
    }

    @Test
    void approveTransfer_BypassBlockedWhenWorkflowActive() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.approveTransfer(transferId, companyId));

        assertTrue(ex.getMessage().contains("cannot be approved directly while workflow approval is pending"));
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }

    @Test
    void rejectTransfer_BypassBlockedWhenWorkflowActive() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("PENDING");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.rejectTransfer(transferId, companyId, "Rejection"));

        assertTrue(ex.getMessage().contains("cannot be rejected directly while workflow approval is pending"));
        assertEquals("PENDING_APPROVAL", transfer.getStatus());
    }

    @Test
    void cancelTransfer_BypassBlockedWhenWorkflowActive() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowTransactionDto activeTx = new WorkflowTransactionDto();
        activeTx.setStatus("IN_PROGRESS");
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(activeTx);

        BusinessValidationException ex = assertThrows(BusinessValidationException.class,
                () -> service.cancelTransfer(transferId, companyId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        assertEquals("PENDING_APPROVAL", transfer.getStatus());
    }

    @Test
    void approveTransfer_DirectSuccessWhenNoWorkflow() {
        transfer.setStatus("DRAFT");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        when(workflowClient.getWorkflowByDocument(companyId, "STOCK_TRANSFER", transferId)).thenReturn(null);
        when(lineRepository.findAllByStockTransferIdAndCompanyId(transferId, companyId)).thenReturn(List.of(transferLine));
        when(warehouseRepository.findByIdAndCompanyId(sourceWarehouseId, companyId)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepository.findByIdAndCompanyId(destWarehouseId, companyId)).thenReturn(Optional.of(destWarehouse));
        when(locationRepository.findByIdAndCompanyId(sourceLocationId, companyId)).thenReturn(Optional.of(sourceLocation));
        when(locationRepository.findByIdAndCompanyId(destLocationId, companyId)).thenReturn(Optional.of(destLocation));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        InventoryStock sourceStock = new InventoryStock();
        sourceStock.setQuantity(new BigDecimal("100"));
        when(inventoryStockRepository.findUniqueStock(productId, sourceWarehouseId, sourceLocationId, null, companyId))
                .thenReturn(Optional.of(sourceStock));

        StockMovement movement = new StockMovement();
        movement.setId(UUID.randomUUID());
        when(stockMovementRepository.save(any())).thenReturn(movement);
        when(repository.save(any())).thenReturn(transfer);
        when(mapper.toResponse(any())).thenReturn(new StockTransferResponse());

        StockTransferResponse response = service.approveTransfer(transferId, companyId);

        assertNotNull(response);
        assertEquals("APPROVED", transfer.getStatus());
        assertNotNull(transfer.getStockMovementId());
        verify(inventoryStockService).removeStock(productId, sourceWarehouseId, sourceLocationId, null, new BigDecimal("10"), companyId);
        verify(inventoryStockService).addStock(productId, destWarehouseId, destLocationId, null, new BigDecimal("10"), new BigDecimal("250.00"), companyId);
    }

    @Test
    void workflowAdapter_OnWorkflowApproved_ExecutesMovementAndSetsApproved() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));
        when(lineRepository.findAllByStockTransferIdAndCompanyId(transferId, companyId)).thenReturn(List.of(transferLine));
        when(warehouseRepository.findByIdAndCompanyId(sourceWarehouseId, companyId)).thenReturn(Optional.of(sourceWarehouse));
        when(warehouseRepository.findByIdAndCompanyId(destWarehouseId, companyId)).thenReturn(Optional.of(destWarehouse));
        when(locationRepository.findByIdAndCompanyId(sourceLocationId, companyId)).thenReturn(Optional.of(sourceLocation));
        when(locationRepository.findByIdAndCompanyId(destLocationId, companyId)).thenReturn(Optional.of(destLocation));
        when(productRepository.findByIdAndCompanyId(productId, companyId)).thenReturn(Optional.of(product));

        InventoryStock sourceStock = new InventoryStock();
        sourceStock.setQuantity(new BigDecimal("50"));
        when(inventoryStockRepository.findUniqueStock(productId, sourceWarehouseId, sourceLocationId, null, companyId))
                .thenReturn(Optional.of(sourceStock));

        StockMovement movement = new StockMovement();
        movement.setId(UUID.randomUUID());
        when(stockMovementRepository.save(any())).thenReturn(movement);

        WorkflowDocument doc = adapter.find(transferId, companyId);
        assertNotNull(doc);
        assertEquals("STOCK_TRANSFER", doc.getDocumentType());
        assertEquals("TRF-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("2500.00"), doc.getAmount());

        doc.onWorkflowApproved();

        assertEquals("APPROVED", transfer.getStatus());
        assertNotNull(transfer.getApprovedAt());
        assertNotNull(transfer.getStockMovementId());
        verify(inventoryStockService).removeStock(productId, sourceWarehouseId, sourceLocationId, null, new BigDecimal("10"), companyId);
        verify(inventoryStockService).addStock(productId, destWarehouseId, destLocationId, null, new BigDecimal("10"), new BigDecimal("250.00"), companyId);
    }

    @Test
    void workflowAdapter_OnWorkflowApproved_IdempotentCheckPreventsDuplicateMovement() {
        transfer.setStatus("APPROVED");
        transfer.setStockMovementId(UUID.randomUUID()); // Already moved
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowDocument doc = adapter.find(transferId, companyId);
        assertNotNull(doc);

        doc.onWorkflowApproved();

        // Stock movement must not be called again
        verify(stockMovementRepository, never()).save(any());
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }

    @Test
    void workflowAdapter_OnWorkflowRejected_CancelsWithoutStockMovement() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowDocument doc = adapter.find(transferId, companyId);
        assertNotNull(doc);

        doc.onWorkflowRejected();

        assertEquals("REJECTED", transfer.getStatus());
        assertNull(transfer.getStockMovementId());
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }

    @Test
    void workflowAdapter_OnWorkflowReturned_ResetsToDraftWithoutStockMovement() {
        transfer.setStatus("PENDING_APPROVAL");
        when(repository.findByIdAndCompanyId(transferId, companyId)).thenReturn(Optional.of(transfer));

        WorkflowDocument doc = adapter.find(transferId, companyId);
        assertNotNull(doc);

        doc.onWorkflowReturned();

        assertEquals("DRAFT", transfer.getStatus());
        assertNull(transfer.getStockMovementId());
        verify(inventoryStockService, never()).removeStock(any(), any(), any(), any(), any(), any());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        com.erp.inventory.common.security.CurrentUserContext.clear();
    }
}
