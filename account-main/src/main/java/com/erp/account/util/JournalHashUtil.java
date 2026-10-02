package com.erp.account.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class JournalHashUtil {

    private JournalHashUtil() {
        throw new IllegalStateException("JournalHashUtil is a utility class and cannot be instantiated");
    }

    public static String calculateEntryHash(String voucherNo, String voucherDate, String totalDebit, String totalCredit,
            String previousHash) {
        StringBuilder source = new StringBuilder();
        source.append(voucherNo == null ? "" : voucherNo)
                .append("|")
                .append(voucherDate == null ? "" : voucherDate)
                .append("|")
                .append(totalDebit == null ? "" : totalDebit)
                .append("|")
                .append(totalCredit == null ? "" : totalCredit)
                .append("|")
                .append(previousHash == null ? JournalConstants.GENESIS_HASH : previousHash);
        return sha256(source.toString());
    }

    public static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * hash.length);
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 algorithm not available", exception);
        }
    }
}
