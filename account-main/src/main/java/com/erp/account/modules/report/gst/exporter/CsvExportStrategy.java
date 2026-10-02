package com.erp.account.modules.report.gst.exporter;

import com.erp.account.modules.report.gst.dto.GstReportFilterDto;
import com.erp.account.modules.report.gst.dto.Gstr1Dto;
import com.erp.account.modules.report.gst.dto.Gstr3bDto;
import com.erp.account.modules.report.gst.dto.HsnSummaryDto;
import com.erp.account.modules.report.gst.dto.ItcReportDto;
import com.erp.account.modules.report.gst.dto.GstSummaryDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.OutputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.StringJoiner;

@Slf4j
@Component
public class CsvExportStrategy implements ExportStrategy {

    @Override
    public byte[] export(Object data, GstReportFilterDto filter, String reportName) {
        log.info("Generating CSV for Report: {}", reportName);
        StringBuilder csv = new StringBuilder();

        if (data instanceof GstSummaryDto summary) {
            csv.append("Field,Value\n");
            csv.append("Taxable Amount,").append(format(summary.getTaxableAmount())).append("\n");
            csv.append("CGST,").append(format(summary.getCgst())).append("\n");
            csv.append("SGST,").append(format(summary.getSgst())).append("\n");
            csv.append("IGST,").append(format(summary.getIgst())).append("\n");
            csv.append("CESS,").append(format(summary.getCess())).append("\n");
            csv.append("Total Tax,").append(format(summary.getTotalTax())).append("\n");
            csv.append("Output GST,").append(format(summary.getOutputGst())).append("\n");
            csv.append("Input GST,").append(format(summary.getInputGst())).append("\n");
            csv.append("Net GST Liability,").append(format(summary.getNetGstLiability())).append("\n");
        } else if (data instanceof List<?> list && list.stream().allMatch(i -> i instanceof Gstr1Dto)) {
            csv.append("Invoice Number,Invoice Date,Customer Name,GSTIN,Place Of Supply,State,Taxable Amount,CGST,SGST,IGST,CESS,Total Invoice Value,HSN,GST Rate\n");
            if (list.isEmpty()) {
                // headers only
            } else {
                for (Object item : list) {
                    Gstr1Dto dto = (Gstr1Dto) item;
                    csv.append(join(
                            dto.getInvoiceNumber(),
                            dto.getInvoiceDate(),
                            dto.getCustomerName(),
                            dto.getGstin(),
                            dto.getPlaceOfSupply(),
                            dto.getState(),
                            format(dto.getTaxableAmount()),
                            format(dto.getCgst()),
                            format(dto.getSgst()),
                            format(dto.getIgst()),
                            format(dto.getCess()),
                            format(dto.getTotalInvoiceValue()),
                            dto.getHsn(),
                            format(dto.getGstRate())
                    )).append("\n");
                }
            }
        } else if (data instanceof Gstr3bDto gstr3b) {
            csv.append("Field,Value\n");
            csv.append("Outward Taxable,").append(format(gstr3b.getOutwardSupplies().getTaxableAmount())).append("\n");
            csv.append("Outward CGST,").append(format(gstr3b.getOutwardSupplies().getCgst())).append("\n");
            csv.append("Outward SGST,").append(format(gstr3b.getOutwardSupplies().getSgst())).append("\n");
            csv.append("Outward IGST,").append(format(gstr3b.getOutwardSupplies().getIgst())).append("\n");
            csv.append("Outward CESS,").append(format(gstr3b.getOutwardSupplies().getCess())).append("\n");
            csv.append("All Other ITC CGST,").append(format(gstr3b.getInputTaxCredit().getAllOtherItc().getCgst())).append("\n");
            csv.append("All Other ITC SGST,").append(format(gstr3b.getInputTaxCredit().getAllOtherItc().getSgst())).append("\n");
            csv.append("All Other ITC IGST,").append(format(gstr3b.getInputTaxCredit().getAllOtherItc().getIgst())).append("\n");
            csv.append("All Other ITC CESS,").append(format(gstr3b.getInputTaxCredit().getAllOtherItc().getCess())).append("\n");
        } else if (data instanceof List<?> summaryList && !summaryList.isEmpty() && summaryList.get(0) instanceof HsnSummaryDto) {
            csv.append("HSN Code,Description,Quantity,Taxable Value,CGST,SGST,IGST,CESS\n");
            for (Object item : summaryList) {
                HsnSummaryDto dto = (HsnSummaryDto) item;
                csv.append(join(
                        dto.getHsnCode(),
                        dto.getDescription(),
                        format(dto.getQuantity()),
                        format(dto.getTaxableValue()),
                        format(dto.getCgst()),
                        format(dto.getSgst()),
                        format(dto.getIgst()),
                        format(dto.getCess())
                )).append("\n");
            }
        } else if (data instanceof ItcReportDto itc) {
            csv.append("Field,Value\n");
            csv.append("Opening Balance,").append(format(itc.getOpeningBalance())).append("\n");
            csv.append("Availed CGST,").append(format(itc.getItcAvailed().getCgst())).append("\n");
            csv.append("Availed SGST,").append(format(itc.getItcAvailed().getSgst())).append("\n");
            csv.append("Availed IGST,").append(format(itc.getItcAvailed().getIgst())).append("\n");
            csv.append("Availed CESS,").append(format(itc.getItcAvailed().getCess())).append("\n");
            csv.append("Utilized CGST,").append(format(itc.getItcUtilized().getCgst())).append("\n");
            csv.append("Utilized SGST,").append(format(itc.getItcUtilized().getSgst())).append("\n");
            csv.append("Utilized IGST,").append(format(itc.getItcUtilized().getIgst())).append("\n");
            csv.append("Utilized CESS,").append(format(itc.getItcUtilized().getCess())).append("\n");
            csv.append("Total Availed,").append(format(itc.getSummary().getTotalItcAvailed())).append("\n");
            csv.append("Total Utilized,").append(format(itc.getSummary().getTotalItcUtilized())).append("\n");
            csv.append("Net Available,").append(format(itc.getSummary().getNetItcAvailable())).append("\n");
            csv.append("Closing Balance,").append(format(itc.getSummary().getClosingBalance())).append("\n");
        } else {
            csv.append("Report Name,Value\n");
            csv.append(reportName).append(",unsupported data type\n");
        }

        return csv.toString().getBytes();
    }

    @Override
    public void exportToStream(OutputStream out, Object data, GstReportFilterDto filter, String reportName) {
        try (java.io.BufferedWriter writer = new java.io.BufferedWriter(new java.io.OutputStreamWriter(out))) {
            if (data instanceof GstSummaryDto summary) {
                writer.write("Field,Value\n");
                writer.write("Taxable Amount," + format(summary.getTaxableAmount()) + "\n");
                writer.write("CGST," + format(summary.getCgst()) + "\n");
                writer.write("SGST," + format(summary.getSgst()) + "\n");
                writer.write("IGST," + format(summary.getIgst()) + "\n");
                writer.write("CESS," + format(summary.getCess()) + "\n");
                writer.write("Total Tax," + format(summary.getTotalTax()) + "\n");
                writer.write("Output GST," + format(summary.getOutputGst()) + "\n");
                writer.write("Input GST," + format(summary.getInputGst()) + "\n");
                writer.write("Net GST Liability," + format(summary.getNetGstLiability()) + "\n");
            } else if (data instanceof List<?> list && list.stream().allMatch(i -> i instanceof Gstr1Dto)) {
                writer.write("Invoice Number,Invoice Date,Customer Name,GSTIN,Place Of Supply,State,Taxable Amount,CGST,SGST,IGST,CESS,Total Invoice Value,HSN,GST Rate\n");
                for (Object item : list) {
                    Gstr1Dto dto = (Gstr1Dto) item;
                    writer.write(join(
                            dto.getInvoiceNumber(),
                            dto.getInvoiceDate(),
                            dto.getCustomerName(),
                            dto.getGstin(),
                            dto.getPlaceOfSupply(),
                            dto.getState(),
                            format(dto.getTaxableAmount()),
                            format(dto.getCgst()),
                            format(dto.getSgst()),
                            format(dto.getIgst()),
                            format(dto.getCess()),
                            format(dto.getTotalInvoiceValue()),
                            dto.getHsn(),
                            format(dto.getGstRate())
                    ));
                    writer.write('\n');
                }
            } else if (data instanceof Gstr3bDto gstr3b) {
                writer.write("Field,Value\n");
                writer.write("Outward Taxable," + format(gstr3b.getOutwardSupplies().getTaxableAmount()) + "\n");
                writer.write("Outward CGST," + format(gstr3b.getOutwardSupplies().getCgst()) + "\n");
                writer.write("Outward SGST," + format(gstr3b.getOutwardSupplies().getSgst()) + "\n");
                writer.write("Outward IGST," + format(gstr3b.getOutwardSupplies().getIgst()) + "\n");
                writer.write("Outward CESS," + format(gstr3b.getOutwardSupplies().getCess()) + "\n");
                writer.write("All Other ITC CGST," + format(gstr3b.getInputTaxCredit().getAllOtherItc().getCgst()) + "\n");
                writer.write("All Other ITC SGST," + format(gstr3b.getInputTaxCredit().getAllOtherItc().getSgst()) + "\n");
                writer.write("All Other ITC IGST," + format(gstr3b.getInputTaxCredit().getAllOtherItc().getIgst()) + "\n");
                writer.write("All Other ITC CESS," + format(gstr3b.getInputTaxCredit().getAllOtherItc().getCess()) + "\n");
            } else if (data instanceof List<?> summaryList && !summaryList.isEmpty() && summaryList.get(0) instanceof HsnSummaryDto) {
                writer.write("HSN Code,Description,Quantity,Taxable Value,CGST,SGST,IGST,CESS\n");
                for (Object item : summaryList) {
                    HsnSummaryDto dto = (HsnSummaryDto) item;
                    writer.write(join(
                            dto.getHsnCode(),
                            dto.getDescription(),
                            format(dto.getQuantity()),
                            format(dto.getTaxableValue()),
                            format(dto.getCgst()),
                            format(dto.getSgst()),
                            format(dto.getIgst()),
                            format(dto.getCess())
                    ));
                    writer.write('\n');
                }
            } else if (data instanceof ItcReportDto itc) {
                writer.write("Field,Value\n");
                writer.write("Opening Balance," + format(itc.getOpeningBalance()) + "\n");
                writer.write("Availed CGST," + format(itc.getItcAvailed().getCgst()) + "\n");
                writer.write("Availed SGST," + format(itc.getItcAvailed().getSgst()) + "\n");
                writer.write("Availed IGST," + format(itc.getItcAvailed().getIgst()) + "\n");
                writer.write("Availed CESS," + format(itc.getItcAvailed().getCess()) + "\n");
                writer.write("Utilized CGST," + format(itc.getItcUtilized().getCgst()) + "\n");
                writer.write("Utilized SGST," + format(itc.getItcUtilized().getSgst()) + "\n");
                writer.write("Utilized IGST," + format(itc.getItcUtilized().getIgst()) + "\n");
                writer.write("Utilized CESS," + format(itc.getItcUtilized().getCess()) + "\n");
                writer.write("Total Availed," + format(itc.getSummary().getTotalItcAvailed()) + "\n");
                writer.write("Total Utilized," + format(itc.getSummary().getTotalItcUtilized()) + "\n");
                writer.write("Net Available," + format(itc.getSummary().getNetItcAvailable()) + "\n");
                writer.write("Closing Balance," + format(itc.getSummary().getClosingBalance()) + "\n");
            } else {
                writer.write("Report Name,Value\n");
                writer.write(reportName + ",unsupported data type\n");
            }
            writer.flush();
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream CSV report", e);
        }
    }

    @Override
    public String getSupportedType() {
        return "CSV";
    }

    private String join(Object... values) {
        StringJoiner joiner = new StringJoiner(",");
        for (Object value : values) {
            joiner.add(value != null ? escape(value.toString()) : "");
        }
        return joiner.toString();
    }

    private String escape(String value) {
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(",") || escaped.contains("\n") || escaped.contains("\r")) {
            return '"' + escaped + '"';
        }
        return escaped;
    }

    private String format(BigDecimal value) {
        return value != null ? value.toPlainString() : "0";
    }
}
