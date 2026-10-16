package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.security.CurrentUserContext;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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

        @Transactional
        public void onWorkflowSubmitted() {
            voucher.setReceiptStatus(ReceiptVoucherStatus.SUBMITTED);
            repository.save(voucher);
        }

        @Transactional
        public void onWorkflowApproved() {
            if (ReceiptVoucherStatus.POSTED.equals(voucher.getReceiptStatus())) {
                return;
            }
            voucher.setReceiptStatus(ReceiptVoucherStatus.APPROVED);
            voucher.setApprovedBy(CurrentUserContext.getUserId());
            voucher.setApprovedDate(LocalDateTime.now());
            repository.save(voucher);
            service.postReceipt(voucher.getId());
        }

        @Transactional
        public void onWorkflowRejected() {
            if (ReceiptVoucherStatus.POSTED.equals(voucher.getReceiptStatus())) {
                return;
            }
            voucher.setReceiptStatus(ReceiptVoucherStatus.REJECTED);
            repository.save(voucher);
        }

        @Transactional
        public void onWorkflowCancelled() {
            if (ReceiptVoucherStatus.POSTED.equals(voucher.getReceiptStatus())) {
                return;
            }
            service.cancelReceipt(voucher.getId());
        }

        @Transactional
        public void onWorkflowReturned() {
            if (ReceiptVoucherStatus.POSTED.equals(voucher.getReceiptStatus())) {
                return;
            }
            voucher.setReceiptStatus(ReceiptVoucherStatus.DRAFT);
            repository.save(voucher);
        }
    }
}
