package com.erp.inventory.modules.workflow.document;

import com.erp.inventory.common.security.CurrentUserContext;
import com.erp.inventory.modules.transfer.entity.StockTransfer;
import com.erp.inventory.modules.transfer.entity.StockTransferLine;
import com.erp.inventory.modules.transfer.repository.StockTransferLineRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferRepository;
import com.erp.inventory.modules.transfer.service.StockTransferService;
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
public class StockTransferWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "STOCK_TRANSFER";

    private final StockTransferRepository repository;
    private final StockTransferLineRepository lineRepository;
    private final StockTransferService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyId(documentId, companyId)
                .map(StockTransferDocument::new)
                .orElse(null);
    }

    private final class StockTransferDocument implements WorkflowDocument {
        private final StockTransfer transfer;

        private StockTransferDocument(StockTransfer transfer) {
            this.transfer = transfer;
        }

        @Override
        public UUID getId() {
            return transfer.getId();
        }

        @Override
        public UUID getCompanyId() {
            return transfer.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return transfer.getTransferNo();
        }

        @Override
        public BigDecimal getAmount() {
            List<StockTransferLine> lines = lineRepository.findAllByStockTransferIdAndCompanyId(transfer.getId(), transfer.getCompanyId());
            BigDecimal total = BigDecimal.ZERO;
            for (StockTransferLine line : lines) {
                if (line.getQuantity() != null && line.getUnitCost() != null) {
                    total = total.add(line.getQuantity().multiply(line.getUnitCost()));
                }
            }
            return total;
        }

        @Override
        public UUID getOwnerId() {
            return transfer.getInitiatedBy() != null ? transfer.getInitiatedBy() : transfer.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            transfer.setStatus("PENDING_APPROVAL");
            repository.save(transfer);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if ("APPROVED".equalsIgnoreCase(transfer.getStatus())) {
                log.info("Stock transfer {} already approved, skipping idempotent callback", transfer.getTransferNo());
                return;
            }
            log.info("Stock transfer {} approved via workflow callback. Processing stock movement.", transfer.getTransferNo());
            service.processStockTransferMovement(transfer.getId(), transfer.getCompanyId());
            transfer.setStatus("APPROVED");
            transfer.setApprovedAt(LocalDateTime.now());
            transfer.setApprovedBy(CurrentUserContext.getUserId());
            repository.save(transfer);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            if ("APPROVED".equalsIgnoreCase(transfer.getStatus()) || "CANCELLED".equalsIgnoreCase(transfer.getStatus())) {
                log.warn("Ignoring reject callback for stock transfer {} in status {}", transfer.getTransferNo(), transfer.getStatus());
                return;
            }
            log.info("Stock transfer {} rejected via workflow callback", transfer.getTransferNo());
            transfer.setStatus("REJECTED");
            repository.save(transfer);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            if ("APPROVED".equalsIgnoreCase(transfer.getStatus()) || "CANCELLED".equalsIgnoreCase(transfer.getStatus())) {
                log.warn("Ignoring cancel callback for stock transfer {} in status {}", transfer.getTransferNo(), transfer.getStatus());
                return;
            }
            log.info("Stock transfer {} cancelled via workflow callback", transfer.getTransferNo());
            transfer.setStatus("CANCELLED");
            repository.save(transfer);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            if ("APPROVED".equalsIgnoreCase(transfer.getStatus()) || "CANCELLED".equalsIgnoreCase(transfer.getStatus())) {
                log.warn("Ignoring return callback for stock transfer {} in status {}", transfer.getTransferNo(), transfer.getStatus());
                return;
            }
            log.info("Stock transfer {} returned via workflow callback", transfer.getTransferNo());
            transfer.setStatus("DRAFT");
            repository.save(transfer);
        }
    }
}
