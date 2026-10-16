package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.repository.GoodsReceiptRepository;
import com.erp.account.modules.goodsreceipt.service.GoodsReceiptService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class GoodsReceiptWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "GOODS_RECEIPT";
    private final GoodsReceiptRepository repository;
    private final GoodsReceiptService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(GoodsReceiptDocument::new).orElse(null);
    }

    private final class GoodsReceiptDocument implements WorkflowDocument {
        private final GoodsReceipt grn;

        private GoodsReceiptDocument(GoodsReceipt grn) {
            this.grn = grn;
        }

        @Override
        public UUID getId() {
            return grn.getId();
        }

        @Override
        public UUID getCompanyId() {
            return grn.getCompanyId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return grn.getGrnNumber();
        }

        @Override
        public BigDecimal getAmount() {
            return BigDecimal.ZERO;
        }

        @Override
        public UUID getOwnerId() {
            return grn.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            grn.setStatus(GoodsReceiptStatus.VERIFIED);
            repository.save(grn);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (GoodsReceiptStatus.CONFIRMED.equals(grn.getStatus()) || GoodsReceiptStatus.POSTED.equals(grn.getStatus())) {
                return;
            }
            service.confirmGoodsReceipt(grn.getCompanyId(), grn.getId());
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            service.cancelGoodsReceipt(grn.getCompanyId(), grn.getId(), "Rejected by workflow");
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            service.cancelGoodsReceipt(grn.getCompanyId(), grn.getId(), "Cancelled by workflow");
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            grn.setStatus(GoodsReceiptStatus.DRAFT);
            repository.save(grn);
        }
    }
}
