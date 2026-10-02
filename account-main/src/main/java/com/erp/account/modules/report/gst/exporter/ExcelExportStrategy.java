package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.*;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ExcelExportStrategy implements ExportStrategy {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    @Override
    public byte[] export(Object data, GstReportFilterDto filter, String reportName) {
        // Fallback to streaming method
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            exportToStream(baos, data, filter, reportName);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel report", e);
        }
    }

    @Override
    public String getSupportedType() {
        return "EXCEL";
    }

    private void row(Sheet s, int rowIdx, String key, String value) {
        Row r = s.createRow(rowIdx);
        r.createCell(0).setCellValue(key);
        r.createCell(1).setCellValue(value);
    }

    private String format(BigDecimal v) {
        return v != null ? v.toPlainString() : "0";
    }

    @Override
    public void exportToStream(OutputStream out, Object data, GstReportFilterDto filter, String reportName) {
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet("Report");
            int rowIdx = 0;

            if (data instanceof GstSummaryDto summary) {
                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("Field");
                r.createCell(1).setCellValue("Value");
                row(sheet, rowIdx++, "Taxable Amount", format(summary.getTaxableAmount()));
                row(sheet, rowIdx++, "CGST", format(summary.getCgst()));
                row(sheet, rowIdx++, "SGST", format(summary.getSgst()));
                row(sheet, rowIdx++, "IGST", format(summary.getIgst()));
                row(sheet, rowIdx++, "CESS", format(summary.getCess()));
            } else if (data instanceof List<?> list && list.stream().allMatch(i -> i instanceof Gstr1Dto)) {
                Row header = sheet.createRow(rowIdx++);
                String[] heads = new String[]{"InvoiceNumber","Date","Customer","GSTIN","Taxable","CGST","SGST","IGST","Total"};
                for (int i = 0; i < heads.length; i++) header.createCell(i).setCellValue(heads[i]);

                for (Object o : list) {
                    Gstr1Dto dto = (Gstr1Dto) o;
                    Row r = sheet.createRow(rowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(dto.getInvoiceNumber());
                    r.createCell(c++).setCellValue(dto.getInvoiceDate() != null ? dto.getInvoiceDate().format(DATE_FMT) : "");
                    r.createCell(c++).setCellValue(dto.getCustomerName());
                    r.createCell(c++).setCellValue(dto.getGstin());
                    r.createCell(c++).setCellValue(format(dto.getTaxableAmount()));
                    r.createCell(c++).setCellValue(format(dto.getCgst()));
                    r.createCell(c++).setCellValue(format(dto.getSgst()));
                    r.createCell(c++).setCellValue(format(dto.getIgst()));
                    r.createCell(c++).setCellValue(format(dto.getTotalInvoiceValue()));
                }
            } else if (data instanceof ItcReportDto itc) {
                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("ITC Summary");
                rowIdx++;
                row(sheet, rowIdx++, "Opening Balance", format(itc.getOpeningBalance()));
                rowIdx++;
                r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("ITC Availed");
                row(sheet, rowIdx++, "CGST", format(itc.getItcAvailed().getCgst()));
                row(sheet, rowIdx++, "SGST", format(itc.getItcAvailed().getSgst()));
                row(sheet, rowIdx++, "IGST", format(itc.getItcAvailed().getIgst()));
                row(sheet, rowIdx++, "CESS", format(itc.getItcAvailed().getCess()));
                rowIdx++;
                r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("ITC Utilized");
                row(sheet, rowIdx++, "CGST", format(itc.getItcUtilized().getCgst()));
                row(sheet, rowIdx++, "SGST", format(itc.getItcUtilized().getSgst()));
                row(sheet, rowIdx++, "IGST", format(itc.getItcUtilized().getIgst()));
                row(sheet, rowIdx++, "CESS", format(itc.getItcUtilized().getCess()));
                rowIdx++;
                r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("Net Summary");
                row(sheet, rowIdx++, "Total Availed", format(itc.getSummary().getTotalItcAvailed()));
                row(sheet, rowIdx++, "Total Utilized", format(itc.getSummary().getTotalItcUtilized()));
                row(sheet, rowIdx++, "Net Available", format(itc.getSummary().getNetItcAvailable()));
                row(sheet, rowIdx++, "Closing Balance", format(itc.getSummary().getClosingBalance()));
            } else if (data instanceof Gstr3bDto gstr3b) {
                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("GSTR-3B Summary");
                rowIdx++;
                row(sheet, rowIdx++, "Outward Taxable Amount", format(gstr3b.getOutwardSupplies().getTaxableAmount()));
                row(sheet, rowIdx++, "Outward IGST", format(gstr3b.getOutwardSupplies().getIgst()));
                row(sheet, rowIdx++, "Outward CGST", format(gstr3b.getOutwardSupplies().getCgst()));
                row(sheet, rowIdx++, "Outward SGST", format(gstr3b.getOutwardSupplies().getSgst()));
                row(sheet, rowIdx++, "Zero Rated Taxable Amount", format(gstr3b.getZeroRatedSupplies().getTaxableAmount()));
                row(sheet, rowIdx++, "Nil Rated Taxable Amount", format(gstr3b.getNilRatedExemptSupplies().getTaxableAmount()));
                row(sheet, rowIdx++, "Inward Reverse Charge Taxable Amount", format(gstr3b.getInwardReverseChargeSupplies().getTaxableAmount()));
                row(sheet, rowIdx++, "Non-GST Outward Taxable Amount", format(gstr3b.getNonGstOutwardSupplies().getTaxableAmount()));
                rowIdx++;
                r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("ITC");
                row(sheet, rowIdx++, "Total ITC IGST", format(gstr3b.getInputTaxCredit().getTotalItc().getIgst()));
                row(sheet, rowIdx++, "Total ITC CGST", format(gstr3b.getInputTaxCredit().getTotalItc().getCgst()));
                row(sheet, rowIdx++, "Total ITC SGST", format(gstr3b.getInputTaxCredit().getTotalItc().getSgst()));
                row(sheet, rowIdx++, "Net ITC Available IGST", format(gstr3b.getInputTaxCredit().getNetItcAvailable().getIgst()));
                row(sheet, rowIdx++, "Net ITC Available CGST", format(gstr3b.getInputTaxCredit().getNetItcAvailable().getCgst()));
                row(sheet, rowIdx++, "Net ITC Available SGST", format(gstr3b.getInputTaxCredit().getNetItcAvailable().getSgst()));
                rowIdx++;
                r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("Net Liability");
                row(sheet, rowIdx++, "IGST", format(gstr3b.getNetLiability().getIgst()));
                row(sheet, rowIdx++, "CGST", format(gstr3b.getNetLiability().getCgst()));
                row(sheet, rowIdx++, "SGST", format(gstr3b.getNetLiability().getSgst()));
            } else if (data instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof HsnSummaryDto) {
                Row header = sheet.createRow(rowIdx++);
                String[] heads = new String[]{"HSN/SAC", "Description", "UQC", "Total Quantity", "Total Value", "Taxable Value", "IGST", "CGST", "SGST", "CESS"};
                for (int i = 0; i < heads.length; i++) header.createCell(i).setCellValue(heads[i]);
                for (Object o : list) {
                    HsnSummaryDto dto = (HsnSummaryDto) o;
                    Row r = sheet.createRow(rowIdx++);
                    int c = 0;
                    r.createCell(c++).setCellValue(dto.getHsnCode());
                    r.createCell(c++).setCellValue(dto.getDescription());
                    r.createCell(c++).setCellValue(dto.getUqc());
                    r.createCell(c++).setCellValue(format(dto.getQuantity()));
                    r.createCell(c++).setCellValue(format(dto.getTaxableValue())); // total value wasn't there, so we can skip or use taxableValue
                    r.createCell(c++).setCellValue(format(dto.getTaxableValue()));
                    r.createCell(c++).setCellValue(format(dto.getIgst()));
                    r.createCell(c++).setCellValue(format(dto.getCgst()));
                    r.createCell(c++).setCellValue(format(dto.getSgst()));
                    r.createCell(c++).setCellValue(format(dto.getCess()));
                }
            } else {
                Row r = sheet.createRow(rowIdx++);
                r.createCell(0).setCellValue("Unsupported report or empty data.");
            }

            workbook.write(out);
            workbook.dispose();
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream Excel report", e);
        }
    }
}
