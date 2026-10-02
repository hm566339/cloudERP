package com.erp.account.modules.apinvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.entity.ApInvoiceItem;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
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
@Service("glPostingServiceAp")
@RequiredArgsConstructor
public class GlPostingService {

    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final GlJournalEntryRepository glJournalEntryRepository;
    private final AccountingValidationService accountingValidationService;
    private final AccountingPolicyService accountingPolicyService;
    private final AccountingPostingService accountingPostingService;
    private final ChartOfAccountRepository chartOfAccountRepository;

    public GlJournalEntry createGlPosting(ApInvoice invoice) {
        UUID companyId = invoice.getCompany().getId();
        accountingPolicyService.validatePostingDate(invoice.getInvoiceDate(), companyId);
        accountingPolicyService.validateDocumentPostingState(invoice.getGlPostingStatus(), "AP invoice");

        FiscalYear fiscalYear = accountingValidationService.fiscalYearFor(invoice.getInvoiceDate(), companyId);
        AccountingPeriod period = accountingValidationService.accountingPeriodFor(invoice.getInvoiceDate(), companyId);
        accountingPolicyService.validatePostingContext(invoice.getCompany(), fiscalYear, period, invoice.getInvoiceDate());

        GlJournalEntryRequest request = buildJournalRequest(invoice);
        accountingPolicyService.validateJournalEntry(request);
        GlJournalEntry journal = accountingPostingService.postJournalEntry(request, invoice.getCompany(), fiscalYear, period, invoice.getInvoiceDate(), TenantUtils.getCurrentUserId());
        invoice.setGlJournalEntryId(journal.getId());
        invoice.setGlPostingStatus(PostingStatus.POSTED);
        invoice.setGlPostingTime(java.time.LocalDateTime.now());
        return journal;
    }

    public GlJournalEntry createReversePosting(ApInvoice invoice) {
        GlJournalEntry original = glJournalEntryRepository.findById(invoice.getGlJournalEntryId())
            .orElseThrow(() -> new BadRequestException("Original AP journal not found", "GL_JOURNAL_NOT_FOUND"));

        GlJournalEntryRequest request = new GlJournalEntryRequest();
        request.setVoucherDate(invoice.getInvoiceDate());
        request.setReferenceNo(invoice.getInvoiceNo());
        request.setNarration("AP Invoice reversal: " + invoice.getInvoiceNo());
        request.setJournalLines(original.getJournalLines().stream()
                .map(line -> {
                    GlJournalLineRequest reverseLine = new GlJournalLineRequest();
                    reverseLine.setAccountId(line.getAccount().getId());
                    reverseLine.setDebitAmount(line.getCreditAmount());
                    reverseLine.setCreditAmount(line.getDebitAmount());
                    reverseLine.setLineDescription("Reverse: " + line.getLineDescription());
                    return reverseLine;
                })
                .toList());
        return accountingPostingService.postJournalEntry(request, invoice.getCompany(),
                accountingValidationService.fiscalYearFor(invoice.getInvoiceDate(), invoice.getCompany().getId()),
                accountingValidationService.accountingPeriodFor(invoice.getInvoiceDate(), invoice.getCompany().getId()),
                invoice.getInvoiceDate(), TenantUtils.getCurrentUserId());
    }

    private GlJournalEntryRequest buildJournalRequest(ApInvoice invoice) {
        UUID companyId = invoice.getCompany().getId();
        List<GlJournalLineRequest> lines = new java.util.ArrayList<>();
        
        BigDecimal totalItemsTaxable = ZERO;
        if (invoice.getItems() != null) {
            for (ApInvoiceItem item : invoice.getItems()) {
                totalItemsTaxable = totalItemsTaxable.add(amountOrZero(item.getTaxableAmount()));
                addExpenseLine(lines, item, companyId);
            }
        }
        
        if (totalItemsTaxable.compareTo(amountOrZero(invoice.getSubtotal())) != 0) {
            throw new BadRequestException("Sum of item taxable amounts (" + totalItemsTaxable + ") does not match invoice subtotal (" + invoice.getSubtotal() + ")", "UNBALANCED_SUBTOTAL");
        }

        addTaxLines(lines, invoice, companyId);
        addPayableLine(lines, invoice, companyId);
        
        BigDecimal tdsAmount = amountOrZero(invoice.getTdsAmount());
        if (tdsAmount.signum() > 0) {
            ChartOfAccount tdsAccount = chartOfAccountRepository.findByCompanyIdAndAccountNameIgnoreCaseAndIsDeletedFalse(companyId, "TDS Payable")
                .orElseThrow(() -> new BadRequestException("TDS Payable account not found. Please initialize company accounts.", "TDS_ACCOUNT_MISSING"));
            lines.add(creditLine(tdsAccount.getId(), tdsAmount, "TDS payable"));
        }

        GlJournalEntryRequest request = new GlJournalEntryRequest();
        request.setVoucherDate(invoice.getInvoiceDate());
        request.setReferenceNo(invoice.getInvoiceNo());
        request.setNarration("AP Invoice: " + invoice.getInvoiceNo() + " / " + invoice.getVendor().getVendorName());
        request.setJournalLines(lines);
        return request;
    }

    private void addExpenseLine(List<GlJournalLineRequest> lines, ApInvoiceItem item, UUID companyId) {
        ChartOfAccount account = accountingValidationService.postingAccount(
            item.getExpenseAccountId(), companyId, "Expense");
        BigDecimal amount = amountOrZero(item.getTaxableAmount());
        if (item.getApInvoice().getItcEligibility() == ItcEligibility.ITC_NOT_ELIGIBLE
            || item.getApInvoice().getItcEligibility() == ItcEligibility.ITC_BLOCKED) {
            amount = amount.add(amountOrZero(item.getTaxAmount()));
        }
        if (amount.signum() > 0) {
            lines.add(debitLine(account.getId(), amount, "Expense: " + item.getDescription()));
        }
    }

    private void addTaxLines(List<GlJournalLineRequest> lines, ApInvoice invoice, UUID companyId) {
        if (invoice.getItcEligibility() == ItcEligibility.ITC_NOT_ELIGIBLE
            || invoice.getItcEligibility() == ItcEligibility.ITC_BLOCKED
            || invoice.getItcEligibility() == ItcEligibility.NOT_APPLICABLE) {
            validateTaxTotal(invoice);
            return;
        }
        addTaxLine(lines, companyId, invoice.getInputCgstAccountId(), invoice.getCgstAmount(), "Input CGST");
        addTaxLine(lines, companyId, invoice.getInputSgstAccountId(), invoice.getSgstAmount(), "Input SGST");
        addTaxLine(lines, companyId, invoice.getInputIgstAccountId(), invoice.getIgstAmount(), "Input IGST");
        addTaxLine(lines, companyId, invoice.getInputCessAccountId(), invoice.getCessAmount(), "Input Cess");
        validateTaxTotal(invoice);
    }

    private void addTaxLine(List<GlJournalLineRequest> lines, UUID companyId,
                            UUID accountId, BigDecimal amount, String label) {
        BigDecimal taxAmount = amountOrZero(amount);
        if (taxAmount.signum() == 0) {
            return;
        }
        accountingValidationService.postingAccount(accountId, companyId, label);
        lines.add(debitLine(accountId, taxAmount, label));
    }

    private void addPayableLine(List<GlJournalLineRequest> lines, ApInvoice invoice, UUID companyId) {
        ChartOfAccount payable = accountingValidationService.postingAccount(
            invoice.getVendor().getPayableAccount().getId(), companyId, "Vendor payable");
        lines.add(creditLine(payable.getId(), amountOrZero(invoice.getTotalAmount()), "Vendor payable"));
    }

    private void validateTaxTotal(ApInvoice invoice) {
        BigDecimal taxableAmount = invoice.getItems() == null ? ZERO : invoice.getItems().stream()
            .map(ApInvoiceItem::getTaxableAmount)
            .filter(java.util.Objects::nonNull)
            .reduce(ZERO, BigDecimal::add);
        accountingPolicyService.validateTaxPolicy(
            taxableAmount,
            amountOrZero(invoice.getTaxAmount()),
            amountOrZero(invoice.getCgstAmount()),
            amountOrZero(invoice.getSgstAmount()),
            amountOrZero(invoice.getIgstAmount()),
            amountOrZero(invoice.getCessAmount()),
            false
        );
    }

    private GlJournalEntry saveBalanced(GlJournalEntry journal, List<GlJournalLine> lines) {
        BigDecimal debit = lines.stream().map(GlJournalLine::getDebitAmount).reduce(ZERO, BigDecimal::add);
        BigDecimal credit = lines.stream().map(GlJournalLine::getCreditAmount).reduce(ZERO, BigDecimal::add);
        journal.setTotalDebit(debit);
        journal.setTotalCredit(credit);
        journal.setJournalLines(new HashSet<>(lines));
        if (!journal.isBalanced()) {
            throw new BadRequestException("AP journal is not balanced", "UNBALANCED_JOURNAL");
        }
        GlJournalEntry saved = glJournalEntryRepository.save(journal);
        log.info("Created AP GL journal {} for source invoice {}", saved.getId(), saved.getSourceId());
        return saved;
    }

    private GlJournalEntry baseJournal(ApInvoice invoice, String voucherNo, String narrationPrefix) {
        GlJournalEntry journal = new GlJournalEntry();
        journal.setCompany(invoice.getCompany());
        journal.setFiscalYear(accountingValidationService.fiscalYearFor(invoice.getInvoiceDate(), invoice.getCompany().getId()));
        journal.setAccountingPeriod(accountingValidationService.accountingPeriodFor(invoice.getInvoiceDate(), invoice.getCompany().getId()));
        journal.setVoucherNo(voucherNo);
        journal.setVoucherDate(invoice.getInvoiceDate());
        journal.setReferenceNo(invoice.getInvoiceNo());
        journal.setSourceModule(SourceModule.AP);
        journal.setSourceId(invoice.getId());
        journal.setStatus(PostingStatus.POSTED);
        journal.setPostedBy(TenantUtils.getCurrentUserId());
        journal.setPostedAt(LocalDateTime.now());
        journal.setNarration(narrationPrefix + invoice.getInvoiceNo() + " / " + invoice.getVendor().getVendorName());
        return journal;
    }

    private GlJournalLineRequest debitLine(UUID accountId, BigDecimal amount, String description) {
        return line(accountId, amount, ZERO, description);
    }

    private GlJournalLineRequest creditLine(UUID accountId, BigDecimal amount, String description) {
        return line(accountId, ZERO, amount, description);
    }

    private GlJournalLineRequest line(UUID accountId, BigDecimal debit, BigDecimal credit, String description) {
        GlJournalLineRequest line = new GlJournalLineRequest();
        line.setAccountId(accountId);
        line.setDebitAmount(debit);
        line.setCreditAmount(credit);
        line.setLineDescription(description);
        return line;
    }

    private BigDecimal amountOrZero(BigDecimal amount) {
        return amount == null ? ZERO : amount;
    }

    private String voucherNo(String value) {
        return value.length() <= 20 ? value : value.substring(0, 20);
    }
}
