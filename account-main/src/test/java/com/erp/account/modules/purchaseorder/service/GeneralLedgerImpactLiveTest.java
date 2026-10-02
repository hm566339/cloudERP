package com.erp.account.modules.purchaseorder.service;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.repository.GlJournalLineRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.report.dto.response.LedgerTransactionResponse;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import com.erp.account.modules.reporting.dto.response.GeneralLedgerLine;
import com.erp.account.modules.reporting.dto.response.TrialBalanceLine;
import com.erp.account.modules.reporting.service.GeneralLedgerService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.transaction.annotation.Transactional
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.test.context.TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/account",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.datasource.password=mohit",
        "spring.jpa.hibernate.ddl-auto=none"
})
public class GeneralLedgerImpactLiveTest {

    @Autowired
    private PaymentVoucherRepository paymentVoucherRepository;

    @Autowired
    private PaymentVoucherService paymentVoucherService;

    @Autowired
    private GlJournalEntryRepository glJournalEntryRepository;

    @Autowired
    private GlJournalLineRepository glJournalLineRepository;

    @Autowired
    private BankTransactionRepository bankTransactionRepository;

    @Autowired
    private GlJournalEntryService glJournalEntryService;

    @Autowired
    private GeneralLedgerService generalLedgerService;

    private static final UUID VOUCHER_ID = UUID.fromString("ac1dabd8-5574-453b-a9b0-58b31315595f");
    private static final UUID JOURNAL_ID = UUID.fromString("304e74bd-f705-442c-a52b-eabacd4f050a");
    private static final UUID COMPANY_ID = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");
    private static final UUID TRADE_PAYABLES_ACCOUNT_ID = UUID.fromString("10be584c-31d9-49aa-bb26-27e243b3b53a");
    private static final UUID HDFC_BANK_ACCOUNT_ID = UUID.fromString("5eb3b85c-982e-4e65-89b1-888da1760c94");
    private static final BigDecimal AMOUNT = new BigDecimal("20000.0000");

    @BeforeEach
    void setUp() {
        CurrentUserContext.setCompanyId(COMPANY_ID);
        CurrentUserContext.setUserId(UUID.fromString("b53d36fd-e242-455f-a5bf-a3647d17ec37"));
    }

    @AfterEach
    void tearDown() {
        CurrentUserContext.clear();
    }

    @Test
    @DisplayName("Task 1, 2, 3, 6, 7: Verify Journal Entry and GL linkage in database")
    void testJournalEntryAndGLLinkage() {
        GlJournalEntry journal = glJournalEntryRepository.findById(JOURNAL_ID).orElse(null);
        assertNotNull(journal, "Journal JV-2026-0024 must exist");
        assertEquals("JV-2026-0024", journal.getVoucherNo());
        assertEquals("PV-2026-09-000001", journal.getReferenceNo());
        assertEquals(PostingStatus.POSTED, journal.getStatus());
        assertEquals(COMPANY_ID, journal.getCompany().getId());
        assertEquals(AMOUNT, journal.getTotalDebit());
        assertEquals(AMOUNT, journal.getTotalCredit());
        assertEquals(LocalDate.of(2026, 9, 12), journal.getVoucherDate());

        List<GlJournalLine> lines = glJournalLineRepository.findAllByJournalEntryIdAndIsDeletedFalse(JOURNAL_ID);
        assertEquals(2, lines.size(), "Should have exactly 2 lines");

        GlJournalLine debitLine = lines.stream().filter(l -> l.getDebitAmount() != null && l.getDebitAmount().compareTo(BigDecimal.ZERO) > 0).findFirst().orElse(null);
        assertNotNull(debitLine);
        assertEquals(TRADE_PAYABLES_ACCOUNT_ID, debitLine.getAccount().getId());
        assertEquals("200007", debitLine.getAccount().getAccountCode());
        assertEquals(AMOUNT, debitLine.getDebitAmount());
        assertEquals(BigDecimal.ZERO.setScale(4), debitLine.getCreditAmount());

        GlJournalLine creditLine = lines.stream().filter(l -> l.getCreditAmount() != null && l.getCreditAmount().compareTo(BigDecimal.ZERO) > 0).findFirst().orElse(null);
        assertNotNull(creditLine);
        assertEquals(HDFC_BANK_ACCOUNT_ID, creditLine.getAccount().getId());
        assertEquals("100008", creditLine.getAccount().getAccountCode());
        assertEquals(AMOUNT, creditLine.getCreditAmount());
        assertEquals(BigDecimal.ZERO.setScale(4), debitLine.getCreditAmount());
    }

    @Test
    @DisplayName("Task 4, 9, 10: Verify Account Ledger impact for Trade Payables and HDFC Bank")
    void testAccountLedgerImpact() {
        Pageable pageable = PageRequest.of(0, 50);

        // Trade Payables Ledger
        Page<GeneralLedgerLine> apLines = glJournalEntryService.getAccountLedger(
                COMPANY_ID, TRADE_PAYABLES_ACCOUNT_ID, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), pageable);
        assertNotNull(apLines);
        boolean foundInAp = apLines.getContent().stream()
                .anyMatch(l -> "JV-2026-0024".equals(l.getVoucherNo()) && AMOUNT.compareTo(l.getDebitAmount()) == 0);
        assertTrue(foundInAp, "JV-2026-0024 must appear in Trade Payables Account Ledger as a ₹20,000 Debit");

        // HDFC Bank Ledger
        Page<GeneralLedgerLine> bankLines = glJournalEntryService.getAccountLedger(
                COMPANY_ID, HDFC_BANK_ACCOUNT_ID, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), pageable);
        assertNotNull(bankLines);
        boolean foundInBank = bankLines.getContent().stream()
                .anyMatch(l -> "JV-2026-0024".equals(l.getVoucherNo()) && AMOUNT.compareTo(l.getCreditAmount()) == 0);
        assertTrue(foundInBank, "JV-2026-0024 must appear in HDFC Bank Account Ledger as a ₹20,000 Credit");
    }

    @Test
    @DisplayName("Task 8: Verify Trial Balance reflects ₹20,000 Debit on Trade Payables and ₹20,000 Credit on HDFC Bank")
    void testTrialBalanceImpact() {
        Pageable pageable = PageRequest.of(0, 100);
        Page<TrialBalanceLine> tb = glJournalEntryService.getTrialBalance(
                COMPANY_ID, LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), pageable);
        assertNotNull(tb);

        TrialBalanceLine apLine = tb.getContent().stream()
                .filter(l -> TRADE_PAYABLES_ACCOUNT_ID.equals(l.getAccountId()))
                .findFirst().orElse(null);
        assertNotNull(apLine, "Trade Payables must exist in Trial Balance");
        // Period debit must be at least 20,000 (actual is 21,200)
        assertTrue(apLine.getDebitAmount().compareTo(AMOUNT) >= 0, "Trade Payables period debit must reflect advance debit");

        TrialBalanceLine bankLine = tb.getContent().stream()
                .filter(l -> HDFC_BANK_ACCOUNT_ID.equals(l.getAccountId()))
                .findFirst().orElse(null);
        assertNotNull(bankLine, "HDFC Bank must exist in Trial Balance");
        // Period credit must be at least 20,000 (actual is 24,600)
        assertTrue(bankLine.getCreditAmount().compareTo(AMOUNT) >= 0, "HDFC Bank period credit must reflect bank credit");
    }

    @Test
    @DisplayName("Task 11, 12: Verify idempotency and no duplicate postings")
    void testIdempotencyAndNoDuplicates() {
        // Attempt posting again
        PaymentVoucherResponse resp = paymentVoucherService.postPaymentVoucherDirectly(VOUCHER_ID);
        assertNotNull(resp);
        assertEquals(JOURNAL_ID, resp.getGlJournalEntryId());

        // Check for duplicate journals
        List<GlJournalEntry> journals = glJournalEntryRepository.findAll().stream()
                .filter(j -> "PV-2026-09-000001".equals(j.getReferenceNo()) || VOUCHER_ID.equals(j.getSourceId()))
                .filter(j -> !Boolean.TRUE.equals(j.getIsDeleted()))
                .toList();
        assertEquals(1, journals.size(), "Must only have exactly 1 Journal Entry for PV-2026-09-000001");

        // Check for duplicate lines
        List<GlJournalLine> lines = glJournalLineRepository.findAllByJournalEntryIdAndIsDeletedFalse(JOURNAL_ID);
        assertEquals(2, lines.size(), "Must only have exactly 2 lines for JV-2026-0024");

        // Check for duplicate bank transactions
        List<BankTransaction> bankTransactions = bankTransactionRepository.findAll().stream()
                .filter(b -> JOURNAL_ID.equals(b.getGlJournalEntryId()) || "PV-2026-09-000001".equals(b.getReferenceNo()))
                .filter(b -> !Boolean.TRUE.equals(b.getIsDeleted()))
                .toList();
        assertEquals(1, bankTransactions.size(), "Must only have exactly 1 Bank Transaction for PV-2026-09-000001");
    }

    @Test
    @DisplayName("Task 13: Verify Visibility in APIs (GeneralLedgerService and Journal Profile)")
    void testApiVisibility() {
        // 1. Journal Profile
        GlJournalProfileResponse profile = glJournalEntryService.getJournalProfileById(JOURNAL_ID);
        assertNotNull(profile);
        assertEquals("JV-2026-0024", profile.getJournalEntry().getVoucherNumber());
        assertEquals("POSTED", profile.getJournalEntry().getStatus().name());
        assertEquals(2, profile.getJournalLines().size());

        // 2. Reporting General Ledger Service for Trade Payables
        GeneralLedgerRequest reqAp = new GeneralLedgerRequest();
        reqAp.setAccountId(TRADE_PAYABLES_ACCOUNT_ID);
        reqAp.setFromDate(LocalDate.of(2026, 9, 1));
        reqAp.setToDate(LocalDate.of(2026, 9, 30));
        reqAp.setIncludeOpening(true);

        GeneralLedgerResponse glRespAp = generalLedgerService.generateGeneralLedger(reqAp, COMPANY_ID);
        assertNotNull(glRespAp);
        boolean foundInGl = glRespAp.getTransactions().stream()
                .anyMatch(t -> "JV-2026-0024".equals(t.getVoucherNumber()) && AMOUNT.compareTo(t.getDebit()) == 0);
        assertTrue(foundInGl, "JV-2026-0024 must appear in General Ledger report for Trade Payables");

        // 3. Reporting General Ledger Service for HDFC Bank
        GeneralLedgerRequest reqBank = new GeneralLedgerRequest();
        reqBank.setAccountId(HDFC_BANK_ACCOUNT_ID);
        reqBank.setFromDate(LocalDate.of(2026, 9, 1));
        reqBank.setToDate(LocalDate.of(2026, 9, 30));
        reqBank.setIncludeOpening(true);

        GeneralLedgerResponse glRespBank = generalLedgerService.generateGeneralLedger(reqBank, COMPANY_ID);
        assertNotNull(glRespBank);
        boolean foundInGlBank = glRespBank.getTransactions().stream()
                .anyMatch(t -> "JV-2026-0024".equals(t.getVoucherNumber()) && AMOUNT.compareTo(t.getCredit()) == 0);
        assertTrue(foundInGlBank, "JV-2026-0024 must appear in General Ledger report for HDFC Bank");
    }
}
