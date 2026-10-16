package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.mapper.ApInvoiceMapper;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.impl.ApInvoiceServiceImpl;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.integration.inventory.service.InventoryIntegrationService;
import com.erp.account.modules.workflow.document.adapter.ApInvoiceWorkflowAdapter;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApInvoiceWorkflowTest {

    @Mock
    private ApInvoiceRepository apInvoiceRepository;

    @Mock
    private ApInvoiceMapper apInvoiceMapper;

    @Mock
    private InvoiceWorkflowService invoiceWorkflowService;

    @Mock
    private ThreeWayMatchingService threeWayMatchingService;

    @Mock
    private InventoryIntegrationService inventoryIntegrationService;

    @Mock
    private WorkflowClient workflowClient;

    @InjectMocks
    private ApInvoiceServiceImpl apInvoiceService;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID invoiceId;
    private UUID currentUserId;
    private ApInvoice invoice;
    private Company company;

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
        invoiceId = UUID.randomUUID();
        currentUserId = UUID.randomUUID();

        tenantUtilsMock.when(TenantUtils::isSystemAdmin).thenReturn(true);
        tenantUtilsMock.when(TenantUtils::getCurrentCompanyId).thenReturn(companyId);
        tenantUtilsMock.when(TenantUtils::getCurrentUserId).thenReturn(currentUserId);
        currentUserContextMock.when(CurrentUserContext::getUserRole).thenReturn("ACCOUNTANT");

        company = new Company();
        company.setId(companyId);

        invoice = new ApInvoice();
        invoice.setId(invoiceId);
        invoice.setCompany(company);
        invoice.setInvoiceNo("INV-2026-001");
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setIsDeleted(false);
        invoice.setTotalAmount(new BigDecimal("25000.00"));
        invoice.setCreatedBy(UUID.randomUUID()); // different from currentUserId to pass self-approval check

        lenient().when(apInvoiceRepository.findByIdAndIsDeletedFalse(invoiceId)).thenReturn(Optional.of(invoice));
        lenient().when(apInvoiceRepository.findByIdAndCompanyIdAndIsDeletedFalse(invoiceId, companyId)).thenReturn(Optional.of(invoice));
        lenient().when(apInvoiceMapper.entityToResponse(any())).thenReturn(new ApInvoiceResponse());
    }

    @Test
    void testSubmitForApproval_Success() {
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(null);
        when(apInvoiceRepository.save(any(ApInvoice.class))).thenAnswer(i -> i.getArgument(0));

        ApInvoiceResponse response = apInvoiceService.submitForApproval(invoiceId, "Submit invoice for verification");

        verify(invoiceWorkflowService, times(1)).submitForApproval(invoice);
        verify(workflowClient, times(1)).submitWorkflow(
                companyId, "AP_INVOICE", invoiceId, "INV-2026-001", "Submit invoice for verification");
        verify(apInvoiceRepository, times(1)).save(invoice);
    }

    @Test
    void testSubmitForApproval_DuplicatePending_ThrowsException() {
        WorkflowTransactionDto existingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(existingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                apInvoiceService.submitForApproval(invoiceId, "Duplicate"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testApproveInvoice_BlockedWhenWorkflowPending() {
        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                apInvoiceService.approveInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("workflow approval is pending"));
        verify(invoiceWorkflowService, never()).approve(any());
    }

    @Test
    void testApproveInvoice_SuccessWhenNoWorkflowPending() {
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(null);
        when(apInvoiceRepository.save(any(ApInvoice.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> apInvoiceService.approveInvoice(invoiceId));
        verify(invoiceWorkflowService, times(1)).approve(invoice);
        verify(apInvoiceRepository, times(1)).save(invoice);
    }

    @Test
    void testApInvoiceWorkflowAdapter_LifecycleCallbacks() {
        ApInvoiceService mockInvoiceService = mock(ApInvoiceService.class);
        InvoiceWorkflowService mockWorkflowService = mock(InvoiceWorkflowService.class);
        ApInvoiceWorkflowAdapter adapter = new ApInvoiceWorkflowAdapter(
                apInvoiceRepository, mockInvoiceService, mockWorkflowService);

        var doc = adapter.find(invoiceId, companyId);
        assertNotNull(doc);
        assertEquals("AP_INVOICE", doc.getDocumentType());
        assertEquals("INV-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("25000.00"), doc.getAmount());

        // onWorkflowReturned resets to DRAFT
        invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);
        doc.onWorkflowReturned();
        assertEquals(InvoiceStatus.DRAFT, invoice.getStatus());

        // onWorkflowApproved calls invoiceWorkflowService.approve and service.postInvoice
        doc.onWorkflowApproved();
        verify(mockWorkflowService, times(1)).approve(invoice);
        verify(mockInvoiceService, times(1)).postInvoice(invoiceId);

        // onWorkflowRejected sets REJECTED
        doc.onWorkflowRejected();
        assertEquals(InvoiceStatus.REJECTED, invoice.getStatus());

        // onWorkflowCancelled calls invoiceWorkflowService.cancel
        doc.onWorkflowCancelled();
        verify(mockWorkflowService, times(1)).cancel(invoice);
    }

    @Test
    void testRejectInvoice_BlockedWhenWorkflowPending() {
        WorkflowTransactionDto pendingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(pendingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                apInvoiceService.rejectInvoice(invoiceId));

        assertTrue(ex.getMessage().contains("workflow approval is pending"));
        verify(invoiceWorkflowService, never()).reject(any());
        verify(apInvoiceRepository, never()).save(any());
    }

    @Test
    void testRejectInvoice_SuccessWhenNoWorkflowPending() {
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(null);
        when(apInvoiceRepository.save(any(ApInvoice.class))).thenAnswer(i -> i.getArgument(0));

        assertDoesNotThrow(() -> apInvoiceService.rejectInvoice(invoiceId));
        verify(invoiceWorkflowService, times(1)).reject(invoice);
        verify(apInvoiceRepository, times(1)).save(invoice);
    }

    @Test
    void testSubmitForApproval_WorkflowEngineFailure_ThrowsAndDoesNotProceed() {
        when(workflowClient.getWorkflowByDocument(companyId, "AP_INVOICE", invoiceId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow service unavailable"))
                .when(workflowClient)
                .submitWorkflow(any(), any(), any(), any(), any());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                apInvoiceService.submitForApproval(invoiceId, "Submit invoice"));

        assertTrue(ex.getMessage().contains("Failed to submit AP invoice for workflow approval"));
        verify(invoiceWorkflowService, never()).submitForApproval(any());
        verify(apInvoiceRepository, never()).save(any());
    }
}
