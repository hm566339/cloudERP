package com.erp.account.util;

public final class BankAccountConstants {

    private BankAccountConstants() {
        throw new UnsupportedOperationException("BankAccountConstants is a utility class");
    }

    public static final String IFSC_PATTERN = "^[A-Za-z]{4}0[A-Z0-9]{6}$";
    public static final String UPI_ID_PATTERN = "^[\\w.\\-]{2,256}@[A-Za-z]{2,64}$";
    public static final String ACCOUNT_NUMBER_PATTERN = "^[A-Za-z0-9]{6,30}$";
    public static final String BANK_MODULE = "BANK";
}
