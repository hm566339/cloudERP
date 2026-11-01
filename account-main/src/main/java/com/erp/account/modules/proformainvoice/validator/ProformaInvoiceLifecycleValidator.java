package com.erp.account.modules.proformainvoice.validator;

import com.erp.account.common.exception.InvalidLifecycleTransitionException;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
public class ProformaInvoiceLifecycleValidator {

    private static final Map<ProformaInvoiceStatus, Set<ProformaInvoiceStatus>> ALLOWED_TRANSITIONS = Map.of(
            ProformaInvoiceStatus.DRAFT, Set.of(ProformaInvoiceStatus.PENDING_APPROVAL, ProformaInvoiceStatus.APPROVED, ProformaInvoiceStatus.ISSUED, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.PENDING_APPROVAL, Set.of(ProformaInvoiceStatus.APPROVED, ProformaInvoiceStatus.REJECTED, ProformaInvoiceStatus.CHANGES_REQUESTED, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.CHANGES_REQUESTED, Set.of(ProformaInvoiceStatus.PENDING_APPROVAL, ProformaInvoiceStatus.DRAFT, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.APPROVED, Set.of(ProformaInvoiceStatus.ISSUED, ProformaInvoiceStatus.CONFIRMED, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.CONFIRMED, Set.of(ProformaInvoiceStatus.ISSUED, ProformaInvoiceStatus.PARTIALLY_PAID, ProformaInvoiceStatus.PAID, ProformaInvoiceStatus.PARTIALLY_CONVERTED, ProformaInvoiceStatus.FULLY_CONVERTED, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.ISSUED, Set.of(ProformaInvoiceStatus.PARTIALLY_PAID, ProformaInvoiceStatus.PAID, ProformaInvoiceStatus.EXPIRED, ProformaInvoiceStatus.CANCELLED, ProformaInvoiceStatus.CONFIRMED),
            ProformaInvoiceStatus.PARTIALLY_PAID, Set.of(ProformaInvoiceStatus.PAID, ProformaInvoiceStatus.CANCELLED),
            ProformaInvoiceStatus.PAID, Set.of(ProformaInvoiceStatus.PARTIALLY_CONVERTED, ProformaInvoiceStatus.FULLY_CONVERTED),
            ProformaInvoiceStatus.PARTIALLY_CONVERTED, Set.of(ProformaInvoiceStatus.FULLY_CONVERTED),
            ProformaInvoiceStatus.EXPIRED, Set.of()
    );

    public void validateTransition(ProformaInvoiceStatus current, ProformaInvoiceStatus target) {
        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new InvalidLifecycleTransitionException(current, target);
        }
    }
}
