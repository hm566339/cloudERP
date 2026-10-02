package com.erp.account.modules.expense.service.impl;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.ReimbursementStatus;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.dto.*;
import com.erp.account.modules.expense.dto.report.ExpenseReportFilterRequest;
import com.erp.account.modules.expense.dto.report.ExpenseReportSummaryResponse;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.Reimbursement;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.expense.repository.ReimbursementRepository;
import com.erp.account.modules.expense.repository.report.ExpenseReportRepository;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.modules.expense.service.ReimbursementService;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
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
public class ReimbursementWorkflowIntegrationTest {

    @Autowired
    private ExpenseClaimService expenseClaimService;

    @Autowired
    private ReimbursementService reimbursementService;

    @Autowired
    private ReimbursementRepository reimbursementRepository;

    @Autowired
    private ExpenseReportRepository expenseReportRepository;

    @Autowired
    private ExpenseCategoryRepository expenseCategoryRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private ChartOfAccountRepository chartOfAccountRepository;

    @Autowired
    private com.erp.account.modules.fiscalyear.repository.FiscalYearRepository fiscalYearRepository;

    @Autowired
    private com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository accountingPeriodRepository;

    @Autowired
    private com.erp.account.modules.accountcategory.repository.AccountCategoryRepository accountCategoryRepository;

    @Autowired
    private com.erp.account.modules.accountgroup.repository.AccountGroupRepository accountGroupRepository;

    private static final UUID COMPANY_ID = UUID.fromString("11111111-2222-3333-4444-555555555555");
    private static final UUID EMPLOYEE_ID = UUID.fromString("66666666-7777-8888-9999-000000000000");

    private static ExpenseCategory category;
    private static ChartOfAccount employeePayableAccount;
    private static ChartOfAccount bankAccount;
    private static ChartOfAccount expenseAccount;

    private static UUID selfPaidClaimId;
    private static UUID companyPaidClaimId;
    private static UUID mixedClaimId;
    private static UUID mixedReimbursementId;

    @BeforeEach
    void setupSecurityContext() {
        CurrentUserContext.setUserId(EMPLOYEE_ID);
        CurrentUserContext.setUsername("mohit_kumar");
        CurrentUserContext.setUserFullName("Mohit Kumar");
        CurrentUserContext.setUserRole("EMPLOYEE");
        CurrentUserContext.setCompanyId(COMPANY_ID);

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                EMPLOYEE_ID.toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @Order(1)
    void setupPrerequisites() {
        Company company = new Company();
        company.setId(COMPANY_ID);
        company.setCompanyName("Logistics Corp");
        company.setBaseCurrency("INR");
        company.setActive(true);
        companyRepository.saveAndFlush(company);

        com.erp.account.modules.fiscalyear.entity.FiscalYear fy = com.erp.account.modules.fiscalyear.entity.FiscalYear.builder()
                .company(company)
                .fiscalYear("2026-2027")
                .startDate(LocalDate.of(2026, 4, 1))
                .endDate(LocalDate.of(2027, 3, 31))
                .status(com.erp.account.modules.fiscalyear.enums.FiscalYearStatus.OPEN)
                .build();
        fiscalYearRepository.saveAndFlush(fy);

        com.erp.account.modules.accountingperiod.entity.AccountingPeriod ap = com.erp.account.modules.accountingperiod.entity.AccountingPeriod.builder()
                .company(company)
                .fiscalYear(fy)
                .periodName("Sep-2026")
                .periodNumber(6)
                .startDate(LocalDate.of(2026, 9, 1))
                .endDate(LocalDate.of(2026, 9, 30))
                .status(com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.OPEN)
                .build();
        accountingPeriodRepository.saveAndFlush(ap);

        com.erp.account.modules.accountcategory.entity.AccountCategory ac = com.erp.account.modules.accountcategory.entity.AccountCategory.builder()
                .company(company)
                .code("GEN-CAT")
                .name("General Category")
                .nature(com.erp.account.enums.AccountNature.DEBIT)
                .build();
        accountCategoryRepository.saveAndFlush(ac);

        com.erp.account.modules.accountgroup.entity.AccountGroup ag = com.erp.account.modules.accountgroup.entity.AccountGroup.builder()
                .company(company)
                .category(ac)
                .code("GEN-GRP")
                .name("General Group")
                .build();
        accountGroupRepository.saveAndFlush(ag);

        // Chart of accounts
        expenseAccount = ChartOfAccount.builder()
                .company(company)
                .group(ag)
                .accountCode("500007")
                .accountName("Miscellaneous Expense")
                .accountType(com.erp.account.enums.AccountNature.DEBIT)
                .isActive(true)
                .postingAllowed(true)
                .build();
        chartOfAccountRepository.saveAndFlush(expenseAccount);

        employeePayableAccount = ChartOfAccount.builder()
                .company(company)
                .group(ag)
                .accountCode("200007")
                .accountName("Trade Payables")
                .accountType(com.erp.account.enums.AccountNature.CREDIT)
                .isActive(true)
                .postingAllowed(true)
                .build();
        chartOfAccountRepository.saveAndFlush(employeePayableAccount);

        bankAccount = ChartOfAccount.builder()
                .company(company)
                .group(ag)
                .accountCode("100008")
                .accountName("HDFC Bank")
                .accountType(com.erp.account.enums.AccountNature.DEBIT)
                .isActive(true)
                .postingAllowed(true)
                .build();
        chartOfAccountRepository.saveAndFlush(bankAccount);

        category = ExpenseCategory.builder()
                .company(company)
                .categoryName("Fuel & Maintenance")
                .categoryCode("EXP-FUEL")
                .expenseAccount(expenseAccount)
                .isActive(true)
                .build();
        category = expenseCategoryRepository.saveAndFlush(category);
    }

    @Test
    @Order(2)
    void test1_ApprovedSelfPaidExpense_CreatesReimbursement() {
        // Create claim with CASH (self-paid) item of ?1000
        ExpenseClaimItemRequest item = ExpenseClaimItemRequest.builder()
                .expenseCategoryId(category.getId())
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("1000.00"))
                .paymentType(PaymentType.CASH)
                .description("Fuel Cash Payment")
                .build();

        ExpenseClaimCreateRequest request = ExpenseClaimCreateRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .employeeName("Mohit Kumar")
                .employeeRole("STAFF")
                .claimDate(LocalDate.now())
                .items(List.of(item))
                .build();

        ExpenseClaimResponse created = expenseClaimService.createExpenseClaim(COMPANY_ID, request);
        assertNotNull(created);
        selfPaidClaimId = created.getId();

        // Submit claim
        expenseClaimService.submitExpenseClaim(COMPANY_ID, selfPaidClaimId);

        // Approve claim
        ExpenseClaimApproveRequest approveReq = ExpenseClaimApproveRequest.builder()
                .employeePayableAccountId(employeePayableAccount.getId())
                .bankOrCashAccountId(bankAccount.getId())
                .notes("Approved fuel claim")
                .build();

        ExpenseClaimResponse approved = expenseClaimService.approveExpenseClaim(COMPANY_ID, selfPaidClaimId, approveReq);
        assertEquals(ApprovalStatus.FINANCE_APPROVED, approved.getStatus());

        // Verify Reimbursement record is automatically created in SUBMITTED (Pending Approval) status
        List<Reimbursement> reimbursements = reimbursementRepository
                .findByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(selfPaidClaimId, COMPANY_ID);
        assertEquals(1, reimbursements.size(), "Exactly 1 reimbursement should be auto-generated");

        Reimbursement rmb = reimbursements.get(0);
        assertEquals(new BigDecimal("1000.0000"), rmb.getReimbursementAmount());
        assertEquals(ReimbursementStatus.SUBMITTED, rmb.getStatus());
        assertEquals(EMPLOYEE_ID, rmb.getEmployeeId());
        assertTrue(rmb.getReimbursementNo().startsWith("RMB-"));
    }

    @Test
    @Order(3)
    void test2_CompanyPaidExpense_DoesNotCreateReimbursement() {
        long countBefore = reimbursementRepository.count();

        // Create claim with CARD (company-paid) item of ?500
        ExpenseClaimItemRequest item = ExpenseClaimItemRequest.builder()
                .expenseCategoryId(category.getId())
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("500.00"))
                .paymentType(PaymentType.CARD)
                .description("Company Card Hotel Payment")
                .build();

        ExpenseClaimCreateRequest request = ExpenseClaimCreateRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .employeeName("Mohit Kumar")
                .employeeRole("STAFF")
                .claimDate(LocalDate.now())
                .items(List.of(item))
                .build();

        ExpenseClaimResponse created = expenseClaimService.createExpenseClaim(COMPANY_ID, request);
        companyPaidClaimId = created.getId();

        expenseClaimService.submitExpenseClaim(COMPANY_ID, companyPaidClaimId);

        ExpenseClaimApproveRequest approveReq = ExpenseClaimApproveRequest.builder()
                .employeePayableAccountId(employeePayableAccount.getId())
                .bankOrCashAccountId(bankAccount.getId())
                .notes("Approved card claim")
                .build();

        expenseClaimService.approveExpenseClaim(COMPANY_ID, companyPaidClaimId, approveReq);

        // Verify NO new reimbursement was created because it is company-paid
        long countAfter = reimbursementRepository.count();
        assertEquals(countBefore, countAfter, "Company-paid expense must NOT create a reimbursement");

        List<Reimbursement> rmbList = reimbursementRepository
                .findByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(companyPaidClaimId, COMPANY_ID);
        assertTrue(rmbList.isEmpty());
    }

    @Test
    @Order(4)
    void test3_RepeatedApproval_DoesNotCreateDuplicateReimbursement() {
        // Test idempotency: verify existing reimbursement count for selfPaidClaimId is exactly 1
        List<Reimbursement> rmbList = reimbursementRepository
                .findByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(selfPaidClaimId, COMPANY_ID);
        assertEquals(1, rmbList.size(), "Idempotency check: exactly 1 reimbursement must exist");

        // Verify that existence check blocks duplicate creation
        boolean exists = reimbursementRepository
                .existsByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(selfPaidClaimId, COMPANY_ID);
        assertTrue(exists);
    }

    @Test
    @Order(5)
    void test4_ReimbursementAmountEqualsApprovedEmployeePayableAmount() {
        // Mixed claim: ?700 CASH (self-paid) + ?300 BANK (company-paid) = Total ?1000
        ExpenseClaimItemRequest item1 = ExpenseClaimItemRequest.builder()
                .expenseCategoryId(category.getId())
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("700.00"))
                .paymentType(PaymentType.CASH)
                .description("Out of pocket tolls")
                .build();

        ExpenseClaimItemRequest item2 = ExpenseClaimItemRequest.builder()
                .expenseCategoryId(category.getId())
                .expenseDate(LocalDate.now())
                .amount(new BigDecimal("300.00"))
                .paymentType(PaymentType.BANK)
                .description("Company bank transfer")
                .build();

        ExpenseClaimCreateRequest request = ExpenseClaimCreateRequest.builder()
                .employeeId(EMPLOYEE_ID)
                .employeeName("Mohit Kumar")
                .employeeRole("STAFF")
                .claimDate(LocalDate.now())
                .items(List.of(item1, item2))
                .build();

        ExpenseClaimResponse created = expenseClaimService.createExpenseClaim(COMPANY_ID, request);
        mixedClaimId = created.getId();

        expenseClaimService.submitExpenseClaim(COMPANY_ID, mixedClaimId);

        ExpenseClaimApproveRequest approveReq = ExpenseClaimApproveRequest.builder()
                .employeePayableAccountId(employeePayableAccount.getId())
                .bankOrCashAccountId(bankAccount.getId())
                .notes("Approved mixed claim")
                .build();

        expenseClaimService.approveExpenseClaim(COMPANY_ID, mixedClaimId, approveReq);

        // Verify reimbursement amount equals ONLY the self-paid portion (?700, NOT ?1000)
        List<Reimbursement> rmbList = reimbursementRepository
                .findByExpenseClaimIdAndCompanyIdAndIsDeletedFalse(mixedClaimId, COMPANY_ID);
        assertEquals(1, rmbList.size());

        Reimbursement rmb = rmbList.get(0);
        mixedReimbursementId = rmb.getId();
        assertEquals(new BigDecimal("700.0000"), rmb.getReimbursementAmount(),
                "Reimbursement amount must equal the approved employee self-paid amount (?700)");
    }

    @Test
    @Order(6)
    void test5_ReimbursementLifecycle_PendingToApproved() {
        // Retrieve reimbursement response via service and verify balance fields
        ReimbursementResponse res = reimbursementService.getReimbursementById(COMPANY_ID, mixedReimbursementId);
        assertNotNull(res);
        assertEquals("Mohit Kumar", res.getEmployeeName());
        assertEquals("STAFF", res.getEmployeeRole());
        assertEquals(ReimbursementStatus.SUBMITTED, res.getStatus());
        assertEquals(BigDecimal.ZERO, res.getReimbursedAmount(), "Reimbursed amount should be 0 while pending");
        assertEquals(new BigDecimal("700.0000"), res.getBalanceDue(), "Balance due should be 700 while pending");

        // Finance Approves the reimbursement
        ReimbursementApproveRequest approveReq = new ReimbursementApproveRequest();
        approveReq.setNotes("Approved for disbursal");
        ReimbursementResponse approved = reimbursementService.approveReimbursement(COMPANY_ID, mixedReimbursementId, approveReq);
        assertEquals(ReimbursementStatus.APPROVED, approved.getStatus());
        assertEquals(BigDecimal.ZERO, approved.getReimbursedAmount());
        assertEquals(new BigDecimal("700.0000"), approved.getBalanceDue());
    }

    @Test
    @Order(7)
    void test6_ReimbursementPayment_FullSettlementAndAccountingEntry() {
        // Finance pays the approved reimbursement
        ReimbursementPayRequest payReq = new ReimbursementPayRequest();
        payReq.setPaymentMethod(PaymentMode.BANK_TRANSFER);
        payReq.setPaymentDate(LocalDate.now());
        payReq.setPaymentReference("UTR-9988776655");
        payReq.setEmployeePayableAccountId(employeePayableAccount.getId());
        payReq.setBankOrCashAccountId(bankAccount.getId());

        ReimbursementResponse paid = reimbursementService.payReimbursement(COMPANY_ID, mixedReimbursementId, payReq);
        assertEquals(ReimbursementStatus.PAID, paid.getStatus());
        assertEquals(new BigDecimal("700.0000"), paid.getReimbursedAmount(), "Reimbursed amount should be 700 after payment");
        assertEquals(BigDecimal.ZERO, paid.getBalanceDue(), "Balance due should be 0 after full reimbursement");
    }

    @Test
    @Order(8)
    void test7_SettledReimbursementAppearsInReportsSettledTotal() {
        ExpenseReportFilterRequest filter = new ExpenseReportFilterRequest();
        ExpenseReportSummaryResponse summary = expenseReportRepository.getSummary(COMPANY_ID, filter);

        assertNotNull(summary);
        // The settled reimbursement (?700) must appear in totalReimbbursementsSettled
        assertEquals(new BigDecimal("700.0000"), summary.getTotalReimbursementsSettled(),
                "Total Reimbursements Settled must reflect the settled ?700");
    }

    @Test
    @Order(9)
    void test8_PendingReimbursementAppearsInReportsPendingDue() {
        ExpenseReportFilterRequest filter = new ExpenseReportFilterRequest();
        ExpenseReportSummaryResponse summary = expenseReportRepository.getSummary(COMPANY_ID, filter);

        // Total eligible claims = ?1000 (Claim 1) + ?500 (Claim 2) + ?1000 (Claim 3) = ?2500
        // Settled reimbursements = ?700
        // Pending due = ?2500 - ?700 = ?1800
        assertEquals(new BigDecimal("1800.0000"), summary.getPendingReimbursementDue(),
                "Pending reimbursement due should reflect total eligible claims minus settled reimbursements");
    }

    @Test
    @Order(10)
    void test9_ReimbursementPageApiReturnsCreatedRecord() {
        ReimbursementFilterRequest filter = new ReimbursementFilterRequest();
        Page<ReimbursementResponse> page = reimbursementService.getAllReimbursements(COMPANY_ID, filter, PageRequest.of(0, 10));

        assertNotNull(page);
        assertTrue(page.getTotalElements() >= 2, "Should return the auto-created reimbursements");

        // Verify that Mohit Kumar's details and claim associations are populated
        boolean foundPaid = false;
        boolean foundSubmitted = false;
        for (ReimbursementResponse rmb : page.getContent()) {
            assertEquals("Mohit Kumar", rmb.getEmployeeName());
            assertNotNull(rmb.getExpenseClaimNo());
            if (rmb.getStatus() == ReimbursementStatus.PAID) {
                foundPaid = true;
                assertEquals(new BigDecimal("700.0000"), rmb.getReimbursedAmount());
                assertEquals(BigDecimal.ZERO, rmb.getBalanceDue());
            } else if (rmb.getStatus() == ReimbursementStatus.SUBMITTED) {
                foundSubmitted = true;
                assertEquals(BigDecimal.ZERO, rmb.getReimbursedAmount());
                assertEquals(new BigDecimal("1000.0000"), rmb.getBalanceDue());
            }
        }
        assertTrue(foundPaid, "Should find the settled reimbursement");
        assertTrue(foundSubmitted, "Should find the pending reimbursement");
    }

    @Test
    @Order(11)
    void test10_ReportsAndReimbursementsConsistency() {
        ExpenseReportFilterRequest filter = new ExpenseReportFilterRequest();
        ExpenseReportSummaryResponse summary = expenseReportRepository.getSummary(COMPANY_ID, filter);

        ReimbursementFilterRequest rmbFilter = new ReimbursementFilterRequest();
        Page<ReimbursementResponse> page = reimbursementService.getAllReimbursements(COMPANY_ID, rmbFilter, PageRequest.of(0, 50));

        BigDecimal sumReimbursed = page.getContent().stream()
                .map(ReimbursementResponse::getReimbursedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(summary.getTotalReimbursementsSettled(), sumReimbursed,
                "Reports Total Reimbursements Settled must exactly match sum of Reimbursements page Reimbursed amounts");
    }
}
