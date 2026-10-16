package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import com.erp.account.security.CurrentUserContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SalesInvoiceWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "SALES_INVOICE";
    private final SalesInvoiceRepository repository;
    private final SalesInvoiceService service;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(SalesInvoiceDocument::new).orElse(null);
    }

    private final class SalesInvoiceDocument implements WorkflowDocument {
        private final SalesInvoice invoice;
        private SalesInvoiceDocument(SalesInvoice invoice) { this.invoice = invoice; }
        public UUID getId() { return invoice.getId(); }
        public UUID getCompanyId() { return invoice.getCompanyId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return invoice.getInvoiceNumber(); }
        public BigDecimal getAmount() { return invoice.getTotalAmount(); }
        public UUID getOwnerId() { return invoice.getCreatedBy(); }
        @Transactional
        public void onWorkflowSubmitted() {
            invoice.setStatus(InvoiceStatus.PENDING_APPROVAL);
            repository.save(invoice);
        }
        @Transactional
        public void onWorkflowApproved() {
            if (InvoiceStatus.POSTED.equals(invoice.getStatus()) || com.erp.account.enums.PostingStatus.POSTED.equals(invoice.getGlPostingStatus())) {
                return;
            }
            invoice.setStatus(InvoiceStatus.APPROVED);
            invoice.setApprovedBy(CurrentUserContext.getUserId());
            invoice.setApprovedAt(LocalDateTime.now());
            repository.save(invoice);
            service.postInvoice(invoice.getId());
        }
        @Transactional
        public void onWorkflowRejected() {
            if (com.erp.account.enums.PostingStatus.POSTED.equals(invoice.getGlPostingStatus())) {
                return;
            }
            invoice.setStatus(InvoiceStatus.REJECTED);
            repository.save(invoice);
        }
        @Transactional
        public void onWorkflowCancelled() {
            if (com.erp.account.enums.PostingStatus.POSTED.equals(invoice.getGlPostingStatus())) {
                return;
            }
            service.cancelInvoice(invoice.getId());
        }
        @Transactional
        public void onWorkflowReturned() {
            if (com.erp.account.enums.PostingStatus.POSTED.equals(invoice.getGlPostingStatus())) {
                return;
            }
            invoice.setStatus(InvoiceStatus.DRAFT);
            repository.save(invoice);
        }
    }
}
