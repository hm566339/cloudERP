package com.erp.account.modules.workflow.document.adapter;

import com.erp.account.enums.PaymentStatus;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import com.erp.account.modules.workflow.document.WorkflowDocument;
import com.erp.account.modules.workflow.document.WorkflowDocumentAdapter;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PaymentVoucherWorkflowAdapter implements WorkflowDocumentAdapter {
    private static final String DOCUMENT_TYPE = "PAYMENT_VOUCHER";
    private final PaymentVoucherRepository repository;
    private final PaymentVoucherService service;

    @Override
    public String getDocumentType() {
        return DOCUMENT_TYPE;
    }

    @Override
    @Transactional(readOnly = true)
    public WorkflowDocument find(UUID documentId, UUID companyId) {
        return repository.findByIdAndCompanyIdAndIsDeletedFalse(documentId, companyId)
                .map(PaymentVoucherDocument::new).orElse(null);
    }

    private final class PaymentVoucherDocument implements WorkflowDocument {
        private final PaymentVoucher voucher;

        private PaymentVoucherDocument(PaymentVoucher voucher) {
            this.voucher = voucher;
        }

        @Override
        public UUID getId() {
            return voucher.getId();
        }

        @Override
        public UUID getCompanyId() {
            return voucher.getCompany() == null ? null : voucher.getCompany().getId();
        }

        @Override
        public String getDocumentType() {
            return DOCUMENT_TYPE;
        }

        @Override
        public String getDocumentNumber() {
            return voucher.getVoucherNo();
        }

        @Override
        public BigDecimal getAmount() {
            return voucher.getPaymentAmount();
        }

        @Override
        public UUID getOwnerId() {
            return voucher.getCreatedBy();
        }

        @Override
        @Transactional
        public void onWorkflowSubmitted() {
            voucher.setPaymentStatus(PaymentStatus.SUBMITTED);
            repository.save(voucher);
        }

        @Override
        @Transactional
        public void onWorkflowApproved() {
            if (PaymentStatus.POSTED.equals(voucher.getPaymentStatus())) {
                return;
            }
            service.approvePaymentVoucher(voucher.getId());
            service.postPaymentVoucherDirectly(voucher.getId());
        }

        @Override
        @Transactional
        public void onWorkflowRejected() {
            if (PaymentStatus.POSTED.equals(voucher.getPaymentStatus())) {
                return;
            }
            service.rejectPaymentVoucher(voucher.getId());
        }

        @Override
        @Transactional
        public void onWorkflowCancelled() {
            if (PaymentStatus.POSTED.equals(voucher.getPaymentStatus())) {
                return;
            }
            service.cancelPaymentVoucher(voucher.getId());
        }

        @Override
        @Transactional
        public void onWorkflowReturned() {
            if (PaymentStatus.POSTED.equals(voucher.getPaymentStatus())) {
                return;
            }
            voucher.setPaymentStatus(PaymentStatus.DRAFT);
            repository.save(voucher);
        }
    }
}
