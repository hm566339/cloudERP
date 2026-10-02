package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.GstSummaryDto;
import com.erp.account.modules.report.gst.dto.Gstr1Dto;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

public class ExportStrategyTests {

    @Test
    void pdfExportProducesBytes() {
        PdfExportStrategy pdf = new PdfExportStrategy();
        GstReportFilterDto f = new GstReportFilterDto();
        GstSummaryDto s = new GstSummaryDto();
        byte[] out = pdf.export(s, f, "summary");
        assertTrue(out.length > 0);
    }

    @Test
    void excelExportProducesBytes() {
        ExcelExportStrategy ex = new ExcelExportStrategy();
        GstReportFilterDto f = new GstReportFilterDto();
        Gstr1Dto dto = new Gstr1Dto();
        dto.setInvoiceNumber("INV-1");
        dto.setInvoiceDate(LocalDate.now());
        byte[] out = ex.export(List.of(dto), f, "gstr1");
        assertTrue(out.length > 0);
    }

    @Test
    void csvExportHandlesEmptyList() {
        CsvExportStrategy csv = new CsvExportStrategy();
        GstReportFilterDto f = new GstReportFilterDto();
        byte[] out = csv.export(List.of(), f, "gstr1");
        String s = new String(out);
        // headers should be present
        assertTrue(s.contains("Invoice Number") || s.contains("Report Name"));
    }
}
