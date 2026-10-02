package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.*;
import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class PdfExportStrategy implements ExportStrategy {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public byte[] export(Object data, GstReportFilterDto filter, String reportName) {
        // Keep backward-compatible method but perform streaming in exportToStream when possible.
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        exportToStream(baos, data, filter, reportName);
        return baos.toByteArray();
    }

    @Override
    public void exportToStream(OutputStream out, Object data, GstReportFilterDto filter, String reportName) {
        try {
            Document document = new Document(PageSize.A4.rotate(), 36, 36, 54, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font normal = FontFactory.getFont(FontFactory.HELVETICA, 9);

            Paragraph title = new Paragraph("GST Report - " + reportName, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(Chunk.NEWLINE);

            if (data instanceof GstSummaryDto summary) {
                PdfPTable table = new PdfPTable(2);
                table.setWidthPercentage(80);
                table.addCell(cell("Field", headerFont));
                table.addCell(cell("Value", headerFont));
                addRow(table, "Taxable Amount", format(summary.getTaxableAmount()), normal);
                addRow(table, "CGST", format(summary.getCgst()), normal);
                addRow(table, "SGST", format(summary.getSgst()), normal);
                addRow(table, "IGST", format(summary.getIgst()), normal);
                addRow(table, "CESS", format(summary.getCess()), normal);
                addRow(table, "Total Tax", format(summary.getTotalTax()), normal);
                document.add(table);
            } else if (data instanceof List<?> list && list.stream().allMatch(i -> i instanceof Gstr1Dto)) {
                PdfPTable table = new PdfPTable(9);
                table.setWidthPercentage(100);
                table.addCell(cell("Invoice#", headerFont));
                table.addCell(cell("Date", headerFont));
                table.addCell(cell("Customer", headerFont));
                table.addCell(cell("GSTIN", headerFont));
                table.addCell(cell("Taxable", headerFont));
                table.addCell(cell("CGST", headerFont));
                table.addCell(cell("SGST", headerFont));
                table.addCell(cell("IGST", headerFont));
                table.addCell(cell("Total", headerFont));

                for (Object o : list) {
                    Gstr1Dto dto = (Gstr1Dto) o;
                    table.addCell(cell(dto.getInvoiceNumber(), normal));
                    table.addCell(cell(dto.getInvoiceDate() != null ? dto.getInvoiceDate().format(DATE_FMT) : "", normal));
                    table.addCell(cell(dto.getCustomerName(), normal));
                    table.addCell(cell(dto.getGstin(), normal));
                    table.addCell(cell(format(dto.getTaxableAmount()), normal));
                    table.addCell(cell(format(dto.getCgst()), normal));
                    table.addCell(cell(format(dto.getSgst()), normal));
                    table.addCell(cell(format(dto.getIgst()), normal));
                    table.addCell(cell(format(dto.getTotalInvoiceValue()), normal));
                }
                document.add(table);
            } else if (data instanceof ItcReportDto itc) {
                document.add(new Paragraph("ITC Summary", headerFont));
                document.add(Chunk.NEWLINE);
                PdfPTable table = new PdfPTable(2);
                table.setWidthPercentage(80);
                addRow(table, "Opening Balance", format(itc.getOpeningBalance()), normal);
                addRow(table, "Total ITC Availed", format(itc.getSummary().getTotalItcAvailed()), normal);
                addRow(table, "Total ITC Utilized", format(itc.getSummary().getTotalItcUtilized()), normal);
                addRow(table, "Net ITC Available", format(itc.getSummary().getNetItcAvailable()), normal);
                addRow(table, "Closing Balance", format(itc.getSummary().getClosingBalance()), normal);
                document.add(table);
            } else if (data instanceof Gstr3bDto gstr3b) {
                document.add(new Paragraph("GSTR-3B Summary", headerFont));
                document.add(Chunk.NEWLINE);
                PdfPTable table = new PdfPTable(2);
                table.setWidthPercentage(80);
                addRow(table, "Outward Taxable Amount", format(gstr3b.getOutwardSupplies().getTaxableAmount()), normal);
                addRow(table, "Total ITC IGST", format(gstr3b.getInputTaxCredit().getTotalItc().getIgst()), normal);
                addRow(table, "Total ITC CGST", format(gstr3b.getInputTaxCredit().getTotalItc().getCgst()), normal);
                addRow(table, "Total ITC SGST", format(gstr3b.getInputTaxCredit().getTotalItc().getSgst()), normal);
                addRow(table, "Net Liability IGST", format(gstr3b.getNetLiability().getIgst()), normal);
                addRow(table, "Net Liability CGST", format(gstr3b.getNetLiability().getCgst()), normal);
                addRow(table, "Net Liability SGST", format(gstr3b.getNetLiability().getSgst()), normal);
                document.add(table);
            } else if (data instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof HsnSummaryDto) {
                PdfPTable table = new PdfPTable(10);
                table.setWidthPercentage(100);
                table.addCell(cell("HSN/SAC", headerFont));
                table.addCell(cell("Description", headerFont));
                table.addCell(cell("UQC", headerFont));
                table.addCell(cell("Qty", headerFont));
                table.addCell(cell("Total Value", headerFont));
                table.addCell(cell("Taxable", headerFont));
                table.addCell(cell("IGST", headerFont));
                table.addCell(cell("CGST", headerFont));
                table.addCell(cell("SGST", headerFont));
                table.addCell(cell("CESS", headerFont));

                for (Object o : list) {
                    HsnSummaryDto dto = (HsnSummaryDto) o;
                    table.addCell(cell(dto.getHsnCode(), normal));
                    table.addCell(cell(dto.getDescription(), normal));
                    table.addCell(cell(dto.getUqc(), normal));
                    table.addCell(cell(format(dto.getQuantity()), normal));
                    table.addCell(cell(format(dto.getTaxableValue()), normal));
                    table.addCell(cell(format(dto.getTaxableValue()), normal));
                    table.addCell(cell(format(dto.getIgst()), normal));
                    table.addCell(cell(format(dto.getCgst()), normal));
                    table.addCell(cell(format(dto.getSgst()), normal));
                    table.addCell(cell(format(dto.getCess()), normal));
                }
                document.add(table);
            } else {
                document.add(new Paragraph("Unsupported report or empty data.", normal));
            }

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream PDF report", e);
        }
    }

    @Override
    public String getSupportedType() {
        return "PDF";
    }

    private void addRow(PdfPTable table, String key, String value, Font font) {
        table.addCell(cell(key, font));
        table.addCell(cell(value, font));
    }

    private String format(BigDecimal v) {
        return v != null ? v.toPlainString() : "0";
    }

    private com.lowagie.text.pdf.PdfPCell cell(String text, Font font) {
        com.lowagie.text.pdf.PdfPCell c = new com.lowagie.text.pdf.PdfPCell(new Phrase(text == null ? "" : text, font));
        c.setPadding(4);
        return c;
    }
}
