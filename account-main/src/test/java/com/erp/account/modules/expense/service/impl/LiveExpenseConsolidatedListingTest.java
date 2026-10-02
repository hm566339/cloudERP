package com.erp.account.modules.expense.service.impl;

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
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
public class LiveExpenseConsolidatedListingTest {

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

    private static final UUID EMPLOYEE_A = UUID.fromString("5db8c957-26a0-452b-b63d-26c656ce1012");
    private static final UUID EMPLOYEE_B = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static final UUID EMPLOYEE_C_ZERO = UUID.fromString("11111111-2222-3333-4444-555555555555");

    private static UUID companyId;
    private static ExpenseCategory travelCategory;
    private static ExpenseRequest er2026_0008;
    private static ExpenseRequest er2026_0010;

    @BeforeEach
    void setUpSecurity() {
        CurrentUserContext.setUserId(EMPLOYEE_A);
        CurrentUserContext.setUsername("rahul_kumar");
        CurrentUserContext.setUserFullName("Rahul Kumar");
        CurrentUserContext.setUserRole("FINANCE_MANAGER");

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                EMPLOYEE_A.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_FINANCE_MANAGER"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @Order(1)
    void setupCompanyAndCategories() {
        companyId = UUID.randomUUID();
        CurrentUserContext.setCompanyId(companyId);

        Company comp = new Company();
        comp.setId(companyId);
        comp.setCompanyName("Logistics Corp");
        comp.setBaseCurrency("INR");
        comp.setActive(true);
        Company company = companyRepository.saveAndFlush(comp);

        travelCategory = ExpenseCategory.builder()
                .company(company)
                .categoryName("Travel Expenses")
                .categoryCode("EXP-TRV")
                .isActive(true)
                .build();
        travelCategory = expenseCategoryRepository.saveAndFlush(travelCategory);
    }

    @Test
    @Order(2)
    void testConsolidationMatchingPromptActualExample() {
        CurrentUserContext.setCompanyId(companyId);
        Company company = companyRepository.findById(companyId).orElseThrow();

        // 1. Request ER-2026-0008: Approved 1000, description: khana
        er2026_0008 = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-2026-0008")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(EMPLOYEE_A)
                .employeeDriverId(EMPLOYEE_A)
                .employeeName("Rahul Kumar")
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(travelCategory)
                .requestedAmount(new BigDecimal("1000.00"))
                .approvedAmount(new BigDecimal("1000.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("khana")
                .build();
        er2026_0008 = expenseRequestRepository.saveAndFlush(er2026_0008);

        // Claim of 600 against ER-2026-0008
        ExpenseClaimCreateRequest claim1 = new ExpenseClaimCreateRequest();
        claim1.setEmployeeId(EMPLOYEE_A);
        claim1.setEmployeeName("Rahul Kumar");
        claim1.setEmployeeRole("FINANCE_MANAGER");
        claim1.setClaimDate(LocalDate.now());
        claim1.setExpenseRequestId(er2026_0008.getId());
        ExpenseClaimItemRequest it1 = new ExpenseClaimItemRequest();
        it1.setExpenseCategoryId(travelCategory.getId());
        it1.setAmount(new BigDecimal("600.00"));
        it1.setExpenseDate(LocalDate.now());
        it1.setPaymentType(PaymentType.CASH);
        it1.setDescription("Meal voucher");
        claim1.setItems(List.of(it1));
        expenseClaimService.createExpenseClaim(companyId, claim1);

        // 2. Request ER-2026-0010: Approved 200, Used 0, Remaining 200, description: pani
        er2026_0010 = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-2026-0010")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(EMPLOYEE_A)
                .employeeDriverId(EMPLOYEE_A)
                .employeeName("Rahul Kumar")
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(travelCategory)
                .requestedAmount(new BigDecimal("200.00"))
                .approvedAmount(new BigDecimal("200.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("pani")
                .build();
        er2026_0010 = expenseRequestRepository.saveAndFlush(er2026_0010);

        // Call getConsolidatedEmployeeExpenseBalances
        List<EmployeeExpenseBalanceResponse> balances = expenseRequestService.getConsolidatedEmployeeExpenseBalances(companyId, EMPLOYEE_A);

        assertNotNull(balances);
        assertEquals(1, balances.size(), "Should return exactly ONE consolidated record for Rahul Kumar");

        EmployeeExpenseBalanceResponse rahul = balances.get(0);
        assertEquals(EMPLOYEE_A, rahul.getEmployeeId());
        assertEquals("Rahul Kumar", rahul.getEmployeeName());
        assertEquals("FINANCE_MANAGER", rahul.getRole());
        assertEquals(0, new BigDecimal("1200.00").compareTo(rahul.getTotalApprovedAmount()), "Total Approved should be 1200");
        assertEquals(0, new BigDecimal("600.00").compareTo(rahul.getTotalUsedAmount()), "Total Used should be 600");
        assertEquals(0, new BigDecimal("600.00").compareTo(rahul.getTotalRemainingAmount()), "Total Remaining should be 600");

        assertEquals(2, rahul.getRequests().size(), "Should contain exactly 2 requests");

        EmployeeExpenseRequestDetail req1 = rahul.getRequests().stream()
                .filter(r -> "ER-2026-0008".equals(r.getRequestNumber()))
                .findFirst().orElseThrow();
        assertEquals(er2026_0008.getId(), req1.getExpenseRequestId());
        assertEquals("Travel Expenses", req1.getCategoryName());
        assertEquals("khana", req1.getDescription());
        assertEquals(0, new BigDecimal("1000.00").compareTo(req1.getApprovedAmount()));
        assertEquals(0, new BigDecimal("600.00").compareTo(req1.getUsedAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(req1.getRemainingAmount()));

        EmployeeExpenseRequestDetail req2 = rahul.getRequests().stream()
                .filter(r -> "ER-2026-0010".equals(r.getRequestNumber()))
                .findFirst().orElseThrow();
        assertEquals(er2026_0010.getId(), req2.getExpenseRequestId());
        assertEquals("Travel Expenses", req2.getCategoryName());
        assertEquals("pani", req2.getDescription());
        assertEquals(0, new BigDecimal("200.00").compareTo(req2.getApprovedAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(req2.getUsedAmount()));
        assertEquals(0, new BigDecimal("200.00").compareTo(req2.getRemainingAmount()));
    }

    @Test
    @Order(3)
    void testMultipleEmployeesAndZeroRemainingExclusion() {
        CurrentUserContext.setCompanyId(companyId);
        Company company = companyRepository.findById(companyId).orElseThrow();

        // Setup Employee B with 1 request: Approved 500, Used 100, Remaining 400
        ExpenseRequest erB = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-B-0001")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(EMPLOYEE_B)
                .employeeDriverId(EMPLOYEE_B)
                .employeeName("Driver Bob")
                .roleType(RoleType.DRIVER)
                .expenseCategory(travelCategory)
                .requestedAmount(new BigDecimal("500.00"))
                .approvedAmount(new BigDecimal("500.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("Fuel allowance")
                .build();
        erB = expenseRequestRepository.saveAndFlush(erB);

        ExpenseClaimCreateRequest claimB = new ExpenseClaimCreateRequest();
        claimB.setEmployeeId(EMPLOYEE_B);
        claimB.setEmployeeName("Driver Bob");
        claimB.setEmployeeRole("DRIVER");
        claimB.setClaimDate(LocalDate.now());
        claimB.setExpenseRequestId(erB.getId());
        ExpenseClaimItemRequest itB = new ExpenseClaimItemRequest();
        itB.setExpenseCategoryId(travelCategory.getId());
        itB.setAmount(new BigDecimal("100.00"));
        itB.setExpenseDate(LocalDate.now());
        itB.setPaymentType(PaymentType.CASH);
        itB.setDescription("Diesel fill");
        claimB.setItems(List.of(itB));
        expenseClaimService.createExpenseClaim(companyId, claimB);

        // Setup Employee C (Zero remaining): Approved 300, Used 300, Remaining 0
        ExpenseRequest erC = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-C-0001")
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(EMPLOYEE_C_ZERO)
                .employeeDriverId(EMPLOYEE_C_ZERO)
                .employeeName("Staff Charlie")
                .roleType(RoleType.EMPLOYEE)
                .expenseCategory(travelCategory)
                .requestedAmount(new BigDecimal("300.00"))
                .approvedAmount(new BigDecimal("300.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .purposeDescription("Stationery purchase")
                .build();
        erC = expenseRequestRepository.saveAndFlush(erC);

        ExpenseClaimCreateRequest claimC = new ExpenseClaimCreateRequest();
        claimC.setEmployeeId(EMPLOYEE_C_ZERO);
        claimC.setEmployeeName("Staff Charlie");
        claimC.setEmployeeRole("EMPLOYEE");
        claimC.setClaimDate(LocalDate.now());
        claimC.setExpenseRequestId(erC.getId());
        ExpenseClaimItemRequest itC = new ExpenseClaimItemRequest();
        itC.setExpenseCategoryId(travelCategory.getId());
        itC.setAmount(new BigDecimal("300.00"));
        itC.setExpenseDate(LocalDate.now());
        itC.setPaymentType(PaymentType.CASH);
        itC.setDescription("All stationery bought");
        claimC.setItems(List.of(itC));
        expenseClaimService.createExpenseClaim(companyId, claimC);

        // Query all employee balances
        List<EmployeeExpenseBalanceResponse> allBalances = expenseRequestService.getConsolidatedEmployeeExpenseBalances(companyId, null);

        // Assert Employee A and Employee B are present, but Employee C is EXCLUDED
        assertEquals(2, allBalances.size(), "Only Employee A and Employee B should be returned, Employee C has 0 remaining");

        boolean hasEmpA = allBalances.stream().anyMatch(b -> EMPLOYEE_A.equals(b.getEmployeeId()));
        boolean hasEmpB = allBalances.stream().anyMatch(b -> EMPLOYEE_B.equals(b.getEmployeeId()));
        boolean hasEmpC = allBalances.stream().anyMatch(b -> EMPLOYEE_C_ZERO.equals(b.getEmployeeId()));

        assertTrue(hasEmpA, "Employee A should be present");
        assertTrue(hasEmpB, "Employee B should be present");
        assertFalse(hasEmpC, "Employee C with 0 remaining balance must NOT appear in available list");

        EmployeeExpenseBalanceResponse bob = allBalances.stream()
                .filter(b -> EMPLOYEE_B.equals(b.getEmployeeId()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("500.00").compareTo(bob.getTotalApprovedAmount()));
        assertEquals(0, new BigDecimal("100.00").compareTo(bob.getTotalUsedAmount()));
        assertEquals(0, new BigDecimal("400.00").compareTo(bob.getTotalRemainingAmount()));
        assertEquals(1, bob.getRequests().size());
    }

    @Test
    @Order(4)
    void testClaimLinkingUpdatesConsolidatedBalanceDynamically() {
        CurrentUserContext.setCompanyId(companyId);

        // Create an additional claim of 250 against ER-2026-0008 (which had 400 remaining)
        ExpenseClaimCreateRequest newClaim = new ExpenseClaimCreateRequest();
        newClaim.setEmployeeId(EMPLOYEE_A);
        newClaim.setEmployeeName("Rahul Kumar");
        newClaim.setEmployeeRole("FINANCE_MANAGER");
        newClaim.setClaimDate(LocalDate.now());
        newClaim.setExpenseRequestId(er2026_0008.getId());
        ExpenseClaimItemRequest it = new ExpenseClaimItemRequest();
        it.setExpenseCategoryId(travelCategory.getId());
        it.setAmount(new BigDecimal("250.00"));
        it.setExpenseDate(LocalDate.now());
        it.setPaymentType(PaymentType.CASH);
        it.setDescription("Dinner claim");
        newClaim.setItems(List.of(it));
        expenseClaimService.createExpenseClaim(companyId, newClaim);

        // Now verify consolidated balances for Employee A:
        // Approved: 1000 + 200 = 1200
        // Used: 600 + 250 = 850
        // Remaining: 1200 - 850 = 350
        // ER-2026-0008 remaining: 150
        // ER-2026-0010 remaining: 200
        List<EmployeeExpenseBalanceResponse> balances = expenseRequestService.getConsolidatedEmployeeExpenseBalances(companyId, EMPLOYEE_A);
        assertEquals(1, balances.size());

        EmployeeExpenseBalanceResponse rahul = balances.get(0);
        assertEquals(0, new BigDecimal("1200.00").compareTo(rahul.getTotalApprovedAmount()));
        assertEquals(0, new BigDecimal("850.00").compareTo(rahul.getTotalUsedAmount()));
        assertEquals(0, new BigDecimal("350.00").compareTo(rahul.getTotalRemainingAmount()));

        EmployeeExpenseRequestDetail req1 = rahul.getRequests().stream()
                .filter(r -> "ER-2026-0008".equals(r.getRequestNumber()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("150.00").compareTo(req1.getRemainingAmount()));
        assertEquals(0, new BigDecimal("850.00").compareTo(req1.getUsedAmount()));

        EmployeeExpenseRequestDetail req2 = rahul.getRequests().stream()
                .filter(r -> "ER-2026-0010".equals(r.getRequestNumber()))
                .findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("200.00").compareTo(req2.getRemainingAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(req2.getUsedAmount()));
    }
}
