package com.erp.account.modules.reporting.service.export;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.enums.ExportFormat;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportManager {

    private final List<ReportDataFetcher> fetchers;
    private final PdfGenerator pdfGenerator;
    private final ExcelGenerator excelGenerator;
    private final CsvGenerator csvGenerator;

    public void exportReport(String reportName, ReportExportRequest request, HttpServletResponse response) throws IOException {
        ReportDataFetcher fetcher = fetchers.stream()
                .filter(f -> f.supports(reportName))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Unsupported report: " + reportName));

        ReportExportData data = fetcher.fetch(request);
        String filename = reportName + "-" + System.currentTimeMillis();

        if (request.getFormat() == ExportFormat.PDF) {
            response.setContentType("application/pdf");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".pdf\"");
            pdfGenerator.generate(data, response.getOutputStream());
        } else if (request.getFormat() == ExportFormat.XLSX) {
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".xlsx\"");
            excelGenerator.generate(data, response.getOutputStream());
        } else if (request.getFormat() == ExportFormat.CSV) {
            response.setContentType("text/csv");
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + ".csv\"");
            csvGenerator.generate(data, response.getOutputStream());
        } else {
            throw new BadRequestException("Unsupported format: " + request.getFormat());
        }
        
        response.getOutputStream().flush();
    }
}
