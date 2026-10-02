package com.erp.account.modules.gljournal.service;

import com.erp.account.modules.reporting.dto.response.BalanceSheetReport;
import com.erp.account.modules.reporting.dto.response.GeneralLedgerLine;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryListResponse;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryResponse;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryFilterDto;
import com.erp.account.modules.reporting.dto.response.ProfitLossReport;
import com.erp.account.modules.reporting.dto.response.TrialBalanceLine;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.PostingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Service
public interface GlJournalEntryService {

    GlJournalEntryResponse createJournalEntry(RequestWrapper<GlJournalEntryRequest> request, UUID companyIdUUID);

    GlJournalEntryResponse updateJournalEntry(UUID journalEntryId, RequestWrapper<GlJournalEntryRequest> request);

    void deleteJournalEntry(UUID journalEntryId);

    GlJournalEntryResponse postJournalEntry(UUID journalEntryId);

    GlJournalEntryResponse reverseJournalEntry(UUID journalEntryId);

    void cancelJournalEntry(UUID journalEntryId);

    void validateJournalEntry(GlJournalEntryRequest request);

    String generateVoucherNo(UUID companyId, LocalDate voucherDate);

    GlJournalEntryResponse getJournalById(UUID journalEntryId);

    com.erp.account.modules.gljournal.dto.response.GlJournalProfileResponse getJournalProfileById(UUID journalEntryId);

    GlJournalEntryResponse getJournalByVoucherNo(UUID companyId, String voucherNo);

    Page<GlJournalEntryListResponse> getAllJournals(GlJournalEntryFilterDto filter, Pageable pageable);

    Page<GeneralLedgerLine> getAccountLedger(UUID companyId, UUID accountId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    Page<TrialBalanceLine> getTrialBalance(UUID companyId, LocalDate startDate, LocalDate endDate, Pageable pageable);

    BalanceSheetReport getBalanceSheetData(UUID companyId, UUID fiscalYearId);

    ProfitLossReport getProfitLossData(UUID companyId, UUID fiscalYearId);

    GlJournalEntryResponse createAutoJournal(GlJournalEntryRequest request);

    void validateBalancedEntry(GlJournalEntryRequest request);
}
