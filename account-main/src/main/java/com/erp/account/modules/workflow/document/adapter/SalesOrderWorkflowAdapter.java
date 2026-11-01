package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.SalesOrderService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import com.erp.account.security.CurrentUserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class SalesOrderWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "SALES_ORDER";
    private final SalesOrderRepository repository;
    private final SalesOrderService service;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(SalesOrderDocument::new).orElse(null);
    }

    private final class SalesOrderDocument implements WorkflowDocument {
        private final SalesOrder order;
        private SalesOrderDocument(SalesOrder order) { this.order = order; }
        public UUID getId() { return order.getId(); }
        public UUID getCompanyId() { return order.getCompanyId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return order.getSoNumber(); }
        public BigDecimal getAmount() { return order.getTotalAmount(); }
        public UUID getOwnerId() { return order.getCreatedBy(); }

        @Transactional
        public void onWorkflowSubmitted() {
            order.setStatus(SalesOrderStatus.PENDING_APPROVAL);
            repository.save(order);
            log.info("Sales Order {} submitted for workflow approval", order.getSoNumber());
        }

        @Transactional
        public void onWorkflowApproved() {
            order.setStatus(SalesOrderStatus.APPROVED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
            log.info("Sales Order {} marked APPROVED via workflow approval", order.getSoNumber());
        }

        @Transactional
        public void onWorkflowRejected() {
            order.setStatus(SalesOrderStatus.REJECTED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
            log.info("Sales Order {} marked REJECTED via workflow", order.getSoNumber());
        }

        @Transactional
        public void onWorkflowCancelled() {
            order.setStatus(SalesOrderStatus.CANCELLED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
            log.info("Sales Order {} marked CANCELLED via workflow", order.getSoNumber());
        }

        @Transactional
        public void onWorkflowReturned() {
            order.setStatus(SalesOrderStatus.CHANGES_REQUESTED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
            log.info("Sales Order {} marked CHANGES_REQUESTED via workflow", order.getSoNumber());
        }
    }
}
