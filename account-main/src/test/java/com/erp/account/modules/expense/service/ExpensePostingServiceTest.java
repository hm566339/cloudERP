package com.erp.account.modules.expense.service;

import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.company.repository.CompanyRepository;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import com.erp.account.modules.expense.repository.ExpenseRequestRepository;
import com.erp.account.modules.expense.service.impl.ExpensePostingServiceImpl;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.util.TenantUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExpensePostingServiceTest {

    @Mock
    private AccountingPostingService accountingPostingService;

    @Mock
    private AccountingValidationService accountingValidationService;

    @Mock
    private AccountingPolicyService accountingPolicyService;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private ExpenseRequestRepository expenseRequestRepository;

    @InjectMocks
    private ExpensePostingServiceImpl expensePostingService;

    private MockedStatic<TenantUtils> mockedTenantUtils;

    private UUID companyId;
    private UUID userId;
    private Company company;
    private FiscalYear fiscalYear;
    private AccountingPeriod accountingPeriod;

    private UUID expenseAccountId;
    private UUID employeePayableAccountId;
    private UUID bankOrCashAccountId;
    private UUID employeeAdvanceAccountId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        company = Company.builder().id(companyId).companyName("Test Corp").build();
        fiscalYear = FiscalYear.builder().id(UUID.randomUUID()).company(company).build();
        accountingPeriod = AccountingPeriod.builder().id(UUID.randomUUID()).company(company).build();

        expenseAccountId = UUID.randomUUID();
        employeePayableAccountId = UUID.randomUUID();
        bankOrCashAccountId = UUID.randomUUID();
        employeeAdvanceAccountId = UUID.randomUUID();

        mockedTenantUtils = Mockito.mockStatic(TenantUtils.class);
        mockedTenantUtils.when(TenantUtils::getCurrentUserId).thenReturn(userId);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(accountingValidationService.fiscalYearFor(any(LocalDate.class), eq(companyId))).thenReturn(fiscalYear);
        when(accountingValidationService.accountingPeriodFor(any(LocalDate.class), eq(companyId))).thenReturn(accountingPeriod);
    }

    @AfterEach
    void tearDown() {
        mockedTenantUtils.close();
    }

    // 10 & 11. SELF_PAID Accounting & Actual Expense Linked to Expense Request
    @Test
    void testPostSelfPaidExpense_Success_AndLinksExpenseRequest() {
        UUID requestId = UUID.randomUUID();
        ExpenseRequest request = ExpenseRequest.builder()
                .id(requestId)
                .company(company)
                .status(ExpenseRequestStatus.APPROVED)
                .requestedAmount(new BigDecimal("2000.00"))
                .approvedAmount(new BigDecimal("2000.00"))
                .build();

        when(expenseRequestRepository.findByIdAndCompanyId(requestId, companyId)).thenReturn(Optional.of(request));

        BigDecimal actualAmount = new BigDecimal("1650.00");
        LocalDate postingDate = LocalDate.of(2026, 9, 4);

        GlJournalEntry mockJournal = new GlJournalEntry();
        mockJournal.setId(UUID.randomUUID());
        mockJournal.setStatus(PostingStatus.POSTED);
        mockJournal.setTotalDebit(actualAmount);
        mockJournal.setTotalCredit(actualAmount);

        when(accountingPostingService.postJournalEntry(any(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId)))
                .thenReturn(mockJournal);

        GlJournalEntry result = expensePostingService.postSelfPaidExpense(
                companyId,
                requestId,
                expenseAccountId,
                employeePayableAccountId,
                actualAmount,
                postingDate,
                "Fuel & Toll charges"
        );

        assertNotNull(result);
        assertEquals(PostingStatus.POSTED, result.getStatus());

        // Verify journal lines sent to accounting engine
        ArgumentCaptor<GlJournalEntryRequest> captor = ArgumentCaptor.forClass(GlJournalEntryRequest.class);
        verify(accountingPostingService).postJournalEntry(captor.capture(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId));

        GlJournalEntryRequest sentRequest = captor.getValue();
        assertEquals(2, sentRequest.getJournalLines().size());

        GlJournalLineRequest debit = sentRequest.getJournalLines().stream().filter(l -> l.getDebitAmount() != null).findFirst().orElseThrow();
        GlJournalLineRequest credit = sentRequest.getJournalLines().stream().filter(l -> l.getCreditAmount() != null).findFirst().orElseThrow();

        assertEquals(expenseAccountId, debit.getAccountId());
        assertEquals(actualAmount, debit.getDebitAmount());

        assertEquals(employeePayableAccountId, credit.getAccountId());
        assertEquals(actualAmount, credit.getCreditAmount());

        // Verify status transition to CONVERTED_TO_EXPENSE
        assertEquals(ExpenseRequestStatus.CONVERTED_TO_EXPENSE, request.getStatus());
        verify(expenseRequestRepository).save(request);
    }

    // 12. ADVANCE Accounting: Disbursal and Settlement
    @Test
    void testAdvancePaymentAndSettlement_Success() {
        BigDecimal advanceAmount = new BigDecimal("2000.00");
        BigDecimal actualSpent = new BigDecimal("1650.00");
        LocalDate postingDate = LocalDate.of(2026, 9, 4);

        GlJournalEntry disbursalJournal = new GlJournalEntry();
        disbursalJournal.setId(UUID.randomUUID());
        disbursalJournal.setStatus(PostingStatus.POSTED);

        when(accountingPostingService.postJournalEntry(any(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId)))
                .thenReturn(disbursalJournal);

        // Disburse advance: Debit Employee Advance 2000, Credit Bank/Cash 2000
        GlJournalEntry disbursalResult = expensePostingService.postAdvancePayment(
                companyId,
                null,
                employeeAdvanceAccountId,
                bankOrCashAccountId,
                advanceAmount,
                postingDate,
                "Trip Advance Disbursal"
        );
        assertNotNull(disbursalResult);

        // Settle advance: Debit Expense 1650, Credit Employee Advance 1650 (leaving 350 advance balance)
        GlJournalEntry settlementJournal = new GlJournalEntry();
        settlementJournal.setId(UUID.randomUUID());
        settlementJournal.setStatus(PostingStatus.POSTED);

        when(accountingPostingService.postJournalEntry(any(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId)))
                .thenReturn(settlementJournal);

        GlJournalEntry settleResult = expensePostingService.postAdvanceSettlement(
                companyId,
                null,
                expenseAccountId,
                employeeAdvanceAccountId,
                actualSpent,
                postingDate,
                "Trip Fuel Settlement"
        );
        assertNotNull(settleResult);

        // Verify two postings occurred
        verify(accountingPostingService, times(2)).postJournalEntry(any(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId));
    }

    // 13. Reimbursement Accounting
    @Test
    void testPostExpenseReimbursement_Success() {
        BigDecimal reimbAmount = new BigDecimal("1650.00");
        LocalDate postingDate = LocalDate.of(2026, 9, 5);

        GlJournalEntry mockJournal = new GlJournalEntry();
        mockJournal.setId(UUID.randomUUID());
        mockJournal.setStatus(PostingStatus.POSTED);

        when(accountingPostingService.postJournalEntry(any(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId)))
                .thenReturn(mockJournal);

        GlJournalEntry result = expensePostingService.postExpenseReimbursement(
                companyId,
                null,
                employeePayableAccountId,
                bankOrCashAccountId,
                reimbAmount,
                postingDate,
                "Reimbursement payment to employee"
        );

        assertNotNull(result);

        ArgumentCaptor<GlJournalEntryRequest> captor = ArgumentCaptor.forClass(GlJournalEntryRequest.class);
        verify(accountingPostingService).postJournalEntry(captor.capture(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId));

        GlJournalEntryRequest request = captor.getValue();
        GlJournalLineRequest debit = request.getJournalLines().stream().filter(l -> l.getDebitAmount() != null).findFirst().orElseThrow();
        GlJournalLineRequest credit = request.getJournalLines().stream().filter(l -> l.getCreditAmount() != null).findFirst().orElseThrow();

        assertEquals(employeePayableAccountId, debit.getAccountId());
        assertEquals(reimbAmount, debit.getDebitAmount());

        assertEquals(bankOrCashAccountId, credit.getAccountId());
        assertEquals(reimbAmount, credit.getCreditAmount());
    }

    // 14. Debit = Credit validation
    @Test
    void testDebitEqualsCreditValidation() {
        UUID requestId = UUID.randomUUID();
        BigDecimal actualAmount = new BigDecimal("1650.00");
        LocalDate postingDate = LocalDate.of(2026, 9, 4);

        ArgumentCaptor<GlJournalEntryRequest> captor = ArgumentCaptor.forClass(GlJournalEntryRequest.class);

        when(accountingPostingService.postJournalEntry(captor.capture(), eq(company), eq(fiscalYear), eq(accountingPeriod), eq(postingDate), eq(userId)))
                .thenReturn(new GlJournalEntry());

        expensePostingService.postSelfPaidExpense(
                companyId,
                requestId,
                expenseAccountId,
                employeePayableAccountId,
                actualAmount,
                postingDate,
                "Validation check"
        );

        GlJournalEntryRequest sent = captor.getValue();
        BigDecimal totalDebit = sent.getJournalLines().stream()
                .map(l -> l.getDebitAmount() != null ? l.getDebitAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalCredit = sent.getJournalLines().stream()
                .map(l -> l.getCreditAmount() != null ? l.getCreditAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        assertEquals(0, totalDebit.compareTo(totalCredit), "Total Debit must exactly equal Total Credit for double-entry validity");
        assertEquals(actualAmount, totalDebit);
        assertEquals(actualAmount, totalCredit);
    }
}
