package com.erp.account.modules.gljournal.service;

import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineRequest;
import com.erp.account.modules.gljournal.dto.request.GlJournalLineFilterDto;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface GlJournalLineService {

    GlJournalLineResponse createLine(UUID journalEntryId, RequestWrapper<GlJournalLineRequest> request);

    GlJournalLineResponse updateLine(UUID id, RequestWrapper<GlJournalLineRequest> request);

    void deleteLine(UUID id);

    void validateLine(GlJournalLineRequest request, String baseCurrency);

    GlJournalLineResponse getLineById(UUID id);

    com.erp.account.modules.gljournal.dto.response.GlJournalLineProfileResponse getLineProfileById(UUID id);

    Page<GlJournalLineResponse> getAllLines(GlJournalLineFilterDto filter, Pageable pageable);

    Page<GlJournalLineResponse> getLinesByJournal(UUID journalEntryId, Pageable pageable);

    Page<GlJournalLineResponse> getAccountTransactions(UUID accountId, Pageable pageable);

    BigDecimal calculateDebitTotal(UUID accountId);

    BigDecimal calculateCreditTotal(UUID accountId);

    long recalculateJournalTotals(UUID journalEntryId);

    List<GlJournalLineResponse> getLedgerLines(UUID accountId, Pageable pageable);
}
