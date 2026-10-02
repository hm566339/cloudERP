package com.erp.account.util;

public final class JournalConstants {

    private JournalConstants() {
        throw new IllegalStateException("JournalConstants is a utility class and cannot be instantiated");
    }

    public static final String JOURNAL_VOUCHER_PREFIX = "JV";
    public static final String REVERSAL_SOURCE_MODULE = "REVERSAL";
    public static final String JOURNAL_HASH_ALGORITHM = "SHA-256";
    public static final String GENESIS_HASH = "GENESIS";
    public static final String VOUCHER_NO_FORMAT = "%s-%s-%04d";
}
