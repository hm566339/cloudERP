package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class ReceiptVoucherWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "RECEIPT_VOUCHER";
    private final ReceiptVoucherRepository repository;
    private final ReceiptVoucherService service;

    @Override
    public String getDocumentType() { return DOCUMENT_TYPE; }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(ReceiptVoucherDocument::new).orElse(null);
    }

    private final class ReceiptVoucherDocument implements WorkflowDocument {
        private final ReceiptVoucher voucher;
        private ReceiptVoucherDocument(ReceiptVoucher voucher) { this.voucher = voucher; }
        public UUID getId() { return voucher.getId(); }
        public UUID getCompanyId() { return voucher.getCompany() == null ? null : voucher.getCompany().getId(); }
        public String getDocumentType() { return DOCUMENT_TYPE; }
        public String getDocumentNumber() { return voucher.getReceiptNo(); }
        public BigDecimal getAmount() { return voucher.getReceiptAmount(); }
        public UUID getOwnerId() { return voucher.getCreatedBy(); }
        public void onWorkflowSubmitted() { service.submitForApproval(voucher.getId()); }
        public void onWorkflowApproved() { service.approveReceipt(voucher.getId()); service.postReceipt(voucher.getId()); }
        public void onWorkflowRejected() { service.rejectReceipt(voucher.getId()); }
        public void onWorkflowCancelled() { service.cancelReceipt(voucher.getId()); }
    }
}
