package com.erp.account.modules.accounting.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.common.service.VoucherNumberGenerator;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.ledger.repository.ChartOfAccountRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AccountingPostingService {

    private final AccountingPolicyService accountingPolicyService;
    private final GlJournalEntryRepository glJournalEntryRepository;
    private final ChartOfAccountRepository chartOfAccountRepository;
    private final VoucherNumberGenerator voucherNumberGenerator;

    public GlJournalEntry postJournalEntry(GlJournalEntryRequest request, Company company, FiscalYear fiscalYear,
                                           AccountingPeriod period, LocalDate postingDate, UUID createdBy) {
        accountingPolicyService.validatePostingContext(company, fiscalYear, period, postingDate);
        accountingPolicyService.validateJournalEntry(request);

        GlJournalEntry entry = new GlJournalEntry();
        entry.setCompany(company);
        entry.setFiscalYear(fiscalYear);
        entry.setAccountingPeriod(period);
        entry.setVoucherDate(postingDate);
        entry.setVoucherNo(voucherNumberGenerator.generateVoucherNo(company.getId(), postingDate));
        entry.setPostedAt(LocalDateTime.now());
        entry.setStatus(PostingStatus.POSTED);
        entry.setNarration(request.getNarration());
        entry.setReferenceNo(request.getReferenceNo());
        entry.setSourceModule(request.getSourceModule());
        entry.setSourceId(request.getSourceId());
        entry.setEventType(request.getEventType());
        entry.setIdempotencyKey(request.getIdempotencyKey());
        entry.setCreatedBy(createdBy);
        entry.setPostedBy(createdBy);

        List<GlJournalLine> lines = new ArrayList<>();
        int sequence = 1;
        for (var lineRequest : request.getJournalLines()) {
            if (lineRequest.getAccountId() == null) {
                throw new BadRequestException("Journal line account is required", "ACCOUNT_REQUIRED");
            }
            ChartOfAccount account = chartOfAccountRepository.findById(lineRequest.getAccountId())
                    .orElseThrow(() -> new BadRequestException("Account not found", "ACCOUNT_NOT_FOUND"));
            accountingPolicyService.validateAccountForPosting(account, company.getId(), "Journal");

            GlJournalLine line = new GlJournalLine();
            line.setCompany(company);
            line.setJournalEntry(entry);
            line.setAccount(account);
            line.setDebitAmount(lineRequest.getDebitAmount());
            line.setCreditAmount(lineRequest.getCreditAmount());
            line.setLineDescription(lineRequest.getLineDescription());
            line.setCurrencyCode(lineRequest.getCurrencyCode());
            line.setExchangeRate(lineRequest.getExchangeRate());
            line.setCreatedBy(createdBy);
            lines.add(line);
            sequence++;
        }

        entry.setJournalLines(new HashSet<>(lines));
        entry.setTotalDebit(lines.stream().map(GlJournalLine::getDebitAmount).filter(java.util.Objects::nonNull).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        entry.setTotalCredit(lines.stream().map(GlJournalLine::getCreditAmount).filter(java.util.Objects::nonNull).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add));
        if (!entry.isBalanced()) {
            throw new ValidationException("Shared accounting posting engine produced an unbalanced journal entry");
        }
        GlJournalEntry saved = glJournalEntryRepository.save(entry);
        return saved;
    }
}
