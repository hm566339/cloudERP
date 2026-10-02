package com.erp.account.modules.expense.repository.report;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.expense.dto.report.*;
import com.erp.account.modules.expense.entity.*;
import com.erp.account.security.CurrentUserContext;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
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

/**
 * Integration test for ExpenseReportRepository.
 * Executes REAL HQL/JPQL queries against an H2 in-memory database.
 * No mocking of the repository — all queries run against actual persisted data.
 *
 * These tests prove:
 * 1. ₹300 + ₹400 + ₹300 = ₹1,000 (not ₹3,000 from cartesian join)
 * 2. Only FINANCE_APPROVED and PAID claims appear in financial reports
 * 3. Vehicle fleet reports correctly aggregate line items
 */
@SpringBootTest
@ActiveProfiles("h2test")
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class ExpenseReportRepositoryIntegrationTest {

    @Autowired
    private EntityManager entityManager;

    private ExpenseReportRepository reportRepository;

    private UUID companyId;
    private UUID vehicleId;
    private Company company;
    private ExpenseCategory fuelCategory;
    private ExpenseCategory travelCategory;

    @BeforeEach
    void setUp() {
        reportRepository = new ExpenseReportRepository(entityManager);

        // Set up security context (required by CustomAuditListener/BaseEntity)
        UUID userId = UUID.randomUUID();
        CurrentUserContext.setUserId(userId);
        CurrentUserContext.setCompanyId(UUID.randomUUID());
        CurrentUserContext.setUsername("testuser");

        SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("testuser", "password",
                List.of(new SimpleGrantedAuthority("ROLE_USER")))
        );

        // Create Company
        companyId = UUID.randomUUID();
        company = new Company();
        company.setId(companyId);
        company.setCompanyName("Test Company");
        company.setBaseCurrency("INR");
        company.setActive(true);
        entityManager.persist(company);

        // Create Categories
        fuelCategory = ExpenseCategory.builder()
                .company(company)
                .categoryName("Fuel Expenses")
                .categoryCode("FUEL-001")
                .isActive(true)
                .build();
        entityManager.persist(fuelCategory);

        travelCategory = ExpenseCategory.builder()
                .company(company)
                .categoryName("Travel Expenses")
                .categoryCode("TRVL-001")
                .isActive(true)
                .build();
        entityManager.persist(travelCategory);

        vehicleId = UUID.randomUUID();

        entityManager.flush();
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clearAll();
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private ExpenseRequest createExpenseRequest(UUID vId, String vehicleNumber) {
        ExpenseRequest req = ExpenseRequest.builder()
                .company(company)
                .requestNumber("ER-" + UUID.randomUUID().toString().substring(0, 6))
                .requestType(RequestType.EXPENSE_REQUEST)
                .requestDate(LocalDate.now())
                .requesterId(UUID.randomUUID())
                .employeeDriverId(UUID.randomUUID())
                .roleType(RoleType.DRIVER)
                .expenseCategory(fuelCategory)
                .requestedAmount(new BigDecimal("10000.00"))
                .status(ExpenseRequestStatus.APPROVED)
                .approvalStatus(ExpenseRequestStatus.APPROVED)
                .vehicleId(vId)
                .vehicleNumber(vehicleNumber)
                .build();
        entityManager.persist(req);
        return req;
    }

    private ExpenseClaim createClaim(UUID employeeId, BigDecimal totalAmount, ApprovalStatus status, UUID requestId) {
        ExpenseClaim claim = ExpenseClaim.builder()
                .company(company)
                .employeeId(employeeId)
                .claimNo("EC-" + UUID.randomUUID().toString().substring(0, 6))
                .claimDate(LocalDate.now())
                .claimAmount(totalAmount)
                .status(status)
                .expenseRequestId(requestId)
                .build();
        entityManager.persist(claim);
        return claim;
    }

    private ExpenseClaimItem createItem(ExpenseClaim claim, ExpenseCategory category, BigDecimal amount) {
        ExpenseClaimItem item = ExpenseClaimItem.builder()
                .company(company)
                .expenseClaim(claim)
                .expenseCategory(category)
                .expenseDate(LocalDate.now())
                .description("Test item")
                .amount(amount)
                .paymentType(PaymentType.CASH)
                .build();
        entityManager.persist(item);
        return item;
    }

    // =========================================================================
    // TEST 1: SINGLE ITEM CLAIM — ₹1,000
    // =========================================================================

    @Test
    @Order(1)
    void test_SingleItemClaim_ReportsCorrectTotal() {
        UUID empId = UUID.randomUUID();
        ExpenseRequest req = createExpenseRequest(vehicleId, "KA-01-1234");
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, req.getId());
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);

        assertEquals(0, new BigDecimal("1000.0000").compareTo(summary.getTotalRecordedExpenses()),
                "Single-item claim: expected ₹1,000 but got " + summary.getTotalRecordedExpenses());
        assertEquals(1, summary.getTotalRecordedExpenseCount());
    }

    // =========================================================================
    // TEST 2: THREE ITEMS — ₹300 + ₹400 + ₹300 = ₹1,000 (NOT ₹3,000)
    // This is the CRITICAL cartesian join bug test
    // =========================================================================

    @Test
    @Order(2)
    void test_ThreeItemClaim_NoCartesianExplosion() {
        UUID empId = UUID.randomUUID();
        ExpenseRequest req = createExpenseRequest(vehicleId, "KA-01-5678");
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, req.getId());
        createItem(claim, fuelCategory, new BigDecimal("300.0000"));
        createItem(claim, travelCategory, new BigDecimal("400.0000"));
        createItem(claim, fuelCategory, new BigDecimal("300.0000"));
        entityManager.flush();
        entityManager.clear();

        // Test via Summary (uses SUM(c.claimAmount) on claim header)
        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, new BigDecimal("1000.0000").compareTo(summary.getTotalRecordedExpenses()),
                "3-item claim summary: expected ₹1,000 but got " + summary.getTotalRecordedExpenses());

        // Test via Vehicle Fleet Report (uses SUM(i.amount) on line items)
        List<VehicleExpenseReportResponse> vehicles = reportRepository.getVehicleFleetExpenses(companyId, null);
        assertFalse(vehicles.isEmpty(), "Vehicle report should not be empty");
        VehicleExpenseReportResponse v = vehicles.get(0);
        assertEquals(0, new BigDecimal("1000.0000").compareTo(v.getTotalAmount()),
                "3-item vehicle report: expected ₹1,000 but got " + v.getTotalAmount());
        assertEquals(1, v.getVoucherCount(), "Should count 1 distinct claim");
    }

    // =========================================================================
    // TEST 3: MULTIPLE CLAIMS — Same Vehicle — ₹500 + ₹1,000 = ₹1,500
    // =========================================================================

    @Test
    @Order(3)
    void test_MultipleClaimsSameVehicle_CorrectTotal() {
        UUID empId = UUID.randomUUID();
        UUID sharedVehicle = UUID.randomUUID();

        // Claim A: 2 items = ₹500
        ExpenseRequest reqA = createExpenseRequest(sharedVehicle, "MH-12-9999");
        ExpenseClaim claimA = createClaim(empId, new BigDecimal("500.0000"), ApprovalStatus.FINANCE_APPROVED, reqA.getId());
        createItem(claimA, fuelCategory, new BigDecimal("300.0000"));
        createItem(claimA, travelCategory, new BigDecimal("200.0000"));

        // Claim B: 2 items = ₹1,000
        ExpenseRequest reqB = createExpenseRequest(sharedVehicle, "MH-12-9999");
        ExpenseClaim claimB = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.PAID, reqB.getId());
        createItem(claimB, fuelCategory, new BigDecimal("700.0000"));
        createItem(claimB, travelCategory, new BigDecimal("300.0000"));

        entityManager.flush();
        entityManager.clear();

        List<VehicleExpenseReportResponse> vehicles = reportRepository.getVehicleFleetExpenses(companyId, null);
        assertFalse(vehicles.isEmpty(), "Vehicle report should not be empty");
        VehicleExpenseReportResponse v = vehicles.get(0);
        assertEquals(0, new BigDecimal("1500.0000").compareTo(v.getTotalAmount()),
                "Two-claim vehicle report: expected ₹1,500 but got " + v.getTotalAmount());
        assertEquals(2, v.getVoucherCount(), "Should count 2 distinct claims");
    }

    // =========================================================================
    // STATUS FILTERING TESTS
    // =========================================================================

    @Test
    @Order(4)
    void test_DraftClaim_ExcludedFromReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.DRAFT, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.getTotalRecordedExpenses()),
                "DRAFT claim should NOT appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    @Test
    @Order(5)
    void test_SubmittedClaim_ExcludedFromReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.SUBMITTED, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.getTotalRecordedExpenses()),
                "SUBMITTED claim should NOT appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    @Test
    @Order(6)
    void test_FinanceApprovedClaim_IncludedInReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, new BigDecimal("1000.0000").compareTo(summary.getTotalRecordedExpenses()),
                "FINANCE_APPROVED claim MUST appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    @Test
    @Order(7)
    void test_PaidClaim_IncludedInReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.PAID, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, new BigDecimal("1000.0000").compareTo(summary.getTotalRecordedExpenses()),
                "PAID claim MUST appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    @Test
    @Order(8)
    void test_RejectedClaim_ExcludedFromReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.REJECTED, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.getTotalRecordedExpenses()),
                "REJECTED claim should NOT appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    @Test
    @Order(9)
    void test_CancelledClaim_ExcludedFromReports() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.CANCELLED, null);
        createItem(claim, fuelCategory, new BigDecimal("1000.0000"));
        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);
        assertEquals(0, BigDecimal.ZERO.compareTo(summary.getTotalRecordedExpenses()),
                "CANCELLED claim should NOT appear in financial report. Got: " + summary.getTotalRecordedExpenses());
    }

    // =========================================================================
    // CATEGORY BREAKDOWN TEST
    // =========================================================================

    @Test
    @Order(10)
    void test_CategoryBreakdown_NoDoubleCount() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, null);
        createItem(claim, fuelCategory, new BigDecimal("600.0000"));
        createItem(claim, travelCategory, new BigDecimal("400.0000"));
        entityManager.flush();
        entityManager.clear();

        List<CategoryExpenseReportResponse> breakdown = reportRepository.getCategoryBreakdown(companyId, null);
        assertFalse(breakdown.isEmpty(), "Category breakdown should not be empty");

        BigDecimal categoryTotal = breakdown.stream()
                .map(CategoryExpenseReportResponse::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, new BigDecimal("1000.0000").compareTo(categoryTotal),
                "Category breakdown total should be ₹1,000 but got " + categoryTotal);
    }

    // =========================================================================
    // STAFF/DRIVER ANALYSIS TEST
    // =========================================================================

    @Test
    @Order(11)
    void test_StaffDriverAnalysis_NoDoubleCount() {
        UUID empId = UUID.randomUUID();
        ExpenseClaim claim = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, null);
        createItem(claim, fuelCategory, new BigDecimal("300.0000"));
        createItem(claim, travelCategory, new BigDecimal("400.0000"));
        createItem(claim, fuelCategory, new BigDecimal("300.0000"));
        entityManager.flush();
        entityManager.clear();

        List<StaffDriverReportResponse> staffReport = reportRepository.getStaffDriverAnalysis(companyId, null);
        assertFalse(staffReport.isEmpty(), "Staff report should not be empty");

        BigDecimal staffTotal = staffReport.get(0).getTotalAmount();
        assertEquals(0, new BigDecimal("1000.0000").compareTo(staffTotal),
                "Staff analysis total should be ₹1,000 but got " + staffTotal);
    }

    // =========================================================================
    // MIXED STATUS TEST — Only approved/paid counts
    // =========================================================================

    @Test
    @Order(12)
    void test_MixedStatuses_OnlyApprovedAndPaidCount() {
        UUID empId = UUID.randomUUID();

        // FINANCE_APPROVED: ₹1,000
        ExpenseClaim approved = createClaim(empId, new BigDecimal("1000.0000"), ApprovalStatus.FINANCE_APPROVED, null);
        createItem(approved, fuelCategory, new BigDecimal("1000.0000"));

        // PAID: ₹2,000
        ExpenseClaim paid = createClaim(empId, new BigDecimal("2000.0000"), ApprovalStatus.PAID, null);
        createItem(paid, fuelCategory, new BigDecimal("2000.0000"));

        // DRAFT: ₹500 (should NOT count)
        ExpenseClaim draft = createClaim(empId, new BigDecimal("500.0000"), ApprovalStatus.DRAFT, null);
        createItem(draft, fuelCategory, new BigDecimal("500.0000"));

        // SUBMITTED: ₹800 (should NOT count)
        ExpenseClaim submitted = createClaim(empId, new BigDecimal("800.0000"), ApprovalStatus.SUBMITTED, null);
        createItem(submitted, fuelCategory, new BigDecimal("800.0000"));

        // REJECTED: ₹300 (should NOT count)
        ExpenseClaim rejected = createClaim(empId, new BigDecimal("300.0000"), ApprovalStatus.REJECTED, null);
        createItem(rejected, fuelCategory, new BigDecimal("300.0000"));

        // CANCELLED: ₹200 (should NOT count)
        ExpenseClaim cancelled = createClaim(empId, new BigDecimal("200.0000"), ApprovalStatus.CANCELLED, null);
        createItem(cancelled, fuelCategory, new BigDecimal("200.0000"));

        entityManager.flush();
        entityManager.clear();

        ExpenseReportSummaryResponse summary = reportRepository.getSummary(companyId, null);

        // Only FINANCE_APPROVED (₹1,000) + PAID (₹2,000) = ₹3,000
        assertEquals(0, new BigDecimal("3000.0000").compareTo(summary.getTotalRecordedExpenses()),
                "Mixed statuses: expected ₹3,000 (only approved+paid) but got " + summary.getTotalRecordedExpenses());
        assertEquals(2, summary.getTotalRecordedExpenseCount(),
                "Expected 2 claims (approved+paid) but got " + summary.getTotalRecordedExpenseCount());
    }
}
