package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.repository.SalesOrderRepository;
import com.erp.account.modules.salesorder.service.SalesOrderService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import com.erp.account.security.CurrentUserContext;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

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
            order.setStatus(SalesOrderStatus.DRAFT);
            repository.save(order);
        }

        @Transactional
        public void onWorkflowApproved() {
            order.setStatus(SalesOrderStatus.CONFIRMED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
        }

        @Transactional
        public void onWorkflowRejected() {
            order.setStatus(SalesOrderStatus.CANCELLED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
        }

        @Transactional
        public void onWorkflowCancelled() {
            order.setStatus(SalesOrderStatus.CANCELLED);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
        }

        @Transactional
        public void onWorkflowReturned() {
            order.setStatus(SalesOrderStatus.DRAFT);
            order.setUpdatedBy(CurrentUserContext.getUserId());
            repository.save(order);
        }
    }
}
