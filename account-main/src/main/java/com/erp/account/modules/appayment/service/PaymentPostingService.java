package com.erp.account.modules.appayment.service;

import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentPostingService {

    private final GlJournalEntryRepository glJournalEntryRepository;
    private final AccountingValidationService accountingValidationService;

    public GlJournalEntry createGlPosting(ApPayment payment) {
        UUID companyId = payment.getCompany().getId();
        GlJournalEntry journal = baseJournal(payment, voucherNo(payment.getPaymentNo()), "AP Payment: ");
        ChartOfAccount payable = accountingValidationService.postingAccount(
            payment.getVendor().getPayableAccount().getId(), companyId, "Vendor payable");
        ChartOfAccount bank = accountingValidationService.postingAccount(
            payment.getBankAccount().getGlAccount().getId(), companyId, "Bank");

        BigDecimal gross = amountOrZero(payment.getPaymentAmount());
        BigDecimal tds = amountOrZero(payment.getTdsAmount());
        BigDecimal bankAmount = gross.subtract(tds);
        if (bankAmount.signum() < 0) {
            throw new PaymentValidationException("TDS amount cannot exceed payment amount.");
        }

        List<GlJournalLine> lines = new java.util.ArrayList<>();
        // Paying a vendor reduces AP liability, so vendor payable is debited for the gross settlement.
        lines.add(debitLine(journal, payable, gross, "Vendor payable settlement"));
        lines.add(creditLine(journal, bank, bankAmount, "Bank payment"));
        addTdsLine(payment, journal, lines, companyId, tds);
        return saveBalanced(journal, lines);
    }

    public GlJournalEntry createReversePosting(ApPayment payment) {
        GlJournalEntry original = glJournalEntryRepository.findById(payment.getGlJournalEntryId())
            .orElseThrow(() -> new PaymentValidationException("Original payment journal not found."));
        GlJournalEntry reverse = baseJournal(payment, voucherNo("REV-" + payment.getPaymentNo()), "AP Payment reversal: ");
        List<GlJournalLine> lines = original.getJournalLines().stream()
            .map(line -> reverseLine(reverse, line))
            .toList();
        GlJournalEntry saved = saveBalanced(reverse, lines);
        original.setStatus(PostingStatus.REVERSED);
        glJournalEntryRepository.save(original);
        return saved;
    }

    private void addTdsLine(ApPayment payment, GlJournalEntry journal, List<GlJournalLine> lines,
                            UUID companyId, BigDecimal tds) {
        if (tds.signum() == 0) {
            return;
        }
        ChartOfAccount tdsPayable = accountingValidationService.postingAccount(
            payment.getTdsPayableAccountId(), companyId, "TDS payable");
        // TDS withheld is a statutory liability, so the payment credits TDS payable instead of bank.
        lines.add(creditLine(journal, tdsPayable, tds, "TDS payable withheld"));
    }

    private GlJournalEntry saveBalanced(GlJournalEntry journal, List<GlJournalLine> lines) {
        BigDecimal debit = lines.stream().map(GlJournalLine::getDebitAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal credit = lines.stream().map(GlJournalLine::getCreditAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        journal.setTotalDebit(debit);
        journal.setTotalCredit(credit);
        journal.setJournalLines(new HashSet<>(lines));
        if (!journal.isBalanced()) {
            throw new PaymentValidationException("AP payment journal is not balanced.");
        }
        GlJournalEntry saved = glJournalEntryRepository.save(journal);
        log.info("Created AP payment journal {} for payment {}", saved.getId(), journal.getReferenceNo());
        return saved;
    }

    private GlJournalEntry baseJournal(ApPayment payment, String voucherNo, String narrationPrefix) {
        UUID companyId = payment.getCompany().getId();
        GlJournalEntry journal = new GlJournalEntry();
        journal.setCompany(payment.getCompany());
        journal.setFiscalYear(accountingValidationService.fiscalYearFor(payment.getPaymentDate(), companyId));
        journal.setAccountingPeriod(accountingValidationService.accountingPeriodFor(payment.getPaymentDate(), companyId));
        journal.setVoucherNo(voucherNo);
        journal.setVoucherDate(payment.getPaymentDate());
        journal.setReferenceNo(payment.getPaymentNo());
        journal.setSourceModule(SourceModule.PAYMENT);
        journal.setSourceId(payment.getId());
        journal.setStatus(PostingStatus.POSTED);
        journal.setPostedBy(TenantUtils.getCurrentUserId());
        journal.setPostedAt(LocalDateTime.now());
        journal.setNarration(narrationPrefix + payment.getPaymentNo() + " / " + payment.getVendor().getVendorName());
        return journal;
    }

    private GlJournalLine reverseLine(GlJournalEntry reverse, GlJournalLine original) {
        return line(reverse, original.getAccount(), amountOrZero(original.getCreditAmount()),
            amountOrZero(original.getDebitAmount()), "Reverse: " + original.getLineDescription());
    }

    private GlJournalLine debitLine(GlJournalEntry journal, ChartOfAccount account, BigDecimal amount, String description) {
        return line(journal, account, amount, BigDecimal.ZERO, description);
    }

    private GlJournalLine creditLine(GlJournalEntry journal, ChartOfAccount account, BigDecimal amount, String description) {
        return line(journal, account, BigDecimal.ZERO, amount, description);
    }

    private GlJournalLine line(GlJournalEntry journal, ChartOfAccount account, BigDecimal debit,
                               BigDecimal credit, String description) {
        GlJournalLine line = new GlJournalLine();
        line.setCompany(journal.getCompany());
        line.setJournalEntry(journal);
        line.setAccount(account);
        line.setDebitAmount(debit);
        line.setCreditAmount(credit);
        line.setCurrencyCode(journal.getCompany().getBaseCurrency());
        line.setLineDescription(description);
        return line;
    }

    private BigDecimal amountOrZero(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount;
    }

    private String voucherNo(String value) {
        return value.length() <= 20 ? value : value.substring(0, 20);
    }
}
