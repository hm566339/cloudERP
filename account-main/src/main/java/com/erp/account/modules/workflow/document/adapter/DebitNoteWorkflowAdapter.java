package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.modules.debitnote.entity.DebitNote;
import com.erp.account.modules.debitnote.repository.DebitNoteRepository;
import com.erp.account.modules.debitnote.service.DebitNoteService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DebitNoteWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "DEBIT_NOTE";
    private final DebitNoteRepository repository;
    private final DebitNoteService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(DebitNoteDocument::new).orElse(null);
    }

    private final class DebitNoteDocument implements WorkflowDocument {
        private final DebitNote debitNote;

        private DebitNoteDocument(DebitNote debitNote) {
            this.debitNote = debitNote;
        }

        @Override
        public UUID getId() {
            return debitNote.getId();
        }

        @Override
        public UUID getCompanyId() {
            return debitNote.getCompany() == null ? null : debitNote.getCompany().getId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return debitNote.getDebitNoteNo();
        }

        @Override
        public BigDecimal getAmount() {
            return debitNote.getAmount();
        }

        @Override
        public UUID getOwnerId() {
            return debitNote.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            debitNote.setStatus(DocumentStatus.SUBMITTED);
            repository.save(debitNote);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (DocumentStatus.POSTED.equals(debitNote.getStatus())) {
                return;
            }
            debitNote.setStatus(DocumentStatus.APPROVED);
            repository.save(debitNote);
            try {
                service.postDebitNote(debitNote.getId());
            } catch (Exception e) {
                // If direct posting requires additional checks, keep APPROVED
            }
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            debitNote.setStatus(DocumentStatus.REJECTED);
            repository.save(debitNote);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            debitNote.setStatus(DocumentStatus.CANCELLED);
            repository.save(debitNote);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            debitNote.setStatus(DocumentStatus.DRAFT);
            repository.save(debitNote);
        }
    }
}
