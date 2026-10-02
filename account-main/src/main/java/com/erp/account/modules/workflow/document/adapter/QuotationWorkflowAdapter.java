package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class QuotationWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "QUOTATION";
    private final QuotationRepository repository;
    private final QuotationService service;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(QuotationDocument::new).orElse(null);
    }

    private final class QuotationDocument implements WorkflowDocument {
        private final Quotation quotation;
        private QuotationDocument(Quotation quotation) { this.quotation = quotation; }
        public UUID getId() { return quotation.getId(); }
        public UUID getCompanyId() { return quotation.getCompanyId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return quotation.getQuotationNumber(); }
        public BigDecimal getAmount() { return quotation.getTotalAmount(); }
        public UUID getOwnerId() { return quotation.getSalesManagerId() != null ? quotation.getSalesManagerId() : quotation.getCreatedBy(); }
        public void onWorkflowSubmitted() { service.sendQuotation(quotation.getCompanyId(), quotation.getId()); }
        public void onWorkflowApproved() { service.approveQuotation(quotation.getCompanyId(), quotation.getId()); }
        public void onWorkflowRejected() { service.rejectQuotation(quotation.getCompanyId(), quotation.getId()); }
        public void onWorkflowCancelled() { service.cancelQuotation(quotation.getCompanyId(), quotation.getId()); }
    }
}
