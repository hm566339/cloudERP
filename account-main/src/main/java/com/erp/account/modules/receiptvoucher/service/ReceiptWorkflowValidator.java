package com.erp.account.modules.receiptvoucher.service;

import com.erp.account.common.exception.PaymentValidationException;
import com.erp.account.enums.ReceiptVoucherStatus;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Component
public class ReceiptWorkflowValidator {

    private final Map<ReceiptVoucherStatus, List<ReceiptVoucherStatus>> transitions = new EnumMap<>(ReceiptVoucherStatus.class);

    public ReceiptWorkflowValidator() {
        transitions.put(ReceiptVoucherStatus.SUBMITTED, List.of(ReceiptVoucherStatus.DRAFT));
        transitions.put(ReceiptVoucherStatus.APPROVED, List.of(ReceiptVoucherStatus.SUBMITTED, ReceiptVoucherStatus.DRAFT));
        transitions.put(ReceiptVoucherStatus.REJECTED, List.of(ReceiptVoucherStatus.SUBMITTED));
        transitions.put(ReceiptVoucherStatus.POSTED, List.of(ReceiptVoucherStatus.APPROVED));
        transitions.put(ReceiptVoucherStatus.REVERSED, List.of(ReceiptVoucherStatus.POSTED));
        transitions.put(ReceiptVoucherStatus.CANCELLED, List.of(
                ReceiptVoucherStatus.DRAFT,
                ReceiptVoucherStatus.SUBMITTED,
                ReceiptVoucherStatus.REJECTED));
    }

    public boolean isTransitionAllowed(ReceiptVoucherStatus currentStatus, ReceiptVoucherStatus targetStatus) {
        return transitions.getOrDefault(targetStatus, List.of()).contains(currentStatus);
    }

    public void validateTransition(ReceiptVoucherStatus currentStatus, ReceiptVoucherStatus targetStatus) {
        if (!isTransitionAllowed(currentStatus, targetStatus)) {
            throw new PaymentValidationException("Cannot transition receipt voucher from " + currentStatus + " to " + targetStatus);
        }
    }
}

