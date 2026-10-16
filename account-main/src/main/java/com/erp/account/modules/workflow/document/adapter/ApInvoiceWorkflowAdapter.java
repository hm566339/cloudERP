package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.apinvoice.repository.ApInvoiceRepository;
import com.erp.account.modules.apinvoice.service.ApInvoiceService;
import com.erp.account.modules.apinvoice.service.InvoiceWorkflowService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ApInvoiceWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "AP_INVOICE";
    private final ApInvoiceRepository repository;
    private final ApInvoiceService service;
    private final InvoiceWorkflowService invoiceWorkflowService;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(ApInvoiceDocument::new).orElse(null);
    }

    private final class ApInvoiceDocument implements WorkflowDocument {
        private final ApInvoice invoice;
        private ApInvoiceDocument(ApInvoice invoice) { this.invoice = invoice; }
        public UUID getId() { return invoice.getId(); }
        public UUID getCompanyId() { return invoice.getCompany() == null ? null : invoice.getCompany().getId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return invoice.getInvoiceNo(); }
        public BigDecimal getAmount() { return invoice.getTotalAmount(); }
        public UUID getOwnerId() { return invoice.getCreatedBy(); }
        @Transactional
        public void onWorkflowSubmitted() {
            invoiceWorkflowService.submitForApproval(invoice);
            repository.save(invoice);
        }
        @Transactional
        public void onWorkflowReturned() {
            if (invoice.getStatus() == InvoiceStatus.APPROVED || invoice.getStatus() == InvoiceStatus.POSTED) {
                return;
            }
            invoice.setStatus(InvoiceStatus.DRAFT);
            repository.save(invoice);
        }
        @Transactional
        public void onWorkflowApproved() {
            if (invoice.getStatus() == InvoiceStatus.APPROVED || invoice.getStatus() == InvoiceStatus.POSTED) {
                return;
            }
            invoiceWorkflowService.approve(invoice);
            repository.save(invoice);
            service.postInvoice(invoice.getId());
        }
        @Transactional
        public void onWorkflowRejected() {
            if (invoice.getStatus() == InvoiceStatus.APPROVED || invoice.getStatus() == InvoiceStatus.POSTED) {
                return;
            }
            invoice.setStatus(InvoiceStatus.REJECTED);
            repository.save(invoice);
        }
        @Transactional
        public void onWorkflowCancelled() {
            if (invoice.getStatus() == InvoiceStatus.APPROVED || invoice.getStatus() == InvoiceStatus.POSTED) {
                return;
            }
            invoiceWorkflowService.cancel(invoice);
            repository.save(invoice);
        }
    }
}
