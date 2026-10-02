package com.erp.account.modules.debitnote.exception;

import com.erp.account.common.exception.ResourceNotFoundException;

public class DebitNoteNotFoundException extends ResourceNotFoundException {
    public DebitNoteNotFoundException(String message) {
        super(message);
    }
}
