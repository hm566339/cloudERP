package com.erp.account.common.exception;

public class BalanceSheetException extends InternalServerException {
    private static final long serialVersionUID = 1L;

    public BalanceSheetException(String message) {
        super(message, "BALANCE_SHEET_ERROR");
    }

    public BalanceSheetException(String message, Throwable cause) {
        super(message, cause);
    }
}
