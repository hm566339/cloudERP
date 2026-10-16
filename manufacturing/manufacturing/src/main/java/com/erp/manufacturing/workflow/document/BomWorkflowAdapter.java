package com.erp.manufacturing.workflow.document;

import com.erp.manufacturing.bom.entity.Bom;
import com.erp.manufacturing.bom.repository.BomRepository;
import com.erp.manufacturing.common.enums.BomStatus;
import com.erp.manufacturing.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class BomWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "BOM";

    private final BomRepository repository;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findById(documentId)
                .filter(b -> companyId.equals(b.getCompanyId()))
                .map(BomDocument::new)
                .orElse(null);
    }

    private final class BomDocument implements WorkflowDocument {
        private final Bom bom;

        private BomDocument(Bom bom) {
            this.bom = bom;
        }

        @Override
        public UUID getId() {
            return bom.getId();
        }

        @Override
        public UUID getCompanyId() {
            return bom.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return bom.getBomNumber();
        }

        @Override
        public BigDecimal getAmount() {
            return bom.getCurrentRevision() != null ? BigDecimal.valueOf(bom.getCurrentRevision()) : BigDecimal.ONE;
        }

        @Override
        public UUID getOwnerId() {
            return bom.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            bom.setStatus(BomStatus.PENDING_APPROVAL);
            repository.save(bom);
            log.info("BOM {} status set to PENDING_APPROVAL", bom.getBomNumber());
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (BomStatus.APPROVED.equals(bom.getStatus()) || BomStatus.ACTIVE.equals(bom.getStatus())) {
                log.info("BOM {} already approved or active, skipping duplicate callback", bom.getBomNumber());
                return;
            }
            log.info("BOM {} approved via workflow callback. Transitioning to APPROVED.", bom.getBomNumber());
            bom.setStatus(BomStatus.APPROVED);
            bom.setApprovedAt(LocalDateTime.now());
            UUID currentUserId = TenantUtils.getCurrentUserId();
            if (currentUserId != null) {
                bom.setApprovedBy(currentUserId);
            }
            repository.save(bom);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            if (BomStatus.CANCELLED.equals(bom.getStatus())) {
                return;
            }
            log.info("BOM {} rejected via workflow callback", bom.getBomNumber());
            bom.setStatus(BomStatus.CANCELLED);
            repository.save(bom);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            if (BomStatus.CANCELLED.equals(bom.getStatus())) {
                return;
            }
            log.info("BOM {} cancelled via workflow callback", bom.getBomNumber());
            bom.setStatus(BomStatus.CANCELLED);
            repository.save(bom);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            log.info("BOM {} returned via workflow callback", bom.getBomNumber());
            bom.setStatus(BomStatus.DRAFT);
            repository.save(bom);
        }
    }
}
