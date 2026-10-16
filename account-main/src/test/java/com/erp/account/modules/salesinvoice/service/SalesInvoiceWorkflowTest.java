package com.erp.account.modules.salesinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.mapper.SalesInvoiceMapper;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.impl.SalesInvoiceServiceImpl;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.adapter.SalesInvoiceWorkflowAdapter;
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
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SalesInvoiceWorkflowTest {

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private SalesInvoiceMapper salesInvoiceMapper;

    @Mock
    private AccountingValidationService accountingValidationService;

    @Mock
    private WorkflowClient workflowClient;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private SalesInvoiceServiceImpl salesInvoiceService;

    private SalesInvoiceWorkflowAdapter adapter;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID invoiceId;
    private UUID userId;
    private SalesInvoice invoice;

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
        invoiceId = UUID.randomUUID();
        userId = UUID.randomUUID();

        invoice = new SalesInvoice();
        invoice.setId(invoiceId);
        invoice.setCompanyId(companyId);
        invoice.setInvoiceNumber("INV-2026-0001");
        invoice.setInvoiceDate(LocalDate.now());
        invoice.setTotalAmount(new BigDecimal("25000.00"));
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setIsDeleted(false);
        invoice.setCreatedBy(userId);

        lenient().when(TenantUtils.isSystemAdmin()).thenReturn(false);
        lenient().when(TenantUtils.getCurrentCompanyId()).thenReturn(companyId);
        lenient().when(TenantUtils.resolveCompanyIdForQuery(companyId)).thenReturn(companyId);
        lenient().when(TenantUtils.resolveCompanyIdForQuery(null)).thenReturn(companyId);
        lenient().when(TenantUtils.getCurrentUserId()).thenReturn(userId);
        lenient().when(CurrentUserContext.getUserId()).thenReturn(userId);

        lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(mock(TransactionStatus.class));
        });

        adapter = new SalesInvoiceWorkflowAdapter(salesInvoiceRepository, salesInvoiceService);
    }

    @Test
    void testSubmitForApproval_Success() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(null);
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalesInvoiceResponse mockResponse = new SalesInvoiceResponse();
        mockResponse.setId(invoiceId);
        mockResponse.setInvoiceNumber("INV-2026-0001");
        when(salesInvoiceMapper.entityToResponse(any(SalesInvoice.class))).thenReturn(mockResponse);

        SalesInvoiceResponse response = salesInvoiceService.submitForApproval(companyId, invoiceId, "Please review invoice");

        assertNotNull(response);
        assertEquals(InvoiceStatus.PENDING_APPROVAL, invoice.getStatus());
        verify(workflowClient, times(1)).submitWorkflow(
                eq(companyId),
                eq("SALES_INVOICE"),
                eq(invoiceId),
                eq("INV-2026-0001"),
                eq("Please review invoice")
        );
        verify(salesInvoiceRepository).save(invoice);
    }

    @Test
    void testSubmitForApproval_FailsWhenNotDraft() {
        invoice.setStatus(InvoiceStatus.APPROVED);
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.submitForApproval(companyId, invoiceId, "Please review"));

        assertTrue(ex.getMessage().contains("Only DRAFT invoices can be submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitForApproval_DuplicatePendingWorkflow_ThrowsBadRequest() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.submitForApproval(companyId, invoiceId, "Please review"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testApproveInvoice_DirectApprovalBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.approveInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("cannot be approved directly while workflow approval is pending"));
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void testApproveInvoice_Success_WhenNoActiveWorkflow() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(null);

        salesInvoiceService.approveInvoice(invoiceId);

        assertEquals(InvoiceStatus.APPROVED, invoice.getStatus());
        assertEquals(userId, invoice.getApprovedBy());
        assertNotNull(invoice.getApprovedAt());
        verify(salesInvoiceRepository).save(invoice);
    }

    @Test
    void testPostInvoice_DirectPostingBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        invoice.setStatus(InvoiceStatus.APPROVED);
        invoice.setGlPostingStatus(PostingStatus.DRAFT);
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.postInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("cannot be posted directly while workflow approval is pending"));
    }

    @Test
    void testSalesInvoiceWorkflowAdapter_LifecycleCallbacks() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(salesInvoiceRepository.save(any(SalesInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SalesInvoiceService mockService = mock(SalesInvoiceService.class);
        SalesInvoiceWorkflowAdapter localAdapter = new SalesInvoiceWorkflowAdapter(salesInvoiceRepository, mockService);

        WorkflowDocument doc = localAdapter.find(invoiceId, companyId);
        assertNotNull(doc);
        assertEquals("SALES_INVOICE", doc.getDocumentType());
        assertEquals("INV-2026-0001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("25000.00"), doc.getAmount());

        // 1. Submitted
        doc.onWorkflowSubmitted();
        assertEquals(InvoiceStatus.PENDING_APPROVAL, invoice.getStatus());

        // 2. Approved
        doc.onWorkflowApproved();
        assertEquals(InvoiceStatus.APPROVED, invoice.getStatus());
        assertEquals(userId, invoice.getApprovedBy());
        verify(mockService).postInvoice(invoiceId);

        // 3. Rejected
        doc.onWorkflowRejected();
        assertEquals(InvoiceStatus.REJECTED, invoice.getStatus());

        // 4. Returned
        doc.onWorkflowReturned();
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());

        // 5. Cancelled
        doc.onWorkflowCancelled();
        verify(mockService).cancelInvoice(invoiceId);

        verify(salesInvoiceRepository, atLeast(4)).save(invoice);
    }

    @Test
    void testOnWorkflowApproved_IdempotentCheckPreventsDuplicatePosting() {
        invoice.setStatus(InvoiceStatus.POSTED);
        invoice.setGlPostingStatus(com.erp.account.enums.PostingStatus.POSTED);
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        SalesInvoiceService mockService = mock(SalesInvoiceService.class);
        SalesInvoiceWorkflowAdapter localAdapter = new SalesInvoiceWorkflowAdapter(salesInvoiceRepository, mockService);

        WorkflowDocument doc = localAdapter.find(invoiceId, companyId);
        assertNotNull(doc);

        doc.onWorkflowApproved();

        // Must not post again or update status if already POSTED
        verify(mockService, never()).postInvoice(any());
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void testSubmitForApproval_WorkflowEngineFailure_ThrowsBadRequest() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow service unavailable"))
                .when(workflowClient)
                .submitWorkflow(any(), any(), any(), any(), any());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.submitForApproval(companyId, invoiceId, "Please review"));

        assertTrue(ex.getMessage().contains("Failed to submit sales invoice for workflow approval"));
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void testRejectInvoice_DirectRejectionBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.rejectInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("cannot be rejected directly while workflow approval is pending"));
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void testRejectInvoice_Success_WhenNoActiveWorkflow() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(null);

        salesInvoiceService.rejectInvoice(invoiceId);

        assertEquals(InvoiceStatus.REJECTED, invoice.getStatus());
        verify(salesInvoiceRepository).save(invoice);
    }

    @Test
    void testCancelInvoice_DirectCancellationBypassProtection_ThrowsBadRequestWhenWorkflowPending() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("IN_PROGRESS")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                salesInvoiceService.cancelInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());
        verify(salesInvoiceRepository, never()).save(any());
    }

    @Test
    void testCancelInvoice_Success_WhenNoActiveWorkflow() {
        when(salesInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId))
                .thenReturn(Optional.of(invoice));
        when(workflowClient.getWorkflowByDocument(companyId, "SALES_INVOICE", invoiceId))
                .thenReturn(null);

        salesInvoiceService.cancelInvoice(invoiceId);

        assertEquals(InvoiceStatus.CANCELLED, invoice.getStatus());
        verify(salesInvoiceRepository).save(invoice);
    }
}
