package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.repository.PurchaseOrderRepository;
import com.erp.account.modules.purchaseorder.service.PurchaseOrderService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PurchaseOrderWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "PURCHASE_ORDER";
    private final PurchaseOrderRepository repository;
    private final PurchaseOrderService service;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(PurchaseOrderDocument::new).orElse(null);
    }

    private final class PurchaseOrderDocument implements WorkflowDocument {
        private final PurchaseOrder order;
        private PurchaseOrderDocument(PurchaseOrder order) { this.order = order; }
        public UUID getId() { return order.getId(); }
        public UUID getCompanyId() { return order.getCompanyId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return order.getPoNumber(); }
        public BigDecimal getAmount() { return order.getTotalAmount(); }
        public UUID getOwnerId() { return order.getCreatedBy(); }
        @Transactional
        public void onWorkflowSubmitted() {
            order.setStatus(PurchaseOrderStatus.PENDING_APPROVAL);
            repository.save(order);
        }
        @Transactional
        public void onWorkflowReturned() {
            order.setStatus(PurchaseOrderStatus.DRAFT);
            repository.save(order);
        }
        @Transactional
        public void onWorkflowApproved() {
            service.approvePurchaseOrder(order.getCompanyId(), order.getId());
        }
        @Transactional
        public void onWorkflowRejected() {
            service.rejectPurchaseOrder(order.getCompanyId(), order.getId(), "Rejected by workflow");
        }
        @Transactional
        public void onWorkflowCancelled() {
            service.cancelPurchaseOrder(order.getCompanyId(), order.getId(), "Cancelled by workflow");
        }
    }
}
