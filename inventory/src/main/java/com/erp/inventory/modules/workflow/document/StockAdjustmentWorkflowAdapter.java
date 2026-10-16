package com.erp.inventory.modules.workflow.document;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import com.erp.inventory.modules.adjustment.entity.StockAdjustmentLine;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentLineRepository;
import com.erp.inventory.modules.adjustment.repository.StockAdjustmentRepository;
import com.erp.inventory.modules.adjustment.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class StockAdjustmentWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "STOCK_ADJUSTMENT";

    private final StockAdjustmentRepository repository;
    private final StockAdjustmentLineRepository lineRepository;
    private final StockAdjustmentService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyId(documentId, companyId)
                .map(StockAdjustmentDocument::new)
                .orElse(null);
    }

    private final class StockAdjustmentDocument implements WorkflowDocument {
        private final StockAdjustment adjustment;

        private StockAdjustmentDocument(StockAdjustment adjustment) {
            this.adjustment = adjustment;
        }

        @Override
        public UUID getId() {
            return adjustment.getId();
        }

        @Override
        public UUID getCompanyId() {
            return adjustment.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return adjustment.getAdjustmentNo();
        }

        @Override
        public BigDecimal getAmount() {
            List<StockAdjustmentLine> lines = lineRepository.findAllByStockAdjustmentIdAndCompanyId(adjustment.getId(), adjustment.getCompanyId());
            BigDecimal total = BigDecimal.ZERO;
            for (StockAdjustmentLine line : lines) {
                if (line.getAdjustmentValue() != null) {
                    total = total.add(line.getAdjustmentValue().abs());
                } else if (line.getQuantity() != null && line.getUnitCost() != null) {
                    total = total.add(line.getQuantity().multiply(line.getUnitCost()));
                }
            }
            return total;
        }

        @Override
        public UUID getOwnerId() {
            return adjustment.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            adjustment.setStatus("PENDING_APPROVAL");
            repository.save(adjustment);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if ("APPROVED".equalsIgnoreCase(adjustment.getStatus())) {
                log.info("Stock adjustment {} already approved, skipping duplicate approval callback", adjustment.getAdjustmentNo());
                return;
            }
            log.info("Stock adjustment {} approved via workflow callback. Processing stock movement.", adjustment.getAdjustmentNo());
            service.processStockAdjustmentMovement(adjustment.getId(), adjustment.getCompanyId());
            adjustment.setStatus("APPROVED");
            adjustment.setApprovedAt(LocalDateTime.now());
            adjustment.setApprovedBy(CurrentUserContext.getUserId());
            repository.save(adjustment);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            log.info("Stock adjustment {} rejected via workflow callback", adjustment.getAdjustmentNo());
            adjustment.setStatus("REJECTED");
            repository.save(adjustment);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            log.info("Stock adjustment {} cancelled via workflow callback", adjustment.getAdjustmentNo());
            adjustment.setStatus("CANCELLED");
            repository.save(adjustment);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            log.info("Stock adjustment {} returned via workflow callback", adjustment.getAdjustmentNo());
            adjustment.setStatus("DRAFT");
            repository.save(adjustment);
        }
    }
}
