package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.common.repository.ReceiptAllocationRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.mapper.ReceiptVoucherMapper;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.impl.ReceiptVoucherServiceImpl;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.adapter.ReceiptVoucherWorkflowAdapter;
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
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReceiptVoucherWorkflowTest {

    @Mock
    private ReceiptVoucherRepository receiptVoucherRepository;

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private ReceiptVoucherMapper mapper;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ReceiptVoucherValidationService validationService;

    @Mock
    private ReceiptWorkflowValidator workflowValidator;

    @Mock
    private ReceiptVoucherPostingService postingService;

    @Mock
    private GlJournalEntryRepository glJournalEntryRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private ProformaInvoiceRepository proformaInvoiceRepository;

    @Mock
    private ReceiptAllocationRepository receiptAllocationRepository;

    @Mock
    private WorkflowClient workflowClient;

    @InjectMocks
    private ReceiptVoucherServiceImpl receiptVoucherService;

    private ReceiptVoucherWorkflowAdapter adapter;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID voucherId;
    private UUID customerId;
    private UUID userId;
    private ReceiptVoucher voucher;
    private Company company;

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
        voucherId = UUID.randomUUID();
        customerId = UUID.randomUUID();
        userId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        Customer customer = new Customer();
        customer.setId(customerId);

        voucher = ReceiptVoucher.builder()
                .id(voucherId)
                .company(company)
                .customer(customer)
                .receiptNo("RV-2026-001")
                .receiptDate(LocalDate.now())
                .receiptAmount(new BigDecimal("25000.00"))
                .paymentMode(PaymentMode.BANK_TRANSFER)
                .receiptStatus(ReceiptVoucherStatus.DRAFT)
                .build();
        voucher.setCreatedBy(userId);

        lenient().when(TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        lenient().when(TenantUtils.resolveCompanyId(null)).thenReturn(companyId);
        lenient().when(TenantUtils.getCurrentCompanyId()).thenReturn(companyId);
        lenient().when(TenantUtils.getCurrentUserId()).thenReturn(userId);
        lenient().when(TenantUtils.isSystemAdmin()).thenReturn(false);
        lenient().when(CurrentUserContext.getUserId()).thenReturn(userId);

        adapter = new ReceiptVoucherWorkflowAdapter(receiptVoucherRepository, receiptVoucherService);
    }

    @Test
    void testSubmitForApproval_Success() {
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(null);

        receiptVoucherService.submitForApproval(voucherId, "Please approve voucher");

        verify(workflowClient, times(1)).submitWorkflow(
                eq(companyId),
                eq("RECEIPT_VOUCHER"),
                eq(voucherId),
                eq("RV-2026-001"),
                eq("Please approve voucher"),
                any(),
                any(),
                any()
        );
        assertEquals(ReceiptVoucherStatus.SUBMITTED, voucher.getReceiptStatus());
        verify(receiptVoucherRepository, times(1)).save(voucher);
    }

    @Test
    void testSubmitForApproval_DuplicatePendingPrevention() {
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        WorkflowTransactionDto existingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .companyId(companyId)
                .documentType("RECEIPT_VOUCHER")
                .documentId(voucherId)
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(existingTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.submitForApproval(voucherId, "Duplicate attempt"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitForApproval_RequiresDraftStatus() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.submitForApproval(voucherId, null));

        assertTrue(ex.getMessage().contains("Only DRAFT"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitForApproval_WorkflowEngineFailure_ThrowsAndRemainsDraft() {
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow engine unreachable"))
                .when(workflowClient).submitWorkflow(any(), any(), any(), any(), any(), any(), any(), any());

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.submitForApproval(voucherId, "Please approve"));

        assertTrue(ex.getMessage().contains("Failed to submit receipt voucher for workflow approval"));
        assertEquals(ReceiptVoucherStatus.DRAFT, voucher.getReceiptStatus());
        verify(receiptVoucherRepository, never()).save(voucher);
    }

    @Test
    void testApproveReceipt_DirectApprovalBypassPrevented() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.approveReceipt(voucherId));

        assertTrue(ex.getMessage().contains("cannot be approved directly while workflow approval is pending"));
        verify(receiptVoucherRepository, never()).save(argThat(v -> v.getReceiptStatus() == ReceiptVoucherStatus.APPROVED));
    }

    @Test
    void testRejectReceipt_DirectRejectionBypassPrevented() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("IN_PROGRESS")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.rejectReceipt(voucherId));

        assertTrue(ex.getMessage().contains("cannot be rejected directly while workflow approval is pending"));
        verify(receiptVoucherRepository, never()).save(argThat(v -> v.getReceiptStatus() == ReceiptVoucherStatus.REJECTED));
    }

    @Test
    void testCancelReceipt_DirectCancellationBypassPrevented() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.DRAFT);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.cancelReceipt(voucherId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        verify(receiptVoucherRepository, never()).save(argThat(v -> v.getReceiptStatus() == ReceiptVoucherStatus.CANCELLED));
    }

    @Test
    void testPostReceipt_DirectPostingBypassPrevented() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.APPROVED);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("IN_PROGRESS")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(activeTx);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                receiptVoucherService.postReceipt(voucherId));

        assertTrue(ex.getMessage().contains("cannot be posted directly while workflow approval is pending"));
    }

    @Test
    void testDirectOperations_NoActiveWorkflow_Succeeds() {
        voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));
        when(workflowClient.getWorkflowByDocument(companyId, "RECEIPT_VOUCHER", voucherId))
                .thenReturn(null);

        // Direct approve with no active workflow
        assertDoesNotThrow(() -> receiptVoucherService.approveReceipt(voucherId));
        assertEquals(ReceiptVoucherStatus.APPROVED, voucher.getReceiptStatus());
        verify(validationService).validateApprove(voucher);

        // Direct post with no active workflow
        assertDoesNotThrow(() -> receiptVoucherService.postReceipt(voucherId));
        verify(postingService).post(voucher);

        // Direct reject with no active workflow (reset to SUBMITTED for reject)
        voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
        assertDoesNotThrow(() -> receiptVoucherService.rejectReceipt(voucherId));
        assertEquals(ReceiptVoucherStatus.REJECTED, voucher.getReceiptStatus());
        verify(validationService).validateReject(voucher);

        // Direct cancel with no active workflow
        voucher.setReceiptStatus(ReceiptVoucherStatus.DRAFT);
        assertDoesNotThrow(() -> receiptVoucherService.cancelReceipt(voucherId));
        assertEquals(ReceiptVoucherStatus.CANCELLED, voucher.getReceiptStatus());
        verify(validationService).validateCancel(voucher);
    }

    @Test
    void testWorkflowAdapter_Callbacks() {
        when(receiptVoucherRepository.findByIdAndCompanyIdAndIsDeletedFalse(voucherId, companyId))
                .thenReturn(Optional.of(voucher));
        when(receiptVoucherRepository.save(any(ReceiptVoucher.class))).thenAnswer(inv -> inv.getArgument(0));

        ReceiptVoucherService mockService = mock(ReceiptVoucherService.class);
        ReceiptVoucherWorkflowAdapter localAdapter = new ReceiptVoucherWorkflowAdapter(receiptVoucherRepository, mockService);

        WorkflowDocument doc = localAdapter.find(voucherId, companyId);
        assertNotNull(doc);
        assertEquals(voucherId, doc.getId());
        assertEquals(companyId, doc.getCompanyId());
        assertEquals("RECEIPT_VOUCHER", doc.getDocumentType());
        assertEquals("RV-2026-001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("25000.00"), doc.getAmount());

        // onWorkflowSubmitted
        doc.onWorkflowSubmitted();
        assertEquals(ReceiptVoucherStatus.SUBMITTED, voucher.getReceiptStatus());

        // onWorkflowApproved
        doc.onWorkflowApproved();
        assertEquals(ReceiptVoucherStatus.APPROVED, voucher.getReceiptStatus());
        assertEquals(userId, voucher.getApprovedBy());
        assertNotNull(voucher.getApprovedDate());
        verify(mockService).postReceipt(voucherId);

        // onWorkflowRejected
        doc.onWorkflowRejected();
        assertEquals(ReceiptVoucherStatus.REJECTED, voucher.getReceiptStatus());

        // onWorkflowReturned
        doc.onWorkflowReturned();
        assertEquals(ReceiptVoucherStatus.DRAFT, voucher.getReceiptStatus());

        // onWorkflowCancelled
        doc.onWorkflowCancelled();
        verify(mockService).cancelReceipt(voucherId);

        verify(receiptVoucherRepository, atLeast(4)).save(voucher);
    }
}
