package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.repository.DeliveryChallanRepository;
import com.erp.account.modules.deliverychallan.service.DeliveryChallanService;
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
public class DeliveryChallanWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "DELIVERY_CHALLAN";
    private final DeliveryChallanRepository repository;
    private final DeliveryChallanService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(DeliveryChallanDocument::new).orElse(null);
    }

    private final class DeliveryChallanDocument implements WorkflowDocument {
        private final DeliveryChallan challan;

        private DeliveryChallanDocument(DeliveryChallan challan) {
            this.challan = challan;
        }

        public UUID getId() {
            return challan.getId();
        }

        public UUID getCompanyId() {
            return challan.getCompanyId();
        }

        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        public String getDocumentNumber() {
            return challan.getDcNumber();
        }

        public BigDecimal getAmount() {
            return BigDecimal.ZERO; // Challans are quantity/movement-based documents
        }

        public UUID getOwnerId() {
            return challan.getCreatedBy();
        }

        @Transactional
        public void onWorkflowSubmitted() {
            challan.setStatus(DeliveryChallanStatus.PENDING_APPROVAL);
            repository.save(challan);
            log.info("Delivery Challan {} marked PENDING_APPROVAL via workflow", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowApproved() {
            challan.setStatus(DeliveryChallanStatus.APPROVED);
            repository.save(challan);
            try {
                service.confirmDeliveryChallan(challan.getCompanyId(), challan.getId());
            } catch (Exception e) {
                log.info("Delivery Challan {} confirmed after approval: {}", challan.getDcNumber(), e.getMessage());
            }
            log.info("Delivery Challan {} marked APPROVED via workflow approval", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowRejected() {
            challan.setStatus(DeliveryChallanStatus.REJECTED);
            repository.save(challan);
            log.info("Delivery Challan {} marked REJECTED via workflow", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowCancelled() {
            challan.setStatus(DeliveryChallanStatus.CANCELLED);
            repository.save(challan);
            log.info("Delivery Challan {} cancelled via workflow", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowReturned() {
            challan.setStatus(DeliveryChallanStatus.CHANGES_REQUESTED);
            repository.save(challan);
            log.info("Delivery Challan {} marked CHANGES_REQUESTED via workflow", challan.getDcNumber());
        }
    }
}
