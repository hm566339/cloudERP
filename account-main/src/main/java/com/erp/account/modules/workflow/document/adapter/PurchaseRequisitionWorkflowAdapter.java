package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisitionStatus;
import com.erp.account.modules.purchaserequisition.repository.PurchaseRequisitionRepository;
import com.erp.account.modules.purchaserequisition.service.PurchaseRequisitionService;
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
public class PurchaseRequisitionWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "PURCHASE_REQUISITION";
    private final PurchaseRequisitionRepository repository;
    private final PurchaseRequisitionService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(PurchaseRequisitionDocument::new).orElse(null);
    }

    private final class PurchaseRequisitionDocument implements WorkflowDocument {
        private final PurchaseRequisition requisition;

        private PurchaseRequisitionDocument(PurchaseRequisition requisition) {
            this.requisition = requisition;
        }

        public UUID getId() {
            return requisition.getId();
        }

        public UUID getCompanyId() {
            return requisition.getCompanyId();
        }

        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        public String getDocumentNumber() {
            return requisition.getRequisitionNumber();
        }

        public BigDecimal getAmount() {
            return BigDecimal.ZERO;
        }

        public UUID getOwnerId() {
            return requisition.getRequesterId() != null ? requisition.getRequesterId() : requisition.getCreatedBy();
        }

        @Transactional
        public void onWorkflowSubmitted() {
            requisition.setStatus(PurchaseRequisitionStatus.SUBMITTED);
            repository.save(requisition);
        }

        @Transactional
        public void onWorkflowApproved() {
            service.approve(requisition.getCompanyId(), requisition.getId());
            log.info("Purchase Requisition {} approved via workflow", requisition.getRequisitionNumber());
        }

        @Transactional
        public void onWorkflowRejected() {
            service.reject(requisition.getCompanyId(), requisition.getId(), "Rejected via workflow");
            log.info("Purchase Requisition {} rejected via workflow", requisition.getRequisitionNumber());
        }

        @Transactional
        public void onWorkflowCancelled() {
            service.cancel(requisition.getCompanyId(), requisition.getId());
            log.info("Purchase Requisition {} cancelled via workflow", requisition.getRequisitionNumber());
        }

        @Transactional
        public void onWorkflowReturned() {
            requisition.setStatus(PurchaseRequisitionStatus.DRAFT);
            repository.save(requisition);
        }
    }
}
