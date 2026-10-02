package com.erp.account.modules.expense.service.impl;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.modules.expense.service.ExpenseRequestService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2test")
public class ExpenseRequestMultiClaimIntegrationTest {

    @Autowired
    private ExpenseRequestService expenseRequestService;

    @Autowired
    private ExpenseClaimService expenseClaimService;

    @Autowired
    private ExpenseRequestRepository expenseRequestRepository;

    @Autowired
    private ExpenseClaimRepository expenseClaimRepository;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private UUID companyId;
    private UUID employeeId;
    private ExpenseCategory category;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        CurrentUserContext.setUserId(employeeId);
        CurrentUserContext.setCompanyId(companyId);
        CurrentUserContext.setUsername("testuser");

        Company comp = new Company();
        comp.setId(companyId);
        comp.setCompanyName("Multi Claim Test Company " + UUID.randomUUID().toString());
        comp.setBaseCurrency("INR");
        comp.setActive(true);
        Company company = companyRepository.saveAndFlush(comp);

        category = ExpenseCategory.builder()
                .company(company)
                .categoryName("Travel")
                .categoryCode("TC-TRV")
                .isActive(true)
                .build();
        category = expenseCategoryRepository.saveAndFlush(category);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                employeeId.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testMultipleExpenseClaimsAgainstOneRequestAndFiltering() {
        // 1. Create an approved Expense Request of 1000.00
        ExpenseRequest request = ExpenseRequest.builder()
                .company(companyRepository.findById(companyId).orElseThrow())
                .requestNumber("ER-TEST-001")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(employeeId)
                .employeeDriverId(employeeId)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("1000.00"))
                .approvedAmount(new BigDecimal("1000.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("Trip to Client Site")
                .build();
        expenseRequestRepository.save(request);

        // 2. Query available requests via status=APPROVED
        ExpenseRequestFilterDto filterStatusApproved = ExpenseRequestFilterDto.builder()
                .employeeDriverId(employeeId)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page1 = expenseRequestService.getAllExpenseRequests(companyId, filterStatusApproved, PageRequest.of(0, 50));
        assertEquals(1, page1.getContent().size());
        ExpenseRequestResponse r1 = page1.getContent().get(0);
        assertEquals(0, new BigDecimal("0.00").compareTo(r1.getUsedAmount()));
        assertEquals(0, new BigDecimal("1000.00").compareTo(r1.getRemainingAmount()));

        // 3. Create Claim #1 for 100.00
        ExpenseClaimCreateRequest claimReq1 = new ExpenseClaimCreateRequest();
        claimReq1.setEmployeeId(employeeId);
        claimReq1.setClaimDate(LocalDate.now());
        claimReq1.setExpenseRequestId(request.getId());

        ExpenseClaimItemRequest item1 = new ExpenseClaimItemRequest();
        item1.setExpenseCategoryId(category.getId());
        item1.setAmount(new BigDecimal("100.00"));
        item1.setExpenseDate(LocalDate.now());
        item1.setPaymentType(PaymentType.CASH);
        item1.setDescription("Taxi fare");
        claimReq1.setItems(List.of(item1));

        ExpenseClaimResponse claimRes1 = expenseClaimService.createExpenseClaim(companyId, claimReq1);
        assertNotNull(claimRes1);
        assertEquals(0, new BigDecimal("100.00").compareTo(claimRes1.getClaimAmount()));

        // Check request status is now CONVERTED_TO_EXPENSE, but approvalStatus is still APPROVED
        ExpenseRequest reloaded = expenseRequestRepository.findById(request.getId()).orElseThrow();
        assertEquals(ExpenseRequestStatus.CONVERTED_TO_EXPENSE, reloaded.getStatus());
        assertEquals(ExpenseRequestStatus.APPROVED, reloaded.getApprovalStatus());

        // 4. Query available requests again using both status=APPROVED and approvalStatus=APPROVED
        // Must still be returned because remainingAmount is 900.00!
        Page<ExpenseRequestResponse> page2 = expenseRequestService.getAllExpenseRequests(companyId, filterStatusApproved, PageRequest.of(0, 50));
        assertEquals(1, page2.getContent().size());
        ExpenseRequestResponse r2 = page2.getContent().get(0);
        assertEquals(ExpenseRequestStatus.CONVERTED_TO_EXPENSE, r2.getStatus());
        assertEquals(ExpenseRequestStatus.APPROVED, r2.getApprovalStatus());
        assertEquals(0, new BigDecimal("100.00").compareTo(r2.getUsedAmount()));
        assertEquals(0, new BigDecimal("900.00").compareTo(r2.getRemainingAmount()));

        // Also query using approvalStatus=APPROVED
        ExpenseRequestFilterDto filterApprovalApproved = ExpenseRequestFilterDto.builder()
                .employeeDriverId(employeeId)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> pageApproval = expenseRequestService.getAllExpenseRequests(companyId, filterApprovalApproved, PageRequest.of(0, 50));
        assertEquals(1, pageApproval.getContent().size());
        assertEquals(0, new BigDecimal("900.00").compareTo(pageApproval.getContent().get(0).getRemainingAmount()));

        // 5. Create Claim #2 for 500.00 -> Valid (500 <= 900)
        ExpenseClaimCreateRequest claimReq2 = new ExpenseClaimCreateRequest();
        claimReq2.setEmployeeId(employeeId);
        claimReq2.setClaimDate(LocalDate.now());
        claimReq2.setExpenseRequestId(request.getId());

        ExpenseClaimItemRequest item2 = new ExpenseClaimItemRequest();
        item2.setExpenseCategoryId(category.getId());
        item2.setAmount(new BigDecimal("500.00"));
        item2.setExpenseDate(LocalDate.now());
        item2.setPaymentType(PaymentType.CASH);
        item2.setDescription("Hotel accommodation");
        claimReq2.setItems(List.of(item2));

        ExpenseClaimResponse claimRes2 = expenseClaimService.createExpenseClaim(companyId, claimReq2);
        assertNotNull(claimRes2);

        // Remaining should now be 400.00
        ExpenseRequestResponse r3 = expenseRequestService.getExpenseRequestById(companyId, request.getId());
        assertEquals(0, new BigDecimal("600.00").compareTo(r3.getUsedAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(r3.getRemainingAmount()));

        // 6. Attempt Claim #3 for 401.00 -> Should be rejected (401 > 400)
        ExpenseClaimCreateRequest claimReq3Invalid = new ExpenseClaimCreateRequest();
        claimReq3Invalid.setEmployeeId(employeeId);
        claimReq3Invalid.setClaimDate(LocalDate.now());
        claimReq3Invalid.setExpenseRequestId(request.getId());

        ExpenseClaimItemRequest item3Invalid = new ExpenseClaimItemRequest();
        item3Invalid.setExpenseCategoryId(category.getId());
        item3Invalid.setAmount(new BigDecimal("401.00"));
        item3Invalid.setExpenseDate(LocalDate.now());
        item3Invalid.setPaymentType(PaymentType.CASH);
        item3Invalid.setDescription("Over limit meal");
        claimReq3Invalid.setItems(List.of(item3Invalid));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            expenseClaimService.createExpenseClaim(companyId, claimReq3Invalid);
        });
        assertTrue(ex.getMessage().contains("exceeds the remaining approved amount"));

        // 7. Create Claim #3 for exactly remaining 400.00 -> Valid
        ExpenseClaimCreateRequest claimReq3Valid = new ExpenseClaimCreateRequest();
        claimReq3Valid.setEmployeeId(employeeId);
        claimReq3Valid.setClaimDate(LocalDate.now());
        claimReq3Valid.setExpenseRequestId(request.getId());

        ExpenseClaimItemRequest item3Valid = new ExpenseClaimItemRequest();
        item3Valid.setExpenseCategoryId(category.getId());
        item3Valid.setAmount(new BigDecimal("400.00"));
        item3Valid.setExpenseDate(LocalDate.now());
        item3Valid.setPaymentType(PaymentType.CASH);
        item3Valid.setDescription("Final meal");
        claimReq3Valid.setItems(List.of(item3Valid));

        ExpenseClaimResponse claimRes3 = expenseClaimService.createExpenseClaim(companyId, claimReq3Valid);
        assertNotNull(claimRes3);

        // 8. Used is now 1000.00, remaining is 0.00
        ExpenseRequestResponse rFinal = expenseRequestService.getExpenseRequestById(companyId, request.getId());
        assertEquals(0, new BigDecimal("1000.00").compareTo(rFinal.getUsedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(rFinal.getRemainingAmount()));

        // 9. Query available requests again -> Must return EMPTY because remaining is 0!
        Page<ExpenseRequestResponse> pageEmpty = expenseRequestService.getAllExpenseRequests(companyId, filterStatusApproved, PageRequest.of(0, 50));
        assertTrue(pageEmpty.isEmpty());

        Page<ExpenseRequestResponse> pageEmptyApproval = expenseRequestService.getAllExpenseRequests(companyId, filterApprovalApproved, PageRequest.of(0, 50));
        assertTrue(pageEmptyApproval.isEmpty());
    }
}
