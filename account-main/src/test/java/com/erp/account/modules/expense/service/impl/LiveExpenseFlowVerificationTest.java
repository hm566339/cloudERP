package com.erp.account.modules.expense.service.impl;

import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.modules.expense.service.ExpenseRequestService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LiveExpenseFlowVerificationTest {

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

    private static final UUID EMPLOYEE_ID = UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012");
    private static UUID companyId;
    private static ExpenseCategory category;
    private static ExpenseRequest erOld;
    private static ExpenseRequest erNew;

    @BeforeEach
    void setUpContext() {
        CurrentUserContext.setUserId(EMPLOYEE_ID);
        CurrentUserContext.setUsername("driver_john");
        CurrentUserContext.setUserFullName("John Driver");
        CurrentUserContext.setUserRole("EMPLOYEE");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                EMPLOYEE_ID.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @Order(1)
    void setupInitialDataMatchingUserPrompt() {
        // Setup company & category
        companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        Company comp = new Company();
        comp.setId(companyId);
        comp.setCompanyName("Verification Fleet Logistics");
        comp.setBaseCurrency("INR");
        comp.setActive(true);
        Company company = companyRepository.saveAndFlush(comp);

        category = ExpenseCategory.builder()
                .company(company)
                .categoryName("Fuel & Maintenance")
                .categoryCode("EXP-FUEL")
                .isActive(true)
                .build();
        category = expenseCategoryRepository.saveAndFlush(category);

        // Create ER-2026-0008: Requested 1000, Approved 1000
        erOld = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-2026-0008")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(EMPLOYEE_ID)
                .employeeDriverId(EMPLOYEE_ID)
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(category)
                .requestedAmount(new BigDecimal("1000.00"))
                .approvedAmount(new BigDecimal("1000.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("Trip allowance for regional delivery")
                .build();
        erOld = expenseRequestRepository.saveAndFlush(erOld);

        // Pre-existing Claim 1: 100.00 (EC-2026-0005)
        ExpenseClaimCreateRequest c1 = new ExpenseClaimCreateRequest();
        c1.setEmployeeId(EMPLOYEE_ID);
        c1.setClaimDate(LocalDate.now());
        c1.setExpenseRequestId(erOld.getId());
        ExpenseClaimItemRequest it1 = new ExpenseClaimItemRequest();
        it1.setExpenseCategoryId(category.getId());
        it1.setAmount(new BigDecimal("100.00"));
        it1.setExpenseDate(LocalDate.now());
        it1.setPaymentType(PaymentType.CASH);
        it1.setDescription("Toll booth fees");
        c1.setItems(List.of(it1));
        expenseClaimService.createExpenseClaim(companyId, c1);

        // Pre-existing Claim 2: 500.00 (EC-2026-0006)
        ExpenseClaimCreateRequest c2 = new ExpenseClaimCreateRequest();
        c2.setEmployeeId(EMPLOYEE_ID);
        c2.setClaimDate(LocalDate.now());
        c2.setExpenseRequestId(erOld.getId());
        ExpenseClaimItemRequest it2 = new ExpenseClaimItemRequest();
        it2.setExpenseCategoryId(category.getId());
        it2.setAmount(new BigDecimal("500.00"));
        it2.setExpenseDate(LocalDate.now());
        it2.setPaymentType(PaymentType.CASH);
        it2.setDescription("Diesel refuel");
        c2.setItems(List.of(it2));
        expenseClaimService.createExpenseClaim(companyId, c2);

        // Verify initial state matching user prompt
        ExpenseRequestResponse oldResp = expenseRequestService.getExpenseRequestById(companyId, erOld.getId());
        System.out.println("=== INITIAL DATA VERIFIED ===");
        System.out.println("Request: " + oldResp.getRequestNumber());
        System.out.println("Approved: " + oldResp.getApprovedAmount());
        System.out.println("Used: " + oldResp.getUsedAmount());
        System.out.println("Remaining: " + oldResp.getRemainingAmount());
        System.out.println("Status: " + oldResp.getStatus());
        System.out.println("Approval Status: " + oldResp.getApprovalStatus());

        assertEquals(0, new BigDecimal("1000.00").compareTo(oldResp.getApprovedAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(oldResp.getUsedAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(oldResp.getRemainingAmount()));
        assertEquals(ExpenseRequestStatus.CONVERTED_TO_EXPENSE, oldResp.getStatus());
        assertEquals(ExpenseRequestStatus.APPROVED, oldResp.getApprovalStatus());
    }

    @Test
    @Order(2)
    void test1_CreateSecondExpenseRequestForSameEmployee() {
        CurrentUserContext.setCompanyId(companyId);

        // Create another Expense Request for the same employee: requestedAmount = 2000
        ExpenseRequestCreateRequest createReq = new ExpenseRequestCreateRequest();
        createReq.setRequestType(RequestType.EXPENSE_REQUEST);
        createReq.setDate(LocalDate.now());
        createReq.setEmployeeDriverId(EMPLOYEE_ID);
        createReq.setRoleType(RoleType.EMPLOYEE);
        createReq.setCategoryId(category.getId());
        createReq.setRequestedAmount(new BigDecimal("2000.00"));
        createReq.setPurposeDescription("Long haul journey expenses");

        ExpenseRequestResponse created = expenseRequestService.createExpenseRequest(companyId, createReq);
        assertNotNull(created.getId());

        // Submit the request
        ExpenseRequestResponse submitted = expenseRequestService.submitExpenseRequest(companyId, created.getId());
        assertEquals(ExpenseRequestStatus.PENDING_APPROVAL, submitted.getStatus());

        // Approve the new request as Finance Manager
        UUID managerId = UUID.randomUUID();
        CurrentUserContext.setUserId(managerId);
        CurrentUserContext.setUsername("finance_manager");
        CurrentUserContext.setUserRole("FINANCE_MANAGER");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(managerId.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_FINANCE_MANAGER")))
        );

        ExpenseRequestApproveRequest approveReq = new ExpenseRequestApproveRequest();
        approveReq.setApprovedAmount(new BigDecimal("2000.00"));
        approveReq.setRemarks("Approved full journey budget");
        ExpenseRequestResponse approved = expenseRequestService.approveExpenseRequest(companyId, created.getId(), approveReq);

        erNew = expenseRequestRepository.findById(approved.getId()).orElseThrow();

        // Restore employee context
        CurrentUserContext.setUserId(EMPLOYEE_ID);
        CurrentUserContext.setUsername("driver_john");
        CurrentUserContext.setUserFullName("John Driver");
        CurrentUserContext.setUserRole("EMPLOYEE");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(EMPLOYEE_ID.toString(), null, List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
        );

        System.out.println("=== TEST 1 RESULTS ===");
        System.out.println("New Request " + approved.getRequestNumber() + " -> Approved: " + approved.getApprovedAmount()
                + ", Used: " + approved.getUsedAmount() + ", Remaining: " + approved.getRemainingAmount());

        // Expected for New Request:
        assertEquals(0, new BigDecimal("2000.00").compareTo(approved.getRequestedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(approved.getApprovedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(approved.getUsedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(approved.getRemainingAmount()));

        // Expected for Old Request (must remain unchanged):
        ExpenseRequestResponse oldCheck = expenseRequestService.getExpenseRequestById(companyId, erOld.getId());
        System.out.println("Old Request " + oldCheck.getRequestNumber() + " -> Approved: " + oldCheck.getApprovedAmount()
                + ", Used: " + oldCheck.getUsedAmount() + ", Remaining: " + oldCheck.getRemainingAmount());
        assertEquals(0, new BigDecimal("1000.00").compareTo(oldCheck.getApprovedAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(oldCheck.getUsedAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(oldCheck.getRemainingAmount()));
    }

    @Test
    @Order(3)
    void test2_VerifyBothRequestsAreAvailable() {
        CurrentUserContext.setCompanyId(companyId);

        // Call Expense Request API for employee with status=APPROVED
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();

        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        System.out.println("=== TEST 2 RESULTS ===");
        System.out.println("Returned available requests count: " + page.getContent().size());
        for (ExpenseRequestResponse r : page.getContent()) {
            System.out.println(" -> " + r.getRequestNumber() + " | Approved: ₹" + r.getApprovedAmount()
                    + " | Used: ₹" + r.getUsedAmount() + " | Remaining: ₹" + r.getRemainingAmount());
        }

        assertEquals(2, page.getContent().size());

        ExpenseRequestResponse oldReq = page.getContent().stream()
                .filter(r -> r.getId().equals(erOld.getId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("400.00").compareTo(oldReq.getRemainingAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(oldReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("1000.00").compareTo(oldReq.getApprovedAmount()));

        ExpenseRequestResponse newReq = page.getContent().stream()
                .filter(r -> r.getId().equals(erNew.getId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("2000.00").compareTo(newReq.getRemainingAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(newReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(newReq.getApprovedAmount()));
    }

    @Test
    @Order(4)
    void test3_CreateAnotherClaimAgainstOldRequest() {
        CurrentUserContext.setCompanyId(companyId);

        // Create Claim for 250.00 against ER-2026-0008 (Remaining is 400.00)
        ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
        claimReq.setEmployeeId(EMPLOYEE_ID);
        claimReq.setClaimDate(LocalDate.now());
        claimReq.setExpenseRequestId(erOld.getId());

        ExpenseClaimItemRequest it = new ExpenseClaimItemRequest();
        it.setExpenseCategoryId(category.getId());
        it.setAmount(new BigDecimal("250.00"));
        it.setExpenseDate(LocalDate.now());
        it.setPaymentType(PaymentType.CASH);
        it.setDescription("Vehicle tyre puncture repair");
        claimReq.setItems(List.of(it));

        ExpenseClaimResponse claimRes = expenseClaimService.createExpenseClaim(companyId, claimReq);
        assertNotNull(claimRes);
        assertEquals(0, new BigDecimal("250.00").compareTo(claimRes.getClaimAmount()));

        ExpenseRequestResponse oldReq = expenseRequestService.getExpenseRequestById(companyId, erOld.getId());
        System.out.println("=== TEST 3 RESULTS ===");
        System.out.println(oldReq.getRequestNumber() + " after ₹250 claim -> Used: ₹" + oldReq.getUsedAmount() + ", Remaining: ₹" + oldReq.getRemainingAmount());

        assertEquals(0, new BigDecimal("1000.00").compareTo(oldReq.getApprovedAmount()));
        assertEquals(0, new BigDecimal("850.00").compareTo(oldReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("150.00").compareTo(oldReq.getRemainingAmount()));

        // Verify request is still available because Remaining = 150 > 0
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        assertTrue(page.getContent().stream().anyMatch(r -> r.getId().equals(erOld.getId())));
    }

    @Test
    @Order(5)
    void test4_TryToConsumeMoreThanRemaining() {
        CurrentUserContext.setCompanyId(companyId);

        // For ER-2026-0008: Remaining is 150.00. Try to create claim for 151.00.
        ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
        claimReq.setEmployeeId(EMPLOYEE_ID);
        claimReq.setClaimDate(LocalDate.now());
        claimReq.setExpenseRequestId(erOld.getId());

        ExpenseClaimItemRequest it = new ExpenseClaimItemRequest();
        it.setExpenseCategoryId(category.getId());
        it.setAmount(new BigDecimal("151.00"));
        it.setExpenseDate(LocalDate.now());
        it.setPaymentType(PaymentType.CASH);
        it.setDescription("Exceeding claim item");
        claimReq.setItems(List.of(it));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            expenseClaimService.createExpenseClaim(companyId, claimReq);
        });

        System.out.println("=== TEST 4 RESULTS ===");
        System.out.println("Expected rejection error caught: " + ex.getMessage());
        assertTrue(ex.getMessage().contains("exceeds the remaining approved amount"));

        // Database values must remain Used = 850, Remaining = 150
        ExpenseRequestResponse oldReq = expenseRequestService.getExpenseRequestById(companyId, erOld.getId());
        assertEquals(0, new BigDecimal("850.00").compareTo(oldReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("150.00").compareTo(oldReq.getRemainingAmount()));
    }

    @Test
    @Order(6)
    void test5_ConsumeExactRemainingAmount() {
        CurrentUserContext.setCompanyId(companyId);

        // Create claim for exactly remaining 150.00
        ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
        claimReq.setEmployeeId(EMPLOYEE_ID);
        claimReq.setClaimDate(LocalDate.now());
        claimReq.setExpenseRequestId(erOld.getId());

        ExpenseClaimItemRequest it = new ExpenseClaimItemRequest();
        it.setExpenseCategoryId(category.getId());
        it.setAmount(new BigDecimal("150.00"));
        it.setExpenseDate(LocalDate.now());
        it.setPaymentType(PaymentType.CASH);
        it.setDescription("Final cleaning expense");
        claimReq.setItems(List.of(it));

        ExpenseClaimResponse claimRes = expenseClaimService.createExpenseClaim(companyId, claimReq);
        assertNotNull(claimRes);

        ExpenseRequestResponse oldReq = expenseRequestService.getExpenseRequestById(companyId, erOld.getId());
        System.out.println("=== TEST 5 RESULTS ===");
        System.out.println(oldReq.getRequestNumber() + " fully consumed -> Used: ₹" + oldReq.getUsedAmount() + ", Remaining: ₹" + oldReq.getRemainingAmount());

        assertEquals(0, new BigDecimal("1000.00").compareTo(oldReq.getApprovedAmount()));
        assertEquals(0, new BigDecimal("1000.00").compareTo(oldReq.getUsedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(oldReq.getRemainingAmount()));

        // ER-2026-0008 must no longer appear in available requests list
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        boolean containsOld = page.getContent().stream().anyMatch(r -> r.getId().equals(erOld.getId()));
        assertFalse(containsOld, "ER-2026-0008 must NOT appear when remaining is 0");
        System.out.println("Verified: ER-2026-0008 is no longer selectable!");
    }

    @Test
    @Order(7)
    void test6_VerifyNewRequestStillIndependentlyAvailable() {
        CurrentUserContext.setCompanyId(companyId);

        // ER-2026-0009 must still show: Approved = 2000, Used = 0, Remaining = 2000
        ExpenseRequestResponse newReq = expenseRequestService.getExpenseRequestById(companyId, erNew.getId());
        System.out.println("=== TEST 6 RESULTS ===");
        System.out.println("Independent New Request " + newReq.getRequestNumber() + " -> Approved: ₹" + newReq.getApprovedAmount()
                + ", Used: ₹" + newReq.getUsedAmount() + ", Remaining: ₹" + newReq.getRemainingAmount());

        assertEquals(0, new BigDecimal("2000.00").compareTo(newReq.getApprovedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(newReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(newReq.getRemainingAmount()));

        // And it must appear in the available list
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        assertEquals(1, page.getContent().size());
        assertEquals(erNew.getId(), page.getContent().get(0).getId());
    }

    @Test
    @Order(8)
    void test7_PartiallyConsumeNewRequest() {
        CurrentUserContext.setCompanyId(companyId);

        // Create Claim #1 against ER-2026-0009 for 500.00
        ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
        claimReq.setEmployeeId(EMPLOYEE_ID);
        claimReq.setClaimDate(LocalDate.now());
        claimReq.setExpenseRequestId(erNew.getId());

        ExpenseClaimItemRequest it = new ExpenseClaimItemRequest();
        it.setExpenseCategoryId(category.getId());
        it.setAmount(new BigDecimal("500.00"));
        it.setExpenseDate(LocalDate.now());
        it.setPaymentType(PaymentType.CASH);
        it.setDescription("First leg diesel");
        claimReq.setItems(List.of(it));

        ExpenseClaimResponse res = expenseClaimService.createExpenseClaim(companyId, claimReq);
        assertNotNull(res);

        ExpenseRequestResponse newReq = expenseRequestService.getExpenseRequestById(companyId, erNew.getId());
        System.out.println("=== TEST 7 RESULTS ===");
        System.out.println(newReq.getRequestNumber() + " after ₹500 claim -> Used: ₹" + newReq.getUsedAmount() + ", Remaining: ₹" + newReq.getRemainingAmount());

        assertEquals(0, new BigDecimal("2000.00").compareTo(newReq.getApprovedAmount()));
        assertEquals(0, new BigDecimal("500.00").compareTo(newReq.getUsedAmount()));
        assertEquals(0, new BigDecimal("1500.00").compareTo(newReq.getRemainingAmount()));

        // Request remains available
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        assertEquals(1, page.getContent().size());
        assertEquals(erNew.getId(), page.getContent().get(0).getId());
    }

    @Test
    @Order(9)
    void test8_MultipleClaimsAgainstNewRequestUntilZero() {
        CurrentUserContext.setCompanyId(companyId);

        // Claim #2 = 700.00
        ExpenseClaimCreateRequest claimReq2 = new ExpenseClaimCreateRequest();
        claimReq2.setEmployeeId(EMPLOYEE_ID);
        claimReq2.setClaimDate(LocalDate.now());
        claimReq2.setExpenseRequestId(erNew.getId());
        ExpenseClaimItemRequest it2 = new ExpenseClaimItemRequest();
        it2.setExpenseCategoryId(category.getId());
        it2.setAmount(new BigDecimal("700.00"));
        it2.setExpenseDate(LocalDate.now());
        it2.setPaymentType(PaymentType.CASH);
        it2.setDescription("Second leg highway tolls & maintenance");
        claimReq2.setItems(List.of(it2));
        expenseClaimService.createExpenseClaim(companyId, claimReq2);

        ExpenseRequestResponse step2 = expenseRequestService.getExpenseRequestById(companyId, erNew.getId());
        assertEquals(0, new BigDecimal("1200.00").compareTo(step2.getUsedAmount()));
        assertEquals(0, new BigDecimal("800.00").compareTo(step2.getRemainingAmount()));

        // Claim #3 = 800.00
        ExpenseClaimCreateRequest claimReq3 = new ExpenseClaimCreateRequest();
        claimReq3.setEmployeeId(EMPLOYEE_ID);
        claimReq3.setClaimDate(LocalDate.now());
        claimReq3.setExpenseRequestId(erNew.getId());
        ExpenseClaimItemRequest it3 = new ExpenseClaimItemRequest();
        it3.setExpenseCategoryId(category.getId());
        it3.setAmount(new BigDecimal("800.00"));
        it3.setExpenseDate(LocalDate.now());
        it3.setPaymentType(PaymentType.CASH);
        it3.setDescription("Driver overnight lodging and loading assistance");
        claimReq3.setItems(List.of(it3));
        expenseClaimService.createExpenseClaim(companyId, claimReq3);

        ExpenseRequestResponse step3 = expenseRequestService.getExpenseRequestById(companyId, erNew.getId());
        System.out.println("=== TEST 8 RESULTS ===");
        System.out.println(step3.getRequestNumber() + " fully consumed -> Approved: ₹" + step3.getApprovedAmount()
                + ", Used: ₹" + step3.getUsedAmount() + ", Remaining: ₹" + step3.getRemainingAmount());

        assertEquals(0, new BigDecimal("2000.00").compareTo(step3.getApprovedAmount()));
        assertEquals(0, new BigDecimal("2000.00").compareTo(step3.getUsedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(step3.getRemainingAmount()));

        // Excluded once remaining is 0
        ExpenseRequestFilterDto filter = ExpenseRequestFilterDto.builder()
                .employeeDriverId(EMPLOYEE_ID)
                .status(ExpenseRequestStatus.APPROVED)
                .build();
        Page<ExpenseRequestResponse> page = expenseRequestService.getAllExpenseRequests(companyId, filter, PageRequest.of(0, 50));
        assertTrue(page.isEmpty(), "All requests consumed; available list must be empty");
    }

    @Test
    @Order(10)
    void test9_And_10_VerifyDatabaseRelationshipAndPerRequestIsolation() {
        CurrentUserContext.setCompanyId(companyId);

        // Verify claims in database have exact expense_request_id foreign key
        List<ExpenseClaim> oldClaims = expenseClaimRepository.findAll().stream()
                .filter(c -> erOld.getId().equals(c.getExpenseRequestId()))
                .toList();
        assertEquals(4, oldClaims.size()); // 100 + 500 + 250 + 150 = 1000
        BigDecimal oldTotal = oldClaims.stream().map(ExpenseClaim::getClaimAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("1000.00").compareTo(oldTotal));

        List<ExpenseClaim> newClaims = expenseClaimRepository.findAll().stream()
                .filter(c -> erNew.getId().equals(c.getExpenseRequestId()))
                .toList();
        assertEquals(3, newClaims.size()); // 500 + 700 + 800 = 2000
        BigDecimal newTotal = newClaims.stream().map(ExpenseClaim::getClaimAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, new BigDecimal("2000.00").compareTo(newTotal));

        System.out.println("=== TEST 9 & 10 RESULTS ===");
        System.out.println("ER-2026-0008 linked claims count: " + oldClaims.size() + ", sum: ₹" + oldTotal);
        System.out.println("ER-2026-0009 linked claims count: " + newClaims.size() + ", sum: ₹" + newTotal);
        System.out.println("Verified: Every claim explicitly references expenseRequestId and never confuses employee totals!");
    }
}
