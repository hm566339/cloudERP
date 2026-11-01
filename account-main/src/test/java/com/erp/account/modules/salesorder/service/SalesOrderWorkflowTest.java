package com.erp.account.modules.salesorder.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.mapper.SalesOrderMapper;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.impl.SalesOrderServiceImpl;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.adapter.SalesOrderWorkflowAdapter;
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
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesOrderWorkflowTest {

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private SalesOrderMapper salesOrderMapper;

    @Mock
    private WorkflowClient workflowClient;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    private SalesOrderWorkflowAdapter adapter;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID soId;
    private UUID userId;
    private SalesOrder salesOrder;

    @BeforeAll
    static void initStaticMocks() {
        tenantUtilsMock = mockStatic(TenantUtils.class);
        currentUserContextMock = mockStatic(CurrentUserContext.class);
    }

    @AfterAll
    static void closeStaticMocks() {
        tenantUtilsMock.close();
        currentUserContextMock.close();
    }

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        soId = UUID.randomUUID();
        userId = UUID.randomUUID();

        salesOrder = SalesOrder.builder()
                .id(soId)
                .companyId(companyId)
                .soNumber("SO-2026-001")
                .totalAmount(new BigDecimal("15000.00"))
                .status(SalesOrderStatus.DRAFT)
                .build();
        salesOrder.setCreatedBy(userId);

        lenient().when(TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        lenient().when(TenantUtils.resolveCompanyId(null)).thenReturn(companyId);
        lenient().when(TenantUtils.getCurrentUserId()).thenReturn(userId);
        lenient().when(CurrentUserContext.getUserId()).thenReturn(userId);

        adapter = new SalesOrderWorkflowAdapter(salesOrderRepository, salesOrderService);
    }

    @Test
    void testSubmitForApproval_Success() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(null);

        SalesOrderResponse mockResponse = new SalesOrderResponse();
        mockResponse.setId(soId);
        mockResponse.setSoNumber("SO-2026-001");
        mockResponse.setStatus(SalesOrderStatus.DRAFT);
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(salesOrderMapper.toResponse(salesOrder)).thenReturn(mockResponse);

        SalesOrderResponse response = salesOrderService.submitForApproval(companyId, soId, "Review required");

        assertNotNull(response);
        assertEquals(soId, response.getId());
        verify(workflowClient, times(1)).submitWorkflow(
                eq(companyId),
                eq("SALES_ORDER"),
                eq(soId),
                eq("SO-2026-001"),
                eq("Review required"),
                any(),
                any(),
                any()
        );
    }

    @Test
    void testSubmitForApproval_FailsWhenNotDraft() {
        salesOrder.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.submitForApproval(companyId, soId, "Review required"));

        assertTrue(ex.getMessage().contains("can be submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitForApproval_DuplicatePendingWorkflow_ThrowsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.submitForApproval(companyId, soId, "Review required"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testConfirmSO_ApprovalBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        lenient().when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.confirmSO(companyId, soId));

        assertTrue(ex.getMessage().contains("cannot be confirmed directly while workflow approval is pending"));
        assertEquals(SalesOrderStatus.DRAFT, salesOrder.getStatus());
        verify(salesOrderRepository, never()).save(any());
    }

    @Test
    void testConfirmSO_Success_WhenNoActiveWorkflow() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(null);
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalesOrderResponse mockResponse = new SalesOrderResponse();
        mockResponse.setId(soId);
        mockResponse.setStatus(SalesOrderStatus.CONFIRMED);
        when(salesOrderMapper.toResponse(any(SalesOrder.class))).thenReturn(mockResponse);

        SalesOrderResponse response = salesOrderService.confirmSO(companyId, soId);

        assertNotNull(response);
        assertEquals(SalesOrderStatus.CONFIRMED, salesOrder.getStatus());
        verify(salesOrderRepository).save(salesOrder);
    }

    @Test
    void testSalesOrderWorkflowAdapter_LifecycleCallbacks() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        WorkflowDocument doc = adapter.find(soId, companyId);
        assertNotNull(doc);
        assertEquals("SALES_ORDER", doc.getDocumentType());
        assertEquals("SO-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("15000.00"), doc.getAmount());

        // 1. Submitted
        doc.onWorkflowSubmitted();
        assertEquals(SalesOrderStatus.PENDING_APPROVAL, salesOrder.getStatus());

        // 2. Approved
        doc.onWorkflowApproved();
        assertEquals(SalesOrderStatus.APPROVED, salesOrder.getStatus());

        // 3. Rejected
        doc.onWorkflowRejected();
        assertEquals(SalesOrderStatus.REJECTED, salesOrder.getStatus());

        // 4. Returned
        doc.onWorkflowReturned();
        assertEquals(SalesOrderStatus.CHANGES_REQUESTED, salesOrder.getStatus());

        // 5. Cancelled
        doc.onWorkflowCancelled();
        assertEquals(SalesOrderStatus.CANCELLED, salesOrder.getStatus());

        verify(salesOrderRepository, times(5)).save(salesOrder);
    }

    @Test
    void testSubmitForApproval_WorkflowEngineFailure_ThrowsBadRequest() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow service unreachable"))
                .when(workflowClient)
                .submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.submitForApproval(companyId, soId, "Review required"));

        assertTrue(ex.getMessage().contains("Failed to submit sales order for workflow approval"));
        assertEquals(SalesOrderStatus.DRAFT, salesOrder.getStatus());
        verify(salesOrderRepository, never()).save(any());
    }

    @Test
    void testCancelSO_BypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        lenient().when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.cancelSO(companyId, soId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        assertEquals(SalesOrderStatus.DRAFT, salesOrder.getStatus());
        verify(salesOrderRepository, never()).save(any());
    }

    @Test
    void testCancelSO_Success_WhenNoActiveWorkflow() {
        when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(null);
        when(salesOrderRepository.save(any(SalesOrder.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalesOrderResponse mockResponse = new SalesOrderResponse();
        mockResponse.setId(soId);
        mockResponse.setStatus(SalesOrderStatus.CANCELLED);
        when(salesOrderMapper.toResponse(any(SalesOrder.class))).thenReturn(mockResponse);

        SalesOrderResponse response = salesOrderService.cancelSO(companyId, soId);

        assertNotNull(response);
        assertEquals(SalesOrderStatus.CANCELLED, salesOrder.getStatus());
        verify(salesOrderRepository).save(salesOrder);
    }

    @Test
    void testChangeStatus_ConfirmationBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        lenient().when(salesOrderRepository.findByIdAndCompanyIdAndIsDeletedFalse(soId, companyId))
                .thenReturn(Optional.of(salesOrder));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("IN_PROGRESS")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_ORDER", soId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesOrderService.changeStatus(companyId, soId, SalesOrderStatus.CONFIRMED));

        assertTrue(ex.getMessage().contains("cannot be confirmed directly while workflow approval is pending"));
        assertEquals(SalesOrderStatus.DRAFT, salesOrder.getStatus());
        verify(salesOrderRepository, never()).save(any());
    }
}
