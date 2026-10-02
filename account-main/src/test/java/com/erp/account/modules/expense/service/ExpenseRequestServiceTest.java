package com.erp.account.modules.expense.service;

import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.mapper.ExpenseRequestMapper;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.impl.ExpenseRequestServiceImpl;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.vouchersequence.service.VoucherSequenceService;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mapstruct.factory.Mappers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpenseRequestServiceTest {

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

    @Spy
    private ExpenseRequestMapper expenseRequestMapper = Mappers.getMapper(ExpenseRequestMapper.class);

    @InjectMocks
    private ExpenseRequestServiceImpl expenseRequestService;

    private MockedStatic<TenantUtils> mockedTenantUtils;

    private UUID companyId;
    private UUID requesterId;
    private UUID managerId;
    private UUID employeeDriverId;
    private Company company;
    private ExpenseCategory category;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        requesterId = UUID.randomUUID();
        managerId = UUID.randomUUID();
        employeeDriverId = UUID.randomUUID();

        company = Company.builder()
                .id(companyId)
                .companyName("Test Corp")
                .companyCode("TC")
                .build();

        category = ExpenseCategory.builder()
                .id(UUID.randomUUID())
                .company(company)
                .categoryName("Travel & Fuel")
                .build();

        mockedTenantUtils = Mockito.mockStatic(TenantUtils.class);
        
        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getName()).thenReturn("testuser");
        securityContext.setAuthentication(authentication);
        SecurityContextHolder.setContext(securityContext);

        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyId(any())).thenReturn(companyId);
        mockedTenantUtils.when(() -> TenantUtils.resolveCompanyIdForQuery(any())).thenReturn(companyId);
        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(requesterId);
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
        SecurityContextHolder.clearContext();
    }

    // 1. Create Expense Request
    @Test
    void testCreateExpenseRequest_Success() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(expenseCategoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        when(voucherSequenceService.generateNextExpenseRequestNumber(eq(companyId), any())).thenReturn("ER-2026-0001");
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(invocation -> {
            ExpenseRequest req = invocation.getArgument(0);
            req.setId(UUID.randomUUID());
            return req;
        });

        ExpenseRequestCreateRequest request = ExpenseRequestCreateRequest.builder()
                .requestType(RequestType.EXPENSE_REQUEST)
                .date(LocalDate.of(2026, 9, 4))
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.DRIVER)
                .categoryId(category.getId())
                .requestedAmount(new BigDecimal("2000.00"))
                .purposeDescription("Fuel for client delivery")
                .additionalNotes("DC-2026-004")
                .build();

        ExpenseRequestResponse response = expenseRequestService.createExpenseRequest(companyId, request);

        assertNotNull(response);
        assertEquals("ER-2026-0001", response.getRequestNumber());
        assertEquals(ExpenseRequestStatus.DRAFT, response.getStatus());
        assertEquals(new BigDecimal("2000.00"), response.getRequestedAmount());
        assertEquals(RoleType.DRIVER, response.getRoleType());
        assertNull(response.getApprovedAmount());
    }

    // 2. Create Advance Request
    @Test
    void testCreateAdvanceRequest_Success() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(expenseCategoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        when(voucherSequenceService.generateNextExpenseRequestNumber(eq(companyId), any())).thenReturn("ER-2026-0002");
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(invocation -> {
            ExpenseRequest req = invocation.getArgument(0);
            req.setId(UUID.randomUUID());
            return req;
        });

        ExpenseRequestCreateRequest request = ExpenseRequestCreateRequest.builder()
                .requestType(RequestType.ADVANCE_REQUEST)
                .date(LocalDate.of(2026, 9, 4))
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .categoryId(category.getId())
                .requestedAmount(new BigDecimal("5000.00"))
                .requiresAdvance(true)
                .advanceAmount(new BigDecimal("5000.00"))
                .purposeDescription("Travel advance for client visit")
                .build();

        ExpenseRequestResponse response = expenseRequestService.createExpenseRequest(companyId, request);

        assertNotNull(response);
        assertEquals(RequestType.ADVANCE_REQUEST, response.getRequestType());
        assertTrue(response.getRequiresAdvance());
        assertEquals(new BigDecimal("5000.00"), response.getAdvanceAmount());
        assertEquals(ExpenseRequestStatus.DRAFT, response.getStatus());
    }

    // 3. Submit Request (Normal Employee)
    @Test
    void testSubmitRequest_NormalEmployee_TransitionsToPendingApproval() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0003")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("1500.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .approvalStatus(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        // Normal employee has ROLE_EMPLOYEE
        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, response.getStatus());
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, response.getApprovalStatus());
        assertNull(response.getApprovedBy());
    }

    // 4. Normal Employee Approval
    @Test
    void testApproveRequest_ManagerApproval_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0004")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("2000.00"))
                .status(ExpenseRequestStatus.PENDING_APPROVAL)
                .approvalStatus(ExpenseRequestStatus.PENDING_APPROVAL)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        // Current user is manager
        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(managerId);

        ExpenseRequestApproveRequest approveReq = ExpenseRequestApproveRequest.builder()
                .approvedAmount(new BigDecimal("1800.00"))
                .remarks("Approved with adjusted budget")
                .build();

        ExpenseRequestResponse response = expenseRequestService.approveExpenseRequest(companyId, requestId, approveReq);

        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("1800.00"), response.getApprovedAmount());
        assertEquals(managerId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // 4b. Normal Employee cannot self-approve
    @Test
    void testApproveRequest_NormalEmployeeSelfApproval_ThrowsSecurityException() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0005")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("2000.00"))
                .status(ExpenseRequestStatus.PENDING_APPROVAL)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));

        // Current user is the requester (normal employee)
        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(requesterId);

        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestApproveRequest approveReq = ExpenseRequestApproveRequest.builder()
                .approvedAmount(new BigDecimal("2000.00"))
                .build();

        assertThrows(SecurityException.class, () ->
                expenseRequestService.approveExpenseRequest(companyId, requestId, approveReq));
    }

    // 5. CEO Self Approval
    @Test
    void testSubmitRequest_CeoAutoApproval_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0006")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("3000.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        // User is CEO
        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_CEO"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("3000.00"), response.getApprovedAmount());
        assertEquals(requesterId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // 5b. CFO Auto Approval
    @Test
    void testSubmitRequest_CfoAutoApproval_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0007")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("10000.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_CFO"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("10000.00"), response.getApprovedAmount());
        assertEquals(requesterId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // 5c. SYSTEM_ADMIN Auto Approval
    @Test
    void testSubmitRequest_SystemAdminAutoApproval_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0008")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("500.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_SYSTEM_ADMIN"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("500.00"), response.getApprovedAmount());
        assertEquals(requesterId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // 5d. FINANCE_MANAGER Auto Approval
    @Test
    void testSubmitRequest_FinanceManagerAutoApproval_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0009")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("1500.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        Authentication auth = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_FINANCE_MANAGER"))).when(auth).getAuthorities();
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);

        ExpenseRequestResponse response = expenseRequestService.submitExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.APPROVED, response.getStatus());
        assertEquals(new BigDecimal("1500.00"), response.getApprovedAmount());
        assertEquals(requesterId, response.getApprovedBy());
        assertNotNull(response.getApprovedAt());
    }

    // 6. Reject Request
    @Test
    void testRejectRequest_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0007")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("2500.00"))
                .status(ExpenseRequestStatus.PENDING_APPROVAL)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(managerId);

        ExpenseRequestRejectRequest rejectReq = ExpenseRequestRejectRequest.builder()
                .reason("Amount exceeds approved travel budget")
                .build();

        ExpenseRequestResponse response = expenseRequestService.rejectExpenseRequest(companyId, requestId, rejectReq);

        assertEquals(ExpenseRequestStatus.REJECTED, response.getStatus());
        assertEquals("Amount exceeds approved travel budget", response.getRejectionReason());
        assertEquals(managerId, response.getRejectedBy());
        assertNotNull(response.getRejectedAt());
    }

    // 7. Cancel Request
    @Test
    void testCancelRequest_Success() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest existing = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .requestNumber("ER-2026-0008")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(requesterId)
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("1000.00"))
                .status(ExpenseRequestStatus.DRAFT)
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(existing));
        when(expenseRequestRepository.save(any(ExpenseRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ExpenseRequestResponse response = expenseRequestService.cancelExpenseRequest(companyId, requestId);

        assertEquals(ExpenseRequestStatus.CANCELLED, response.getStatus());
    }

    // 8. Invalid Amount (amount <= 0)
    @Test
    void testCreateExpenseRequest_InvalidAmount_ThrowsValidationException() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));

        ExpenseRequestCreateRequest request = ExpenseRequestCreateRequest.builder()
                .requestType(RequestType.EXPENSE_REQUEST)
                .date(LocalDate.now())
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.DRIVER)
                .categoryId(category.getId())
                .requestedAmount(new BigDecimal("0.00"))
                .build();

        assertThrows(ValidationException.class, () ->
                expenseRequestService.createExpenseRequest(companyId, request));
    }

    // 9. Cross-Company Reference Rejection
    @Test
    void testCreateExpenseRequest_CrossCompanyCategory_ThrowsValidationException() {
        Company otherCompany = Company.builder().id(UUID.randomUUID()).build();
        ExpenseCategory otherCategory = ExpenseCategory.builder()
                .id(UUID.randomUUID())
                .company(otherCompany)
                .categoryName("Other Company Cat")
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(expenseCategoryRepository.findById(otherCategory.getId())).thenReturn(Optional.of(otherCategory));

        ExpenseRequestCreateRequest request = ExpenseRequestCreateRequest.builder()
                .requestType(RequestType.EXPENSE_REQUEST)
                .date(LocalDate.now())
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.DRIVER)
                .categoryId(otherCategory.getId())
                .requestedAmount(new BigDecimal("1000.00"))
                .build();

        assertThrows(ValidationException.class, () ->
                expenseRequestService.createExpenseRequest(companyId, request));
    }

    @Test
    void testCreateExpenseRequest_CrossCompanySalesOrder_ThrowsValidationException() {
        UUID otherCompanyId = UUID.randomUUID();
        UUID salesOrderId = UUID.randomUUID();
        SalesOrder otherSo = SalesOrder.builder()
                .id(salesOrderId)
                .companyId(otherCompanyId)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(expenseCategoryRepository.findById(category.getId())).thenReturn(Optional.of(category));
        when(salesOrderRepository.findById(salesOrderId)).thenReturn(Optional.of(otherSo));

        ExpenseRequestCreateRequest request = ExpenseRequestCreateRequest.builder()
                .requestType(RequestType.EXPENSE_REQUEST)
                .date(LocalDate.now())
                .employeeDriverId(employeeDriverId)
                .roleType(RoleType.DRIVER)
                .categoryId(category.getId())
                .requestedAmount(new BigDecimal("1000.00"))
                .salesOrderId(salesOrderId)
                .build();

        assertThrows(ValidationException.class, () ->
                expenseRequestService.createExpenseRequest(companyId, request));
    }
}
