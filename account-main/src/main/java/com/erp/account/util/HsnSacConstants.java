package com.erp.account.util;

public final class HsnSacConstants {

    public static final String HSN_CODE_PATTERN = "^[0-9]{4,8}$";
    public static final String SAC_CODE_PATTERN = "^[0-9]{6}$";
    public static final String GENERIC_CODE_PATTERN = "^[A-Za-z0-9\\-]{4,20}$";

    public static final String HSN_TYPE = "HSN";
    public static final String SAC_TYPE = "SAC";

    private HsnSacConstants() {
        throw new UnsupportedOperationException("Constants class");
    }
}
