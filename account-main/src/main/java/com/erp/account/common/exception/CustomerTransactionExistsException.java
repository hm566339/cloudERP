package com.erp.account.common.exception;

public class CustomerTransactionExistsException extends BadRequestException {

    private static final long serialVersionUID = 1L;

    public CustomerTransactionExistsException(String customerName) {
        super("Cannot delete customer '" + customerName + "'. Existing transactions found.", "CUSTOMER_TRANSACTION_EXISTS");
    }

    public CustomerTransactionExistsException(String message, String errorCode) {
        super(message, errorCode);
    }
}
