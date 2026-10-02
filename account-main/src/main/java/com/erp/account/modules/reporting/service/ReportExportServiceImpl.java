package com.erp.account.modules.reporting.service;

import com.erp.account.common.exception.ReportGenerationException;
import com.erp.account.modules.report.dto.response.TrialBalanceRow;
import com.erp.account.modules.reporting.dto.request.ReportFilter;
import com.erp.account.util.TenantUtils;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;


import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportServiceImpl implements ReportExportService {

    private final ReportService reportService;

    @Override
    public void exportTrialBalancePdf(ReportFilter filter, HttpServletResponse response) throws IOException {

        UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition", "attachment; filename=trial-balance.pdf");

        var report = reportService.getTrialBalance(filter);

        try (OutputStream out = response.getOutputStream()) {

            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
            Paragraph title = new Paragraph("Trial Balance", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);

            document.add(new Paragraph(
                    "Generated: " + report.getGeneratedAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setHeaderRows(1);

            String[] headers = {
                    "Account Code",
                    "Account Name",
                    "Opening Debit",
                    "Opening Credit",
                    "Period Debit",
                    "Period Credit",
                    "Closing Balance"
            };

            for (String h : headers) {
                table.addCell(new PdfPCell(new Phrase(h)));
            }

            for (TrialBalanceRow row : report.getRows()) {
                table.addCell(row.getAccountCode());
                table.addCell(row.getAccountName());
                table.addCell(format(row.getOpeningDebit()));
                table.addCell(format(row.getOpeningCredit()));
                table.addCell(format(row.getDebitTotal()));
                table.addCell(format(row.getCreditTotal()));
                table.addCell(format(row.getClosingBalance()));
            }

            document.add(table);
            document.close();

        } catch (Exception ex) {
            log.error("Failed to export Trial Balance PDF for company {}", companyId, ex);
            throw new ReportGenerationException("Failed to generate Trial Balance PDF", ex);
        }
    }

    private String format(BigDecimal v) {
        return v == null ? "0" : v.toPlainString();
    }

   @Override
public void exportTrialBalanceExcel(ReportFilter filter, HttpServletResponse response) {

    UUID companyId = TenantUtils.resolveCompanyIdForQuery(filter.getCompanyId());

    response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    response.setHeader("Content-Disposition", "attachment; filename=trial-balance.xlsx");

    try {
        var report = reportService.getTrialBalance(filter);

        try (SXSSFWorkbook workbook = new SXSSFWorkbook();
             OutputStream out = response.getOutputStream()) {

            Sheet sheet = workbook.createSheet("Trial Balance");

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            DataFormat dataFormat = workbook.createDataFormat();
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(dataFormat.getFormat("#,##0.00"));

            int rownum = 0;

            Row header = sheet.createRow(rownum++);
            String[] headers = {
                    "Account Code",
                    "Account Name",
                    "Opening Debit",
                    "Opening Credit",
                    "Period Debit",
                    "Period Credit",
                    "Closing Balance"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (TrialBalanceRow row : report.getRows()) {

                Row excelRow = sheet.createRow(rownum++);

                excelRow.createCell(0).setCellValue(row.getAccountCode());
                excelRow.createCell(1).setCellValue(row.getAccountName());

                Cell c2 = excelRow.createCell(2);
                c2.setCellValue(row.getOpeningDebit() != null ? row.getOpeningDebit().doubleValue() : 0);
                c2.setCellStyle(currencyStyle);

                Cell c3 = excelRow.createCell(3);
                c3.setCellValue(row.getOpeningCredit() != null ? row.getOpeningCredit().doubleValue() : 0);
                c3.setCellStyle(currencyStyle);

                Cell c4 = excelRow.createCell(4);
                c4.setCellValue(row.getDebitTotal() != null ? row.getDebitTotal().doubleValue() : 0);
                c4.setCellStyle(currencyStyle);

                Cell c5 = excelRow.createCell(5);
                c5.setCellValue(row.getCreditTotal() != null ? row.getCreditTotal().doubleValue() : 0);
                c5.setCellStyle(currencyStyle);

                Cell c6 = excelRow.createCell(6);
                c6.setCellValue(row.getClosingBalance() != null ? row.getClosingBalance().doubleValue() : 0);
                c6.setCellStyle(currencyStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            out.flush();

        }

    } catch (Exception ex) {
        log.error("Failed to export Trial Balance Excel for company {}", companyId, ex);
        throw new ReportGenerationException("Failed to generate Trial Balance Excel", ex);
    }
}
}
