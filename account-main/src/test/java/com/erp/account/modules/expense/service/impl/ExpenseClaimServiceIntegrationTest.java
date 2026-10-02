package com.erp.account.modules.expense.service.impl;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.RequestType;
import com.erp.account.enums.RoleType;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.expense.dto.ExpenseClaimApproveRequest;
import com.erp.account.modules.expense.dto.ExpenseClaimCreateRequest;
import com.erp.account.modules.expense.dto.ExpenseClaimItemRequest;
import com.erp.account.modules.expense.dto.ExpenseClaimResponse;
import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimRepository;
import com.erp.account.modules.expense.repository.ExpenseClaimItemRepository;
import com.erp.account.modules.expense.entity.ExpenseClaimItem;
import com.erp.account.modules.expense.service.ExpenseClaimService;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.repository.ExpenseCategoryRepository;
import com.erp.account.modules.fiscalyear.repository.FiscalYearRepository;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.accountcategory.repository.AccountCategoryRepository;
import com.erp.account.modules.accountgroup.repository.AccountGroupRepository;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.accountingperiod.repository.AccountingPeriodRepository;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import com.erp.account.modules.accountgroup.entity.AccountGroup;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.enums.AccountNature;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.modules.expense.repository.report.ExpenseReportRepository;
import com.erp.account.modules.expense.dto.report.ExpenseReportFilterRequest;
import com.erp.account.modules.expense.dto.report.VehicleExpenseReportResponse;
import com.erp.account.modules.expense.dto.ExpenseClaimRejectRequest;
import com.erp.account.modules.expense.entity.ExpenseClaim;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2test")
public class ExpenseClaimServiceIntegrationTest {

        @Autowired
        private ExpenseClaimService expenseClaimService;

        @Autowired
        private ExpenseRequestRepository expenseRequestRepository;

        @Autowired
        private ExpenseClaimRepository expenseClaimRepository;

        @Autowired
        private ExpenseClaimItemRepository expenseClaimItemRepository;

        @Autowired
        private GlJournalEntryRepository glJournalEntryRepository;

        @Autowired
        private CompanyRepository companyRepository;

        @Autowired
        private ExpenseCategoryRepository expenseCategoryRepository;

        @Autowired
        private FiscalYearRepository fiscalYearRepository;

        @Autowired
        private AccountingPeriodRepository accountingPeriodRepository;

        @Autowired
        private AccountCategoryRepository accountCategoryRepository;

        @Autowired
        private AccountGroupRepository accountGroupRepository;

        @Autowired
        private ChartOfAccountRepository chartOfAccountRepository;

        @Autowired
        private ExpenseReportRepository expenseReportRepository;

        @Autowired
        private JdbcTemplate jdbcTemplate;

        private UUID companyId;
        private Company company;
        private ExpenseCategory category;
        private UUID employeeId;
        private UUID creditAccountId;
        private UUID debitAccountId;

        @BeforeEach
        void setUp() {
                companyId = UUID.randomUUID();
                employeeId = UUID.randomUUID();

                CurrentUserContext.setUserId(employeeId);
                CurrentUserContext.setCompanyId(companyId);
                CurrentUserContext.setUsername("testuser");

                SecurityContextHolder.setContext(SecurityContextHolder.createEmptyContext());
                SecurityContextHolder.getContext().setAuthentication(
                                new UsernamePasswordAuthenticationToken("testuser", "password",
                                                List.of(new SimpleGrantedAuthority("ROLE_USER"))));

                company = new Company();
                company.setId(UUID.randomUUID());
                company.setCompanyName("Test Company " + UUID.randomUUID().toString());
                company.setBaseCurrency("INR");
                company.setActive(true);
                company = companyRepository.saveAndFlush(company);
                companyId = company.getId();

                // Update user context with new companyId
                CurrentUserContext.setCompanyId(companyId);

                category = ExpenseCategory.builder()
                                .company(company)
                                .categoryName("Test Category")
                                .categoryCode("TC-01")
                                .isActive(true)
                                .build();
                category = expenseCategoryRepository.saveAndFlush(category);

                FiscalYear fy = FiscalYear.builder()
                                .company(company)
                                .fiscalYear("2026-2027")
                                .startDate(LocalDate.of(2026, 4, 1))
                                .endDate(LocalDate.of(2027, 3, 31))
                                .status(com.erp.account.modules.fiscalyear.enums.FiscalYearStatus.OPEN)
                                .build();
                fiscalYearRepository.saveAndFlush(fy);

                AccountingPeriod ap = AccountingPeriod.builder()
                                .company(company)
                                .fiscalYear(fy)
                                .periodName("Sep-2026")
                                .periodNumber(6)
                                .startDate(LocalDate.of(2026, 9, 1))
                                .endDate(LocalDate.of(2026, 9, 30))
                                .status(com.erp.account.modules.accountingperiod.enums.AccountingPeriodStatus.OPEN)
                                .build();
                accountingPeriodRepository.saveAndFlush(ap);

                AccountCategory ac = AccountCategory.builder()
                                .company(company)
                                .code("EXP-CAT")
                                .name("Expense Category")
                                .nature(AccountNature.DEBIT)
                                .build();
                accountCategoryRepository.saveAndFlush(ac);

                AccountGroup ag = AccountGroup.builder()
                                .company(company)
                                .category(ac)
                                .code("EXP-GRP")
                                .name("Expense Group")
                                .build();
                accountGroupRepository.saveAndFlush(ag);

                ChartOfAccount expenseAccount = ChartOfAccount.builder()
                                .company(company)
                                .group(ag)
                                .accountCode("EXP-001")
                                .accountName("Travel Expense")
                                .accountType(AccountNature.DEBIT)
                                .isActive(true)
                                .postingAllowed(true)
                                .build();
                expenseAccount = chartOfAccountRepository.saveAndFlush(expenseAccount);

                ChartOfAccount paymentAccount = ChartOfAccount.builder()
                                .company(company)
                                .group(ag)
                                .accountCode("BNK-001")
                                .accountName("Bank Account")
                                .accountType(AccountNature.DEBIT)
                                .isActive(true)
                                .postingAllowed(true)
                                .build();
                paymentAccount = chartOfAccountRepository.saveAndFlush(paymentAccount);

                category.setExpenseAccount(expenseAccount);
                expenseCategoryRepository.saveAndFlush(category);

                creditAccountId = paymentAccount.getId();
                debitAccountId = expenseAccount.getId();
        }

        @AfterEach
        void tearDown() {
                jdbcTemplate.execute("DELETE FROM gl_journal_line");
                jdbcTemplate.execute("DELETE FROM gl_journal_entry");
                jdbcTemplate.execute("DELETE FROM expense_claim_item");
                jdbcTemplate.execute("DELETE FROM expense_claim");
                jdbcTemplate.execute("DELETE FROM expense_request");
                jdbcTemplate.execute("DELETE FROM expense_category");
                jdbcTemplate.execute("DELETE FROM chart_of_account");
                jdbcTemplate.execute("DELETE FROM account_group");
                jdbcTemplate.execute("DELETE FROM account_category");
                jdbcTemplate.execute("DELETE FROM accounting_period");
                jdbcTemplate.execute("DELETE FROM fiscal_year");
                jdbcTemplate.execute("DELETE FROM voucher_sequence");
                jdbcTemplate.execute("DELETE FROM audit_log");
                jdbcTemplate.execute("DELETE FROM reimbursement");
                jdbcTemplate.execute("DELETE FROM company");
                CurrentUserContext.clearAll();
                SecurityContextHolder.clearContext();
        }

        @Test
        void test1_DuplicateExpenseRequestConversion_IsBlocked() {
                ExpenseRequest request = ExpenseRequest.builder()
                                .company(company)
                                .requestNumber("REQ-001")
                                .requestType(RequestType.EXPENSE_REQUEST)
                                .requestDate(LocalDate.now())
                                .requesterId(employeeId)
                                .employeeDriverId(employeeId)
                                .roleType(RoleType.EMPLOYEE)
                                .expenseCategory(category)
                                .requestedAmount(new BigDecimal("1000.00"))
                                .status(ExpenseRequestStatus.APPROVED)
                                .approvalStatus(ExpenseRequestStatus.APPROVED)
                                .build();
                expenseRequestRepository.save(request);

                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());
                claimReq.setExpenseRequestId(request.getId());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Test item");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse response = expenseClaimService.createExpenseClaim(companyId, claimReq);
                assertNotNull(response);

                Exception exception = assertThrows(IllegalArgumentException.class, () -> {
                        expenseClaimService.createExpenseClaim(companyId, claimReq);
                });

                System.out.println("TEST 1 - EXCEPTION: " + exception.getMessage());
        }

        @Test
        void test2_DuplicateGLPostingProtection() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Test item");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse claimRes = expenseClaimService.createExpenseClaim(companyId, claimReq);
                expenseClaimService.submitExpenseClaim(companyId, claimRes.getId());

                long glEntriesBefore = glJournalEntryRepository.count();

                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);

                expenseClaimService.approveExpenseClaim(companyId, claimRes.getId(), approveReq);

                long glEntriesAfterFirstApproval = glJournalEntryRepository.count();
                System.out.println("TEST 2 - GL Entries after 1st approval: " + (glEntriesAfterFirstApproval - glEntriesBefore));

                Exception exception = assertThrows(IllegalArgumentException.class, () -> {
                        expenseClaimService.approveExpenseClaim(companyId, claimRes.getId(), approveReq);
                });

                long glEntriesAfterSecondApproval = glJournalEntryRepository.count();
                assertEquals(glEntriesAfterFirstApproval, glEntriesAfterSecondApproval, "Repeated approval should not increase GL entries");
                System.out.println("TEST 2 - EXCEPTION: " + exception.getMessage());
        }

        @Test
        void test3_FinalExpenseCalculation() {
                UUID vehicleId = UUID.randomUUID();
                ExpenseRequest request = ExpenseRequest.builder()
                                .company(company)
                                .requestNumber("REQ-002")
                                .requestType(RequestType.EXPENSE_REQUEST)
                                .requestDate(LocalDate.now())
                                .requesterId(employeeId)
                                .employeeDriverId(employeeId)
                                .roleType(RoleType.EMPLOYEE)
                                .vehicleId(vehicleId)
                                .expenseCategory(category)
                                .requestedAmount(new BigDecimal("1000.00"))
                                .status(ExpenseRequestStatus.APPROVED)
                                .approvalStatus(ExpenseRequestStatus.APPROVED)
                                .build();
                expenseRequestRepository.save(request);

                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());
                claimReq.setExpenseRequestId(request.getId());
                
                ExpenseClaimItemRequest item1 = new ExpenseClaimItemRequest();
                item1.setExpenseCategoryId(category.getId());
                item1.setAmount(new BigDecimal("300.00"));
                item1.setExpenseDate(LocalDate.now());
                item1.setPaymentType(PaymentType.CASH);

                ExpenseClaimItemRequest item2 = new ExpenseClaimItemRequest();
                item2.setExpenseCategoryId(category.getId());
                item2.setAmount(new BigDecimal("400.00"));
                item2.setExpenseDate(LocalDate.now());
                item2.setPaymentType(PaymentType.CASH);

                ExpenseClaimItemRequest item3 = new ExpenseClaimItemRequest();
                item3.setExpenseCategoryId(category.getId());
                item3.setAmount(new BigDecimal("300.00"));
                item3.setExpenseDate(LocalDate.now());
                item3.setPaymentType(PaymentType.CASH);

                claimReq.setItems(List.of(item1, item2, item3));

                ExpenseClaimResponse claimRes = expenseClaimService.createExpenseClaim(companyId, claimReq);
                expenseClaimService.submitExpenseClaim(companyId, claimRes.getId());
                
                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);
                expenseClaimService.approveExpenseClaim(companyId, claimRes.getId(), approveReq);

                ExpenseReportFilterRequest filter = new ExpenseReportFilterRequest();
                List<VehicleExpenseReportResponse> vehicleReports = expenseReportRepository.getVehicleFleetExpenses(companyId, filter);
                
                BigDecimal totalVehicleExpense = vehicleReports.stream()
                        .filter(v -> vehicleId.equals(v.getVehicleId()))
                        .map(VehicleExpenseReportResponse::getTotalAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                System.out.println("TEST 3 - Calculated Total Expense: " + totalVehicleExpense);
                assertTrue(new BigDecimal("1000.00").compareTo(totalVehicleExpense) == 0);
        }

        @Test
        void test4_FinalStatusValidation() {
            // 1. DRAFT
            ExpenseClaimCreateRequest draftReq = new ExpenseClaimCreateRequest();
            draftReq.setEmployeeId(employeeId);
            draftReq.setClaimDate(LocalDate.now());
            ExpenseClaimItemRequest draftItem = new ExpenseClaimItemRequest();
            draftItem.setExpenseCategoryId(category.getId());
            draftItem.setAmount(new BigDecimal("1000.00"));
            draftItem.setPaymentType(PaymentType.CASH);
            draftReq.setItems(List.of(draftItem));
            ExpenseClaimResponse draftRes = expenseClaimService.createExpenseClaim(companyId, draftReq);
            System.out.println("TEST 4 - Draft status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());
            
            // 2. SUBMITTED
            ExpenseClaimCreateRequest subReq = new ExpenseClaimCreateRequest();
            subReq.setEmployeeId(employeeId);
            subReq.setClaimDate(LocalDate.now());
            ExpenseClaimItemRequest subItem = new ExpenseClaimItemRequest();
            subItem.setExpenseCategoryId(category.getId());
            subItem.setAmount(new BigDecimal("1000.00"));
            subItem.setPaymentType(PaymentType.CASH);
            subReq.setItems(List.of(subItem));
            ExpenseClaimResponse subRes = expenseClaimService.createExpenseClaim(companyId, subReq);
            expenseClaimService.submitExpenseClaim(companyId, subRes.getId());
            System.out.println("TEST 4 - Submitted status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());

            // 3. FINANCE_APPROVED
            ExpenseClaimCreateRequest finReq = new ExpenseClaimCreateRequest();
            finReq.setEmployeeId(employeeId);
            finReq.setClaimDate(LocalDate.now());
            ExpenseClaimItemRequest finItem = new ExpenseClaimItemRequest();
            finItem.setExpenseCategoryId(category.getId());
            finItem.setAmount(new BigDecimal("1000.00"));
            finItem.setPaymentType(PaymentType.CASH);
            finReq.setItems(List.of(finItem));
            ExpenseClaimResponse finRes = expenseClaimService.createExpenseClaim(companyId, finReq);
            expenseClaimService.submitExpenseClaim(companyId, finRes.getId());
            ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
            approveReq.setEmployeePayableAccountId(debitAccountId);
            approveReq.setBankOrCashAccountId(creditAccountId);
            expenseClaimService.approveExpenseClaim(companyId, finRes.getId(), approveReq);
            System.out.println("TEST 4 - Finance Approved status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());

            // 4. PAID
            ExpenseClaim finClaimEntity = expenseClaimRepository.findById(finRes.getId()).get();
            finClaimEntity.setStatus(ApprovalStatus.PAID);
            expenseClaimRepository.saveAndFlush(finClaimEntity);
            System.out.println("TEST 4 - Paid status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());

            // 5. REJECTED
            ExpenseClaimCreateRequest rejReq = new ExpenseClaimCreateRequest();
            rejReq.setEmployeeId(employeeId);
            rejReq.setClaimDate(LocalDate.now());
            ExpenseClaimItemRequest rejItem = new ExpenseClaimItemRequest();
            rejItem.setExpenseCategoryId(category.getId());
            rejItem.setAmount(new BigDecimal("1000.00"));
            rejItem.setPaymentType(PaymentType.CASH);
            rejReq.setItems(List.of(rejItem));
            ExpenseClaimResponse rejRes = expenseClaimService.createExpenseClaim(companyId, rejReq);
            expenseClaimService.submitExpenseClaim(companyId, rejRes.getId());
            ExpenseClaimRejectRequest rejectReq = new ExpenseClaimRejectRequest();
            rejectReq.setRejectionReason("Test reject");
            expenseClaimService.rejectExpenseClaim(companyId, rejRes.getId(), rejectReq);
            System.out.println("TEST 4 - Rejected status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());

            // 6. CANCELLED
            ExpenseClaimCreateRequest canReq = new ExpenseClaimCreateRequest();
            canReq.setEmployeeId(employeeId);
            canReq.setClaimDate(LocalDate.now());
            ExpenseClaimItemRequest canItem = new ExpenseClaimItemRequest();
            canItem.setExpenseCategoryId(category.getId());
            canItem.setAmount(new BigDecimal("1000.00"));
            canItem.setPaymentType(PaymentType.CASH);
            canReq.setItems(List.of(canItem));
            ExpenseClaimResponse canRes = expenseClaimService.createExpenseClaim(companyId, canReq);
            expenseClaimService.cancelExpenseClaim(companyId, canRes.getId());
            System.out.println("TEST 4 - Cancelled status: " + expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses());
        }

        @Test
        void testApproveSubmittedExpense() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Office Travel Expense");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                assertNotNull(createdClaim);

                ExpenseClaimResponse submittedClaim = expenseClaimService.submitExpenseClaim(companyId, createdClaim.getId());
                assertEquals(ApprovalStatus.SUBMITTED, submittedClaim.getStatus(), "Status should be SUBMITTED");

                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);
                approveReq.setNotes("Approved by finance");

                ExpenseClaimResponse approvedClaim = expenseClaimService.approveExpenseClaim(companyId, submittedClaim.getId(), approveReq);
                assertEquals(ApprovalStatus.FINANCE_APPROVED, approvedClaim.getStatus(), "Status should be FINANCE_APPROVED");
        }

        @Test
        void testApprovedExpenseCreatesSingleGLPosting() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Single GL test");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                ExpenseClaimResponse submittedClaim = expenseClaimService.submitExpenseClaim(companyId, createdClaim.getId());

                long glEntriesBefore = glJournalEntryRepository.count();
                assertEquals(0, glEntriesBefore, "GL entries before approval should be 0");

                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);

                expenseClaimService.approveExpenseClaim(companyId, submittedClaim.getId(), approveReq);

                long glEntriesAfter = glJournalEntryRepository.count();
                assertEquals(1, glEntriesAfter - glEntriesBefore, "Exactly 1 GL entry should be created on approval");
        }

        @Test
        void testRepeatedApprovalDoesNotCreateDuplicateGLPosting() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Duplicate approval test");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                ExpenseClaimResponse submittedClaim = expenseClaimService.submitExpenseClaim(companyId, createdClaim.getId());

                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);

                expenseClaimService.approveExpenseClaim(companyId, submittedClaim.getId(), approveReq);
                long glEntriesAfterFirstApproval = glJournalEntryRepository.count();
                assertEquals(1, glEntriesAfterFirstApproval, "First approval should create 1 GL entry");

                // Second approval attempt must fail
                assertThrows(IllegalArgumentException.class, () -> {
                        expenseClaimService.approveExpenseClaim(companyId, submittedClaim.getId(), approveReq);
                });

                long glEntriesAfterSecondAttempt = glJournalEntryRepository.count();
                assertEquals(1, glEntriesAfterSecondAttempt, "GL entries must remain 1 after repeated approval attempt");
        }

        @Test
        void testSubmittedExpenseExcludedFromReports() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                expenseClaimService.submitExpenseClaim(companyId, createdClaim.getId());

                BigDecimal totalExpenses = expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses();
                assertNotNull(totalExpenses);
                assertTrue(BigDecimal.ZERO.compareTo(totalExpenses) == 0, "SUBMITTED expense must be excluded from reports (total should be 0)");
        }

        @Test
        void testFinanceApprovedExpenseIncludedInReports() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                ExpenseClaimResponse submittedClaim = expenseClaimService.submitExpenseClaim(companyId, createdClaim.getId());

                ExpenseClaimApproveRequest approveReq = new ExpenseClaimApproveRequest();
                approveReq.setEmployeePayableAccountId(debitAccountId);
                approveReq.setBankOrCashAccountId(creditAccountId);

                expenseClaimService.approveExpenseClaim(companyId, submittedClaim.getId(), approveReq);

                BigDecimal totalExpenses = expenseReportRepository.getSummary(companyId, new ExpenseReportFilterRequest()).getTotalRecordedExpenses();
                assertNotNull(totalExpenses);
                assertTrue(new BigDecimal("1000.00").compareTo(totalExpenses) == 0, "FINANCE_APPROVED expense must be included in reports (total should be 1000)");
        }

        @Test
        void testExpenseItemsPersisted() {
                ExpenseClaimCreateRequest claimReq = new ExpenseClaimCreateRequest();
                claimReq.setEmployeeId(employeeId);
                claimReq.setClaimDate(LocalDate.now());

                ExpenseClaimItemRequest itemReq = new ExpenseClaimItemRequest();
                itemReq.setExpenseCategoryId(category.getId());
                itemReq.setAmount(new BigDecimal("1000.00"));
                itemReq.setExpenseDate(LocalDate.now());
                itemReq.setPaymentType(PaymentType.CASH);
                itemReq.setDescription("Persistence verification item");
                claimReq.setItems(List.of(itemReq));

                ExpenseClaimResponse createdClaim = expenseClaimService.createExpenseClaim(companyId, claimReq);
                assertNotNull(createdClaim);

                List<ExpenseClaimItem> items = expenseClaimItemRepository.findAllByExpenseClaimId(createdClaim.getId());
                assertNotNull(items);
                assertEquals(1, items.size(), "ExpenseClaimItem count should be 1");
                assertTrue(new BigDecimal("1000.00").compareTo(items.get(0).getAmount()) == 0, "Item amount should be 1000");
        }

}
