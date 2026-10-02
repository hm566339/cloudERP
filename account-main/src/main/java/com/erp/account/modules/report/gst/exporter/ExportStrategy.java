package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import java.io.OutputStream;

public interface ExportStrategy {
    byte[] export(Object data, GstReportFilterDto filter, String reportName);
    String getSupportedType();

    default void exportToStream(OutputStream out, Object data, GstReportFilterDto filter, String reportName) {
        // default implementation: fallback to byte[] and write
        byte[] bytes = export(data, filter, reportName);
        try {
            out.write(bytes);
            out.flush();
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream export", e);
        }
    }
}
