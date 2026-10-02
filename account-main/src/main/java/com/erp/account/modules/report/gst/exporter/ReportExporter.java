package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.enums.ExportType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class ReportExporter {

    private final Map<String, ExportStrategy> strategies;

    public ReportExporter(List<ExportStrategy> strategyList) {
        this.strategies = strategyList.stream()
                .collect(Collectors.toMap(ExportStrategy::getSupportedType, strategy -> strategy));
    }

    public byte[] exportReport(String type, Object data, GstReportFilterDto filter, String reportName) {
        ExportType exportType = ExportType.fromString(type);
        if (exportType == null) {
            throw new IllegalArgumentException("Export type not supported: " + type);
        }
        ExportStrategy strategy = strategies.get(exportType.name());
        if (strategy == null) {
            throw new IllegalArgumentException("Export type not supported: " + type);
        }
        return strategy.export(data, filter, reportName);
    }

    public void streamExport(String type, Object data, GstReportFilterDto filter, String reportName, java.io.OutputStream out) {
        ExportType exportType = ExportType.fromString(type);
        if (exportType == null) {
            throw new IllegalArgumentException("Export type not supported: " + type);
        }
        ExportStrategy strategy = strategies.get(exportType.name());
        if (strategy == null) {
            throw new IllegalArgumentException("Export type not supported: " + type);
        }
        strategy.exportToStream(out, data, filter, reportName);
    }
}
