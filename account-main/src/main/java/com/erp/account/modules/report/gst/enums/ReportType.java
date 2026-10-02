package com.erp.account.modules.report.gst.enums;

public enum ReportType {
    SUMMARY,
    GSTR1,
    GSTR3B,
    HSN_SUMMARY,
    ITC;

    public static ReportType fromString(String s) {
        if (s == null) return null;
        String clean = s.trim().toUpperCase().replace('-', '_');
        try {
            return ReportType.valueOf(clean);
        } catch (Exception e) {
            return null;
        }
    }
}
