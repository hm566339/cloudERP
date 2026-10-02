package com.erp.account.modules.debitnote.exception;

import com.erp.account.common.exception.ConflictException;

public class DebitNoteUpdateNotAllowedException extends ConflictException {
    public DebitNoteUpdateNotAllowedException(String message) {
        super(message);
    }
}
