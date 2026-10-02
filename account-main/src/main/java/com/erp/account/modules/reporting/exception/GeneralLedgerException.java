package com.erp.account.modules.reporting.exception;

public class GeneralLedgerException extends RuntimeException {

    public GeneralLedgerException() {
        super();
    }

    public GeneralLedgerException(String message) {
        super(message);
    }

    public GeneralLedgerException(String message, Throwable cause) {
        super(message, cause);
    }

    public GeneralLedgerException(Throwable cause) {
        super(cause);
    }
}
