package com.erp.account.modules.quotation.exception;

import com.erp.account.common.exception.ResourceNotFoundException;
import java.util.UUID;

public class QuotationNotFoundException extends ResourceNotFoundException {

    private static final long serialVersionUID = 1L;

    public QuotationNotFoundException(UUID id) {
        super("Quotation not found with id: " + id);
    }

    public QuotationNotFoundException(String quotationNumber) {
        super("Quotation not found with number: " + quotationNumber);
    }
}
