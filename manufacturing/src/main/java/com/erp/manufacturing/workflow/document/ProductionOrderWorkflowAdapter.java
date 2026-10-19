package com.erp.manufacturing.workflow.document;

import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import com.erp.manufacturing.productionorder.repository.ProductionOrderRepository;
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
public class ProductionOrderWorkflowAdapter implements WorkflowDocumentAdapter {

    private static final String DOCUMENT_TYPE = "PRODUCTION_ORDER";

    private final ProductionOrderRepository repository;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyId(documentId, companyId)
                .map(ProductionOrderDocument::new)
                .orElse(null);
    }

    private final class ProductionOrderDocument implements WorkflowDocument {
        private final ProductionOrder order;

        private ProductionOrderDocument(ProductionOrder order) {
            this.order = order;
        }

        @Override
        public UUID getId() {
            return order.getId();
        }

        @Override
        public UUID getCompanyId() {
            return order.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return order.getProductionOrderNo();
        }

        @Override
        public BigDecimal getAmount() {
            return order.getPlannedQuantity() != null ? order.getPlannedQuantity() : BigDecimal.ZERO;
        }

        @Override
        public UUID getOwnerId() {
            return order.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            order.setStatus(ProductionOrderStatus.PENDING_APPROVAL);
            repository.save(order);
            log.info("Production order {} status set to PENDING_APPROVAL", order.getProductionOrderNo());
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (ProductionOrderStatus.CONFIRMED.equals(order.getStatus()) ||
                ProductionOrderStatus.RELEASED.equals(order.getStatus()) ||
                ProductionOrderStatus.IN_PROGRESS.equals(order.getStatus())) {
                log.info("Production order {} already approved or active, skipping duplicate callback", order.getProductionOrderNo());
                return;
            }
            log.info("Production order {} approved via workflow callback. Transitioning to CONFIRMED.", order.getProductionOrderNo());
            order.setStatus(ProductionOrderStatus.CONFIRMED);
            order.setApprovedAt(LocalDateTime.now());
            UUID currentUserId = TenantUtils.getCurrentUserId();
            if (currentUserId != null) {
                order.setApprovedBy(currentUserId);
            }
            repository.save(order);
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            if (ProductionOrderStatus.CANCELLED.equals(order.getStatus())) {
                log.warn("Production order {} is already cancelled, ignoring rejection callback", order.getProductionOrderNo());
                return;
            }
            log.info("Production order {} rejected via workflow callback", order.getProductionOrderNo());
            order.setStatus(ProductionOrderStatus.CANCELLED);
            order.setCancelledAt(LocalDateTime.now());
            repository.save(order);
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            if (ProductionOrderStatus.CANCELLED.equals(order.getStatus())) {
                return;
            }
            log.info("Production order {} cancelled via workflow callback", order.getProductionOrderNo());
            order.setStatus(ProductionOrderStatus.CANCELLED);
            order.setCancelledAt(LocalDateTime.now());
            repository.save(order);
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            log.info("Production order {} returned via workflow callback", order.getProductionOrderNo());
            order.setStatus(ProductionOrderStatus.DRAFT);
            repository.save(order);
        }
    }
}
