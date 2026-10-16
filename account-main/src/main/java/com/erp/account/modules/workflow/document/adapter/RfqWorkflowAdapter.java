package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.rfq.entity.RfqStatus;
import com.erp.account.modules.rfq.repository.RfqRepository;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class RfqWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "RFQ";
    private final RfqRepository repository;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(RfqDocument::new).orElse(null);
    }

    private final class RfqDocument implements WorkflowDocument {
        private final Rfq rfq;

        private RfqDocument(Rfq rfq) {
            this.rfq = rfq;
        }

        @Override
        public UUID getId() {
            return rfq.getId();
        }

        @Override
        public UUID getCompanyId() {
            return rfq.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return rfq.getRfqNumber();
        }

        @Override
        public BigDecimal getAmount() {
            return BigDecimal.ZERO;
        }

        @Override
        public UUID getOwnerId() {
            return rfq.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            rfq.setStatus(RfqStatus.EVALUATION);
            repository.save(rfq);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            rfq.setStatus(RfqStatus.SENT);
            repository.save(rfq);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            rfq.setStatus(RfqStatus.CANCELLED);
            repository.save(rfq);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            rfq.setStatus(RfqStatus.CANCELLED);
            repository.save(rfq);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            rfq.setStatus(RfqStatus.DRAFT);
            repository.save(rfq);
        }
    }
}
