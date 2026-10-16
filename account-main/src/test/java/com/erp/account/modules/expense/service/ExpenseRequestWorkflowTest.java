package com.erp.account.modules.expense.service;

import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.integration.workflow.client.WorkflowClient;
import com.erp.account.integration.workflow.dto.WorkflowTransactionDto;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.expense.dto.ExpenseRequestApproveRequest;
import com.erp.account.modules.expense.dto.ExpenseRequestRejectRequest;
import com.erp.account.modules.expense.dto.ExpenseRequestResponse;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.mapper.ExpenseRequestMapper;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.impl.ExpenseRequestServiceImpl;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.adapter.ExpenseRequestWorkflowAdapter;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpenseRequestWorkflowTest {

    @Mock
    private ExpenseRequestRepository expenseRequestRepository;

    @Mock
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private DeliveryChallanRepository deliveryChallanRepository;

    @Mock
    private VoucherSequenceService voucherSequenceService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ExpenseClaimRepository expenseClaimRepository;

    @Mock
    private WorkflowClient workflowClient;

    @Spy
    private ExpenseRequestMapper expenseRequestMapper = Mappers.getMapper(ExpenseRequestMapper.class);

    @InjectMocks
    private ExpenseRequestServiceImpl expenseRequestService;

    private ExpenseRequestWorkflowAdapter adapter;

    private static MockedStatic<TenantUtils> tenantUtilsMock;
    private static MockedStatic<CurrentUserContext> currentUserContextMock;

    private UUID companyId;
    private UUID requestId;
    private UUID requesterId;
    private UUID approverId;
    private Company company;
    private ExpenseCategory category;
    private ExpenseRequest expenseRequest;

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
        requestId = UUID.randomUUID();
        requesterId = UUID.randomUUID();
        approverId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        category = ExpenseCategory.builder()
                .id(UUID.randomUUID())
                .company(company)
                .categoryName("Travel & Fuel")
                .build();

        expenseRequest = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0001")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(requesterId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("3500.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .approvalStatus(ExpenseRequestStatus.DRAFT)
                .build();
        expenseRequest.setCreatedBy(requesterId);

        lenient().when(TenantUtils.resolveCompanyId(companyId)).thenReturn(companyId);
        lenient().when(TenantUtils.resolveCompanyId(null)).thenReturn(companyId);
        lenient().when(TenantUtils.getCurrentUserId()).thenReturn(requesterId);
        lenient().when(CurrentUserContext.getUserId()).thenReturn(approverId);

        adapter = new ExpenseRequestWorkflowAdapter(expenseRequestRepository);
    }

    private void mockAuthenticationRoles(String... roles) {
        Authentication auth = mock(Authentication.class);
        List<SimpleGrantedAuthority> authorities = java.util.Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .toList();
        doReturn(authorities).when(auth).getAuthorities();
        lenient().when(auth.getName()).thenReturn("test-user");
        SecurityContext context = mock(SecurityContext.class);
        when(context.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    void testSubmitExpenseRequest_NonAutoApprove_WorkflowDispatched() {
        mockAuthenticationRoles("ROLE_EMPLOYEE");
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(null);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId, "Travel to client office");

        assertNotNull(response);
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, response.getApprovalStatus());

        verify(workflowClient, times(1)).submitWorkflow(
                eq(companyId),
                eq("EXPENSE_REQUEST"),
                eq(requestId),
                eq("ER-2026-0001"),
                eq("Travel to client office")
        );
    }

    @Test
    void testSubmitExpenseRequest_AutoApprove_Preserved() {
        mockAuthenticationRoles("ROLE_CFO");
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId, null);

        assertNotNull(response);
        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(ExpenseRequestStatus.APPROVED, response.getApprovalStatus());
        assertEquals(new BigDecimal("3500.00"), response.getApprovedAmount());
        assertEquals(requesterId, response.getApprovedBy());

        // Workflow submission must NOT be called when auto-approval applies
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitExpenseRequest_DuplicatePendingPrevention() {
        mockAuthenticationRoles("ROLE_EMPLOYEE");
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));

        WorkflowTransactionDto existingTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(existingTx);

        ValidationException ex = assertThrows(ValidationException.class, () ->
                expenseRequestService.submitExpenseRequest(companyId, requestId, "Duplicate try"));

        assertTrue(ex.getMessage().contains("already submitted for approval"));
        verify(workflowClient, never()).submitWorkflow(any(), any(), any(), any(), any());
    }

    @Test
    void testSubmitExpenseRequest_WorkflowEngineFailure_ThrowsAndRemainsDraft() {
        mockAuthenticationRoles("ROLE_EMPLOYEE");
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(null);
        doThrow(new RuntimeException("Workflow engine unreachable"))
                .when(workflowClient).submitWorkflow(any(), any(), any(), any(), any());

        ValidationException ex = assertThrows(ValidationException.class, () ->
                expenseRequestService.submitExpenseRequest(companyId, requestId, "Please approve"));

        assertTrue(ex.getMessage().contains("Failed to submit expense request for workflow approval"));
        assertEquals(ExpenseRequestStatus.DRAFT, expenseRequest.getStatus());
        verify(expenseRequestRepository, never()).save(expenseRequest);
    }

    @Test
    void testApproveExpenseRequest_DirectApprovalBypassPrevented() {
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(activeTx);

        ExpenseRequestApproveRequest approveReq = ExpenseRequestApproveRequest.builder()
                .approvedAmount(new BigDecimal("3500.00"))
                .remarks("Direct approval attempt")
                .build();

        ValidationException ex = assertThrows(ValidationException.class, () ->
                expenseRequestService.approveExpenseRequest(companyId, requestId, approveReq));

        assertTrue(ex.getMessage().contains("cannot be approved directly while workflow approval is pending"));
        verify(expenseRequestRepository, never()).save(argThat(r -> r.getStatus() == ExpenseRequestStatus.APPROVED));
    }

    @Test
    void testRejectExpenseRequest_DirectRejectionBypassPrevented() {
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("IN_PROGRESS")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(activeTx);

        ExpenseRequestRejectRequest rejectReq = ExpenseRequestRejectRequest.builder()
                .reason("Direct rejection attempt")
                .build();

        ValidationException ex = assertThrows(ValidationException.class, () ->
                expenseRequestService.rejectExpenseRequest(companyId, requestId, rejectReq));

        assertTrue(ex.getMessage().contains("cannot be rejected directly while workflow approval is pending"));
        verify(expenseRequestRepository, never()).save(argThat(r -> r.getStatus() == ExpenseRequestStatus.REJECTED));
    }

    @Test
    void testCancelExpenseRequest_DirectCancellationBypassPrevented() {
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));

        WorkflowTransactionDto activeTx = WorkflowTransactionDto.builder()
                .id(UUID.randomUUID())
                .status("PENDING")
                .build();
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(activeTx);

        ValidationException ex = assertThrows(ValidationException.class, () ->
                expenseRequestService.cancelExpenseRequest(companyId, requestId));

        assertTrue(ex.getMessage().contains("cannot be cancelled directly while workflow approval is pending"));
        verify(expenseRequestRepository, never()).save(argThat(r -> r.getStatus() == ExpenseRequestStatus.CANCELLED));
    }

    @Test
    void testDirectOperations_NoActiveWorkflow_Succeeds() {
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(workflowClient.getWorkflowByDocument(companyId, "EXPENSE_REQUEST", requestId))
                .thenReturn(null);

        // Direct approve with no active workflow (by manager/another user)
        lenient().when(TenantUtils.getCurrentUserId()).thenReturn(approverId);
        ExpenseRequestApproveRequest approveReq = ExpenseRequestApproveRequest.builder()
                .approvedAmount(new BigDecimal("3500.00"))
                .remarks("Manager approved")
                .build();
        ExpenseRequestResponse approvedResp = expenseRequestService.approveExpenseRequest(companyId, requestId, approveReq);
        assertEquals(ExpenseRequestStatus.APPROVED, approvedResp.getStatus());
        assertEquals(approverId, approvedResp.getApprovedBy());

        // Direct reject with no active workflow
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        ExpenseRequestRejectRequest rejectReq = ExpenseRequestRejectRequest.builder()
                .reason("Budget cut")
                .build();
        ExpenseRequestResponse rejectedResp = expenseRequestService.rejectExpenseRequest(companyId, requestId, rejectReq);
        assertEquals(ExpenseRequestStatus.REJECTED, rejectedResp.getStatus());
        assertEquals("Budget cut", expenseRequest.getRejectionReason());

        // Direct cancel with no active workflow
        expenseRequest.setStatus(ExpenseRequestStatus.PENDING_APPROVAL);
        ExpenseRequestResponse cancelledResp = expenseRequestService.cancelExpenseRequest(companyId, requestId);
        assertEquals(ExpenseRequestStatus.CANCELLED, cancelledResp.getStatus());
    }

    @Test
    void testWorkflowAdapter_Callbacks() {
        when(expenseRequestRepository.findByIdAndCompanyIdAndIsDeletedFalse(requestId, companyId))
                .thenReturn(Optional.of(expenseRequest));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        WorkflowDocument doc = adapter.find(requestId, companyId);
        assertNotNull(doc);
        assertEquals(requestId, doc.getId());
        assertEquals(companyId, doc.getCompanyId());
        assertEquals("EXPENSE_REQUEST", doc.getDocumentType());
        assertEquals("ER-2026-0001", doc.getDocumentNumber());
        assertEquals(new BigDecimal("3500.00"), doc.getAmount());
        assertEquals(requesterId, doc.getOwnerId());

        // onWorkflowSubmitted
        doc.onWorkflowSubmitted();
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, expenseRequest.getStatus());
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, expenseRequest.getApprovalStatus());

        // onWorkflowApproved
        doc.onWorkflowApproved();
        assertEquals(ExpenseRequestStatus.APPROVED, expenseRequest.getStatus());
        assertEquals(ExpenseRequestStatus.APPROVED, expenseRequest.getApprovalStatus());
        assertEquals(approverId, expenseRequest.getApprovedBy());
        assertEquals(new BigDecimal("3500.00"), expenseRequest.getApprovedAmount());
        assertNotNull(expenseRequest.getApprovedAt());

        // onWorkflowRejected
        doc.onWorkflowRejected();
        assertEquals(ExpenseRequestStatus.REJECTED, expenseRequest.getStatus());
        assertEquals(ExpenseRequestStatus.REJECTED, expenseRequest.getApprovalStatus());
        assertEquals(approverId, expenseRequest.getRejectedBy());
        assertNotNull(expenseRequest.getRejectedAt());

        // onWorkflowReturned
        doc.onWorkflowReturned();
        assertEquals(ExpenseRequestStatus.DRAFT, expenseRequest.getStatus());
        assertEquals(ExpenseRequestStatus.DRAFT, expenseRequest.getApprovalStatus());

        // onWorkflowCancelled
        doc.onWorkflowCancelled();
        assertEquals(ExpenseRequestStatus.CANCELLED, expenseRequest.getStatus());
        assertEquals(ExpenseRequestStatus.CANCELLED, expenseRequest.getApprovalStatus());

        verify(expenseRequestRepository, atLeast(5)).save(expenseRequest);
    }
}
