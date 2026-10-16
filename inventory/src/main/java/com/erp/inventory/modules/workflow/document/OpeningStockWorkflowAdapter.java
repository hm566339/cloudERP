package com.erp.inventory.modules.workflow.document;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.openingstock.entity.OpeningStock;
import com.erp.inventory.modules.openingstock.entity.OpeningStockLine;
import com.erp.inventory.modules.openingstock.repository.OpeningStockLineRepository;
import com.erp.inventory.modules.openingstock.repository.OpeningStockRepository;
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
public class OpeningStockWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "OPENING_STOCK";

    private final OpeningStockRepository repository;
    private final OpeningStockLineRepository lineRepository;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyId(documentId, companyId)
                .map(OpeningStockDocument::new)
                .orElse(null);
    }

    private final class OpeningStockDocument implements WorkflowDocument {
        private final OpeningStock openingStock;

        private OpeningStockDocument(OpeningStock openingStock) {
            this.openingStock = openingStock;
        }

        @Override
        public UUID getId() {
            return openingStock.getId();
        }

        @Override
        public UUID getCompanyId() {
            return openingStock.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return openingStock.getOpeningStockNo();
        }

        @Override
        public BigDecimal getAmount() {
            List<OpeningStockLine> lines = lineRepository.findAllByOpeningStockIdAndCompanyId(openingStock.getId(), openingStock.getCompanyId());
            BigDecimal total = BigDecimal.ZERO;
            for (OpeningStockLine line : lines) {
                if (line.getTotalValue() != null) {
                    total = total.add(line.getTotalValue());
                } else if (line.getQuantity() != null && line.getUnitCost() != null) {
                    total = total.add(line.getQuantity().multiply(line.getUnitCost()));
                }
            }
            return total;
        }

        @Override
        public UUID getOwnerId() {
            return openingStock.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            openingStock.setStatus("PENDING_APPROVAL");
            repository.save(openingStock);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if ("APPROVED".equalsIgnoreCase(openingStock.getStatus())) {
                log.info("Opening stock {} already approved, skipping duplicate callback", openingStock.getOpeningStockNo());
                return;
            }
            log.info("Opening stock {} approved via workflow callback", openingStock.getOpeningStockNo());
            openingStock.setStatus("APPROVED");
            openingStock.setApprovedAt(LocalDateTime.now());
            UUID currentUserId = CurrentUserContext.getUserId();
            if (currentUserId != null) {
                openingStock.setApprovedBy(currentUserId);
            }
            repository.save(openingStock);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            log.info("Opening stock {} rejected via workflow callback", openingStock.getOpeningStockNo());
            openingStock.setStatus("REJECTED");
            repository.save(openingStock);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            log.info("Opening stock {} cancelled via workflow callback", openingStock.getOpeningStockNo());
            openingStock.setStatus("CANCELLED");
            repository.save(openingStock);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            log.info("Opening stock {} returned via workflow callback", openingStock.getOpeningStockNo());
            openingStock.setStatus("DRAFT");
            repository.save(openingStock);
        }
    }
}
