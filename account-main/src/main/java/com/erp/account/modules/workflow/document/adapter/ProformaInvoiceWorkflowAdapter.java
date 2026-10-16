package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import com.erp.account.modules.proformainvoice.repository.ProformaInvoiceRepository;
import com.erp.account.modules.proformainvoice.service.ProformaInvoiceService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProformaInvoiceWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "PROFORMA_INVOICE";
    private final ProformaInvoiceRepository repository;
    private final ProformaInvoiceService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(ProformaInvoiceDocument::new).orElse(null);
    }

    private final class ProformaInvoiceDocument implements WorkflowDocument {
        private final ProformaInvoice pi;

        private ProformaInvoiceDocument(ProformaInvoice pi) {
            this.pi = pi;
        }

        public UUID getId() {
            return pi.getId();
        }

        public UUID getCompanyId() {
            return pi.getCompanyId();
        }

        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        public String getDocumentNumber() {
            return pi.getPiNumber();
        }

        public BigDecimal getAmount() {
            return pi.getTotalAmount();
        }

        public UUID getOwnerId() {
            return pi.getCreatedBy();
        }

        @Transactional
        public void onWorkflowSubmitted() {
            pi.setStatus(ProformaInvoiceStatus.DRAFT);
            repository.save(pi);
        }

        @Transactional
        public void onWorkflowApproved() {
            service.confirmPI(pi.getCompanyId(), pi.getId());
            log.info("Proforma Invoice {} confirmed via workflow approval", pi.getPiNumber());
        }

        @Transactional
        public void onWorkflowRejected() {
            service.cancelPI(pi.getCompanyId(), pi.getId());
            log.info("Proforma Invoice {} rejected/cancelled via workflow", pi.getPiNumber());
        }

        @Transactional
        public void onWorkflowCancelled() {
            service.cancelPI(pi.getCompanyId(), pi.getId());
            log.info("Proforma Invoice {} cancelled via workflow", pi.getPiNumber());
        }

        @Transactional
        public void onWorkflowReturned() {
            pi.setStatus(ProformaInvoiceStatus.DRAFT);
            repository.save(pi);
        }
    }
}
