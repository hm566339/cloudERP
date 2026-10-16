package com.erp.account.modules.purchaseorder.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.service.WarehouseLookupService;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.mapper.PurchaseOrderMapper;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.service.impl.PurchaseOrderServiceImpl;
import com.erp.account.modules.workflow.document.adapter.PurchaseOrderWorkflowAdapter;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PurchaseOrderWorkflowTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private PurchaseOrderMapper purchaseOrderMapper;

    @Mock
    private WarehouseLookupService warehouseLookupService;

    @Mock
    private WorkflowClient workflowClient;

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID poId;
    private UUID currentUserId;
    private PurchaseOrder purchaseOrder;

    @BeforeAll
    static void beforeAll() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
        currentUserContextMock = mockStatic(CurrentUserContext.class);
    }

    @AfterAll
    static void afterAll() {
        tenantUtilsMock.close();
        currentUserContextMock.close();
    }

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        poId = UUID.randomUUID();
        currentUserId = UUID.randomUUID();

        tenantUtilsMock.when(() -> TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(currentUserId);
        currentUserContextMock.when(CurrentUserContext::getUserRole).thenReturn("SYSTEM_ADMIN");

        purchaseOrder = new PurchaseOrder();
        purchaseOrder.setId(poId);
        purchaseOrder.setCompanyId(companyId);
        purchaseOrder.setPoNumber("PO-2026-001");
        purchaseOrder.setStatus(PurchaseOrderStatus.DRAFT);
        purchaseOrder.setIsDeleted(false);
        purchaseOrder.setTotalAmount(new BigDecimal("15000.00"));
        purchaseOrder.setItems(new ArrayList<>());
    }

    @Test
    void testSubmitForApproval_Success() {
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(null);
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        PurchaseOrderResponse response = purchaseOrderService.submitForApproval(companyId, poId, "Urgent PO");

        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, purchaseOrder.getStatus());
        verify(workflowClient, times(1)).submitWorkflow(
                companyId, "PURCHASE_ORDER", poId, "PO-2026-001", "Urgent PO");
        verify(purchaseOrderRepository, times(1)).save(purchaseOrder);
    }

    @Test
    void testSubmitForApproval_NonDraft_ThrowsException() {
        purchaseOrder.setStatus(PurchaseOrderStatus.APPROVED);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseOrderService.submitForApproval(companyId, poId, "Test"));

        assertTrue(ex.getMessage().contains("Only DRAFT purchase orders can be submitted"));
        verifyNoInteractions(workflowClient);
    }

    @Test
    void testSubmitForApproval_DuplicatePending_ThrowsException() {
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        WorkflowTransactionDto existingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(existingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseOrderService.submitForApproval(companyId, poId, "Duplicate"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testApprovePurchaseOrder_BlockedWhenWorkflowPending() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseOrderService.approvePurchaseOrder(companyId, poId));

        assertTrue(ex.getMessage().contains("workflow approval is pending"));
        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, purchaseOrder.getStatus());
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    void testApprovePurchaseOrder_SuccessWhenNoWorkflowPending() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(null);
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> purchaseOrderService.approvePurchaseOrder(companyId, poId));
        assertEquals(PurchaseOrderStatus.APPROVED, purchaseOrder.getStatus());
        verify(purchaseOrderRepository, times(1)).save(purchaseOrder);
    }

    @Test
    void testPurchaseOrderWorkflowAdapter_LifecycleCallbacks() {
        when(purchaseOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        PurchaseOrderWorkflowAdapter adapter = new PurchaseOrderWorkflowAdapter(purchaseOrderRepository, purchaseOrderService);
        var doc = adapter.find(poId, companyId);
        assertNotNull(doc);
        assertEquals("PURCHASE_ORDER", doc.getDocumentType());
        assertEquals("PO-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("15000.00"), doc.getAmount());

        // Test onWorkflowReturned resets to DRAFT
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        doc.onWorkflowReturned();
        assertEquals(PurchaseOrderStatus.DRAFT, purchaseOrder.getStatus());

        // Test onWorkflowSubmitted sets PENDING_APPROVAL
        doc.onWorkflowSubmitted();
        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, purchaseOrder.getStatus());
    }

    @Test
    void testRejectPurchaseOrder_BlockedWhenWorkflowPending() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));

        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseOrderService.rejectPurchaseOrder(companyId, poId, "Pricing too high"));

        assertTrue(ex.getMessage().contains("workflow approval is pending"));
        assertEquals(PurchaseOrderStatus.PENDING_APPROVAL, purchaseOrder.getStatus());
        verify(purchaseOrderRepository, never()).save(any());
    }

    @Test
    void testRejectPurchaseOrder_SuccessWhenNoWorkflowPending() {
        purchaseOrder.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(null);
        when(purchaseOrderRepository.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> purchaseOrderService.rejectPurchaseOrder(companyId, poId, "Valid rejection reason"));
        assertEquals(PurchaseOrderStatus.REJECTED, purchaseOrder.getStatus());
        assertEquals("Valid rejection reason", purchaseOrder.getRejectionReason());
        verify(purchaseOrderRepository, times(1)).save(purchaseOrder);
    }

    @Test
    void testSubmitForApproval_WorkflowEngineFailure_RevertsToDraftAndThrows() {
        when(purchaseOrderRepository.findWithItemsByIdAndCompanyIdAndIsDeletedFalse(poId, companyId))
                .thenReturn(Optional.of(purchaseOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "PURCHASE_ORDER", poId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow service unavailable"))
                .when(workflowClient)
                .submitWorkflow(any(), any(), any(), any(), any());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                purchaseOrderService.submitForApproval(companyId, poId, "Urgent submission"));

        assertTrue(ex.getMessage().contains("Failed to submit purchase order for workflow approval"));
        assertEquals(PurchaseOrderStatus.DRAFT, purchaseOrder.getStatus());
        verify(purchaseOrderRepository, never()).save(any());
    }
}
