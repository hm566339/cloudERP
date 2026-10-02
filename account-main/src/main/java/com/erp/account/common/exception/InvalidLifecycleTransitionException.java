package com.erp.account.common.exception;

import com.erp.account.modules.proformainvoice.entity.ProformaInvoiceStatus;

public class InvalidLifecycleTransitionException extends BusinessValidationException {
    public InvalidLifecycleTransitionException(ProformaInvoiceStatus current, ProformaInvoiceStatus target) {
        super("PI_INVALID_STATUS_TRANSITION", "status", "Cannot transition PI from " + current + " to " + target);
    }
}
