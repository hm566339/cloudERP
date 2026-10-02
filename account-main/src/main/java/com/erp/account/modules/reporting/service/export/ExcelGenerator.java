package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.ReportExportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;

@Component
public class ExcelGenerator {

    public void generate(ReportExportData data, OutputStream outputStream) throws IOException {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) { 
            String sheetName = data.getReportTitle() != null ? data.getReportTitle().replaceAll("[\\\\/?*:\\[\\]]", "") : "Report";
            if (sheetName.length() > 31) {
                sheetName = sheetName.substring(0, 31);
            }
            Sheet sheet = workbook.createSheet(sheetName);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            int rownum = 0;

            if (data.getHeaders() != null) {
                Row headerRow = sheet.createRow(rownum++);
                for (int i = 0; i < data.getHeaders().size(); i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(data.getHeaders().get(i));
                    cell.setCellStyle(headerStyle);
                }
            }

            if (data.getRows() != null) {
                for (var rowData : data.getRows()) {
                    Row row = sheet.createRow(rownum++);
                    for (int i = 0; i < rowData.size(); i++) {
                        Cell cell = row.createCell(i);
                        Object val = rowData.get(i);
                        if (val instanceof Number) {
                            cell.setCellValue(((Number) val).doubleValue());
                        } else if (val != null) {
                            cell.setCellValue(String.valueOf(val));
                        }
                    }
                }
            }

            workbook.write(outputStream);
        }
    }
}
