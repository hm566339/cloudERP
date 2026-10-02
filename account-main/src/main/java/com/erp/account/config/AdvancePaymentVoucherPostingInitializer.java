package com.erp.account.config;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Startup component that detects and posts any existing unposted PO Advance Payment Vouchers.
 * Ensures data integrity and consistency between payment vouchers and general ledger entries.
 */
@Component
@Order(100)
@Slf4j
@RequiredArgsConstructor
public class AdvancePaymentVoucherPostingInitializer implements CommandLineRunner {

    private final PaymentVoucherRepository paymentVoucherRepository;
    private final PaymentVoucherService paymentVoucherService;

    @Override
    public void run(String... args) {
        try {
            List<PaymentVoucher> unpostedAdvanceVouchers = paymentVoucherRepository
                    .findAll()
                    .stream()
                    .filter(v -> !Boolean.TRUE.equals(v.getIsDeleted()))
                    .filter(v -> v.getPurchaseOrderId() != null)
                    .filter(v -> v.getGlJournalEntryId() == null || v.getGlPostingStatus() != PostingStatus.POSTED)
                    .toList();

            if (!unpostedAdvanceVouchers.isEmpty()) {
                log.info("Found {} unposted PO advance payment voucher(s). Processing GL posting...", unpostedAdvanceVouchers.size());
            }

            for (PaymentVoucher voucher : unpostedAdvanceVouchers) {
                log.info("Posting unposted PO Advance Payment Voucher: {} ({})", voucher.getVoucherNo(), voucher.getId());
                paymentVoucherService.postPaymentVoucherDirectly(voucher);
                log.info("Successfully posted PO Advance Payment Voucher: {} with journal ID: {}",
                        voucher.getVoucherNo(), voucher.getGlJournalEntryId());
            }
        } catch (Exception e) {
            log.warn("Could not post unposted advance vouchers during startup: {}", e.getMessage(), e);
        }
    }
}
