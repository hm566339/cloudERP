package com.erp.account.modules.reporting.service.export;

import com.erp.account.common.exception.ReportGenerationException;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.OutputStream;

@Component
public class PdfGenerator {

    public void generate(ReportExportData data, OutputStream outputStream) {
        try {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, outputStream);
            document.open();

            if (data.getReportTitle() != null) {
                Font titleFont = new Font(Font.HELVETICA, 14, Font.BOLD);
                Paragraph title = new Paragraph(data.getReportTitle(), titleFont);
                title.setAlignment(Element.ALIGN_CENTER);
                document.add(title);
                document.add(new Paragraph(" "));
            }

            if (data.getHeaders() != null && !data.getHeaders().isEmpty()) {
                PdfPTable table = new PdfPTable(data.getHeaders().size());
                table.setWidthPercentage(100);
                table.setHeaderRows(1);

                for (String h : data.getHeaders()) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, new Font(Font.HELVETICA, 10, Font.BOLD)));
                    table.addCell(cell);
                }

                if (data.getRows() != null) {
                    for (var rowData : data.getRows()) {
                        for (Object val : rowData) {
                            String strVal = val == null ? "" : String.valueOf(val);
                            PdfPCell cell = new PdfPCell(new Phrase(strVal, new Font(Font.HELVETICA, 9, Font.NORMAL)));
                            table.addCell(cell);
                        }
                    }
                }

                document.add(table);
            }

            document.close();
        } catch (Exception ex) {
            throw new ReportGenerationException("Failed to generate PDF", ex);
        }
    }
}
