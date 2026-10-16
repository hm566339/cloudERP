package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.supplierquotation.entity.SupplierQuotation;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotationStatus;
import com.erp.account.modules.supplierquotation.repository.SupplierQuotationRepository;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SupplierQuotationWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "SUPPLIER_QUOTATION";
    private final SupplierQuotationRepository repository;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(SupplierQuotationDocument::new).orElse(null);
    }

    private final class SupplierQuotationDocument implements WorkflowDocument {
        private final SupplierQuotation quotation;

        private SupplierQuotationDocument(SupplierQuotation quotation) {
            this.quotation = quotation;
        }

        @Override
        public UUID getId() {
            return quotation.getId();
        }

        @Override
        public UUID getCompanyId() {
            return quotation.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return quotation.getQuotationNumber();
        }

        @Override
        public BigDecimal getAmount() {
            return quotation.getGrandTotal();
        }

        @Override
        public UUID getOwnerId() {
            return quotation.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            quotation.setStatus(SupplierQuotationStatus.SUBMITTED);
            repository.save(quotation);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            quotation.setStatus(SupplierQuotationStatus.AWARDED);
            quotation.setAwardedAt(LocalDateTime.now());
            repository.save(quotation);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            quotation.setStatus(SupplierQuotationStatus.REJECTED);
            repository.save(quotation);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            quotation.setStatus(SupplierQuotationStatus.CANCELLED);
            repository.save(quotation);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            quotation.setStatus(SupplierQuotationStatus.DRAFT);
            repository.save(quotation);
        }
    }
}
