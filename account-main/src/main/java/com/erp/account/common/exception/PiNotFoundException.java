package com.erp.account.common.exception;

import java.util.UUID;

public class PiNotFoundException extends BusinessValidationException {
    public PiNotFoundException(UUID id) {
        super("PI_NOT_FOUND", "id", "Proforma invoice not found: " + id);
    }
}
