package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.repository.QuotationRepository;
import com.erp.account.modules.quotation.service.QuotationService;
import com.erp.account.modules.salesorder.service.SalesOrderService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class QuotationWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "QUOTATION";
    private final QuotationRepository repository;
    private final QuotationService service;
    private final SalesOrderService salesOrderService;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(QuotationDocument::new).orElse(null);
    }

    private final class QuotationDocument implements WorkflowDocument {
        private final Quotation quotation;

        private QuotationDocument(Quotation quotation) {
            this.quotation = quotation;
        }

        public UUID getId() {
            return quotation.getId();
        }

        public UUID getCompanyId() {
            return quotation.getCompanyId();
        }

        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        public String getDocumentNumber() {
            return quotation.getQuotationNumber();
        }

        public BigDecimal getAmount() {
            return quotation.getTotalAmount();
        }

        public UUID getOwnerId() {
            return quotation.getSalesManagerId() != null ? quotation.getSalesManagerId() : quotation.getCreatedBy();
        }

        @Transactional
        public void onWorkflowSubmitted() {
            quotation.setStatus(com.erp.account.modules.quotation.entity.QuotationStatus.DRAFT);
            repository.save(quotation);
        }

        @Transactional
        public void onWorkflowApproved() {
            onWorkflowApproved(null);
        }

        @Override
        @Transactional
        public void onWorkflowApproved(Map<String, Object> metadata) {
            boolean customerAcceptance = metadata != null && Boolean.TRUE.equals(metadata.get("customerAcceptance"));
            boolean autoCreateOrder = metadata != null && Boolean.TRUE.equals(metadata.get("autoCreateOrder"));

            if (customerAcceptance) {
                // Internal approval only; quotation moves to SENT waiting for customer acceptance
                service.approveQuotation(quotation.getCompanyId(), quotation.getId());
                log.info("Quotation {} approved internally via workflow, awaiting customer acceptance", quotation.getQuotationNumber());
            } else {
                // Customer acceptance NOT required; quotation is directly ACCEPTED
                service.acceptQuotation(quotation.getCompanyId(), quotation.getId());
                log.info("Quotation {} marked ACCEPTED via workflow", quotation.getQuotationNumber());

                if (autoCreateOrder) {
                    try {
                        log.info("Auto-creating Sales Order for approved quotation {}", quotation.getQuotationNumber());
                        salesOrderService.createDirectFromQuotation(quotation.getCompanyId(), quotation.getId());
                    } catch (Exception ex) {
                        log.error("Failed to auto-create Sales Order for quotation {}: {}", quotation.getQuotationNumber(), ex.getMessage(), ex);
                    }
                }
            }
        }

        @Transactional
        public void onWorkflowRejected() {
            service.rejectQuotation(quotation.getCompanyId(), quotation.getId());
        }

        @Transactional
        public void onWorkflowCancelled() {
            service.cancelQuotation(quotation.getCompanyId(), quotation.getId());
        }

        @Transactional
        public void onWorkflowReturned() {
            quotation.setStatus(com.erp.account.modules.quotation.entity.QuotationStatus.DRAFT);
            repository.save(quotation);
        }
    }
}
