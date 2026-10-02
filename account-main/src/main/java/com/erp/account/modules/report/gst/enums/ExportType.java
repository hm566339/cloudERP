package com.erp.account.modules.report.gst.enums;

public enum ExportType {
    PDF,
    EXCEL,
    CSV;

    public static ExportType fromString(String s) {
        if (s == null) return null;
        String normalized = s.trim().toUpperCase();
        if ("XLSX".equals(normalized)) return EXCEL;
        try {
            return ExportType.valueOf(normalized);
        } catch (Exception e) {
            return null;
        }
    }
}
