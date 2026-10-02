package com.erp.account.modules.debitnote.exception;

import com.erp.account.common.exception.BadRequestException;

public class InvalidDebitNoteStateException extends BadRequestException {
    public InvalidDebitNoteStateException(String message) {
        super(message);
    }
}
