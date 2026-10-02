package com.erp.account.modules.purchaseorder.service;

import com.erp.account.config.AdvancePaymentVoucherPostingInitializer;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import com.erp.account.security.CurrentUserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.test.context.TestPropertySource(properties = {
        "spring.datasource.url=jdbc:postgresql://localhost:5432/account",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.datasource.username=postgres",
        "spring.datasource.password=mohit",
        "spring.jpa.hibernate.ddl-auto=none"
})
public class POAdvancePaymentAccountingLiveTest {

    @Autowired
    private PaymentVoucherRepository paymentVoucherRepository;

    @Autowired
    private PaymentVoucherService paymentVoucherService;

    @Autowired
    private GlJournalEntryRepository glJournalEntryRepository;

    @Autowired
    private AdvancePaymentVoucherPostingInitializer initializer;

    private static final UUID EXISTING_VOUCHER_ID = UUID.fromString("ac1dabd8-5574-453b-a9b0-58b31315595f");
    private static final UUID COMPANY_ID = UUID.fromString("8794358f-3b1a-40be-9d13-afb51b449862");

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
    @org.springframework.transaction.annotation.Transactional
    @DisplayName("Verify that existing unposted PO advance payment voucher is posted with Journal Entry")
    void testPostExistingAdvanceVoucher() {
        PaymentVoucher voucher = paymentVoucherRepository.findById(EXISTING_VOUCHER_ID).orElse(null);
        assertNotNull(voucher, "Payment voucher ac1dabd8-5574-453b-a9b0-58b31315595f must exist in database");

        // Execute posting via postPaymentVoucherDirectly
        paymentVoucherService.postPaymentVoucherDirectly(voucher);

        PaymentVoucher updated = paymentVoucherRepository.findById(EXISTING_VOUCHER_ID).orElseThrow();
        assertEquals(PostingStatus.POSTED, updated.getGlPostingStatus());
        assertNotNull(updated.getGlJournalEntryId(), "gl_journal_entry_id must be populated");

        // Verify Journal Entry
        GlJournalEntry journal = glJournalEntryRepository.findById(updated.getGlJournalEntryId()).orElse(null);
        assertNotNull(journal, "GlJournalEntry must exist in database");
        assertEquals(COMPANY_ID, journal.getCompany().getId());
        assertEquals(new BigDecimal("20000.0000"), journal.getTotalDebit());
        assertEquals(new BigDecimal("20000.0000"), journal.getTotalCredit());
        assertEquals(PostingStatus.POSTED, journal.getStatus());

        // Verify Journal Lines
        List<GlJournalLine> lines = journal.getJournalLines().stream().toList();
        assertEquals(2, lines.size(), "Must have exactly 2 journal lines");

        BigDecimal totalDebit = lines.stream().map(GlJournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCredit = lines.stream().map(GlJournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(new BigDecimal("20000.0000"), totalDebit);
        assertEquals(new BigDecimal("20000.0000"), totalCredit);
    }
}
