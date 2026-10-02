package com.erp.account.modules.creditnote.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.creditnote.dto.request.CreditNoteFilterDto;
import com.erp.account.modules.creditnote.dto.request.CreditNoteRequest;
import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public interface CreditNoteService {
    CreditNoteResponse createCreditNote(UUID companyId, RequestWrapper<CreditNoteRequest> request);
    CreditNoteResponse getCreditNoteById(UUID creditNoteId);
    com.erp.account.modules.creditnote.dto.response.profile.CreditNoteProfileResponse getCreditNoteProfileById(UUID creditNoteId);
    CreditNoteResponse updateCreditNote(UUID creditNoteId, RequestWrapper<CreditNoteRequest> request);
    void deleteCreditNote(UUID creditNoteId);
    void submitCreditNote(UUID creditNoteId);
    void approveCreditNote(UUID creditNoteId);
    void rejectCreditNote(UUID creditNoteId);
    void postCreditNote(UUID creditNoteId);
    void reverseCreditNote(UUID creditNoteId);
    void cancelCreditNote(UUID creditNoteId);
    Page<CreditNoteResponse> getAllCreditNotes(CreditNoteFilterDto filter, Pageable pageable);
}
