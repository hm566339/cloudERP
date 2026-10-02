package com.erp.account.common.exception;

public class InventoryStockOutException extends BaseApplicationException {

    public InventoryStockOutException(String message) {
        super(message);
    }

    public InventoryStockOutException(String message, Throwable cause) {
        super(message, cause, "INVENTORY_STOCK_OUT_FAILED");
    }
}
