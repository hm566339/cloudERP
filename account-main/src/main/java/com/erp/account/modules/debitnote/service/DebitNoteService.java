package com.erp.account.modules.debitnote.service;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.modules.debitnote.dto.request.DebitNoteFilterDto;
import com.erp.account.modules.debitnote.dto.request.DebitNoteRequest;
import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.modules.debitnote.dto.response.profile.DebitNoteProfileResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public interface DebitNoteService {
    DebitNoteResponse createDebitNote(UUID companyId, RequestWrapper<DebitNoteRequest> requestWrapper);

    DebitNoteResponse updateDebitNote(UUID debitNoteId, RequestWrapper<DebitNoteRequest> requestWrapper);

    void deleteDebitNote(UUID debitNoteId);

    DebitNoteProfileResponse getDebitNoteProfileById(UUID debitNoteId);

    DebitNoteResponse approveDebitNote(UUID debitNoteId);

    DebitNoteResponse postDebitNote(UUID debitNoteId);

    DebitNoteResponse reverseDebitNote(UUID debitNoteId);

    DebitNoteResponse cancelDebitNote(UUID debitNoteId);

    Page<DebitNoteResponse> getAllDebitNotes(DebitNoteFilterDto filter, Pageable pageable);
}
