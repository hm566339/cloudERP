package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.repository.GlJournalEntryRepository;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class GlJournalWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "JOURNAL_ENTRY";
    private final GlJournalEntryRepository repository;
    private final GlJournalEntryService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(GlJournalDocument::new).orElse(null);
    }

    private final class GlJournalDocument implements WorkflowDocument {
        private final GlJournalEntry entry;

        private GlJournalDocument(GlJournalEntry entry) {
            this.entry = entry;
        }

        @Override
        public UUID getId() {
            return entry.getId();
        }

        @Override
        public UUID getCompanyId() {
            return entry.getCompany() == null ? null : entry.getCompany().getId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return entry.getVoucherNo();
        }

        @Override
        public BigDecimal getAmount() {
            return entry.getTotalDebit();
        }

        @Override
        public UUID getOwnerId() {
            return entry.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            // Keep DRAFT during approval
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (PostingStatus.POSTED.equals(entry.getStatus())) {
                return;
            }
            service.postJournalEntry(entry.getId());
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            if (PostingStatus.POSTED.equals(entry.getStatus())) {
                return;
            }
            service.cancelJournalEntry(entry.getId());
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            if (PostingStatus.POSTED.equals(entry.getStatus())) {
                return;
            }
            service.cancelJournalEntry(entry.getId());
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            entry.setStatus(PostingStatus.DRAFT);
            repository.save(entry);
        }
    }
}
