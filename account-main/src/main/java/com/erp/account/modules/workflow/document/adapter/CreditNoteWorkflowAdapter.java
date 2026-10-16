package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.modules.creditnote.entity.CreditNote;
import com.erp.account.modules.creditnote.repository.CreditNoteRepository;
import com.erp.account.modules.creditnote.service.CreditNoteService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class CreditNoteWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "CREDIT_NOTE";
    private final CreditNoteRepository repository;
    private final CreditNoteService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(CreditNoteDocument::new).orElse(null);
    }

    private final class CreditNoteDocument implements WorkflowDocument {
        private final CreditNote creditNote;

        private CreditNoteDocument(CreditNote creditNote) {
            this.creditNote = creditNote;
        }

        @Override
        public UUID getId() {
            return creditNote.getId();
        }

        @Override
        public UUID getCompanyId() {
            return creditNote.getCompany() == null ? null : creditNote.getCompany().getId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return creditNote.getCreditNoteNo();
        }

        @Override
        public BigDecimal getAmount() {
            return creditNote.getAmount();
        }

        @Override
        public UUID getOwnerId() {
            return creditNote.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            creditNote.setStatus(DocumentStatus.SUBMITTED);
            repository.save(creditNote);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (DocumentStatus.POSTED.equals(creditNote.getStatus())) {
                return;
            }
            creditNote.setStatus(DocumentStatus.APPROVED);
            repository.save(creditNote);
            try {
                service.postCreditNote(creditNote.getId());
            } catch (Exception e) {
                // If direct posting requires further finance interaction, keep APPROVED
            }
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            creditNote.setStatus(DocumentStatus.REJECTED);
            repository.save(creditNote);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            creditNote.setStatus(DocumentStatus.CANCELLED);
            repository.save(creditNote);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            creditNote.setStatus(DocumentStatus.DRAFT);
            repository.save(creditNote);
        }
    }
}
