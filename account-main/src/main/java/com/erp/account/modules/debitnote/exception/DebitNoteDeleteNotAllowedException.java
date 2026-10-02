package com.erp.account.modules.debitnote.exception;

import com.erp.account.common.exception.ConflictException;

public class DebitNoteDeleteNotAllowedException extends ConflictException {
    public DebitNoteDeleteNotAllowedException(String message) {
        super(message);
    }
}
