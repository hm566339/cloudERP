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
            challan.setStatus(DeliveryChallanStatus.DRAFT);
            repository.save(challan);
        }

        @Transactional
        public void onWorkflowApproved() {
            service.confirmDeliveryChallan(challan.getCompanyId(), challan.getId());
            log.info("Delivery Challan {} confirmed via workflow approval", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowRejected() {
            service.cancelDeliveryChallan(challan.getCompanyId(), challan.getId());
            log.info("Delivery Challan {} rejected/cancelled via workflow", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowCancelled() {
            service.cancelDeliveryChallan(challan.getCompanyId(), challan.getId());
            log.info("Delivery Challan {} cancelled via workflow", challan.getDcNumber());
        }

        @Transactional
        public void onWorkflowReturned() {
            challan.setStatus(DeliveryChallanStatus.DRAFT);
            repository.save(challan);
        }
    }
}
