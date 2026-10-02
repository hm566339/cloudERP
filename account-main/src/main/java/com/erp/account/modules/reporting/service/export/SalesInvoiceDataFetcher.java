package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceFilterDto;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SalesInvoiceDataFetcher implements ReportDataFetcher {

    private final SalesInvoiceService salesInvoiceService;

    @Override
    public boolean supports(String reportName) {
        return "sales-invoice".equalsIgnoreCase(reportName) || "sales-invoices".equalsIgnoreCase(reportName) || "salesinvoicemanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        SalesInvoiceFilterDto filter = new SalesInvoiceFilterDto();
        filter.setCompanyId(request.getCompanyId());
        filter.setInvoiceDateFrom(request.getDateFrom());
        filter.setInvoiceDateTo(request.getDateTo());

        Page<SalesInvoiceResponse> page = salesInvoiceService.getAllInvoices(filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "invoiceDate")));
        
        List<String> headers = List.of(
            "Invoice Number", "Invoice Date", "Customer Name", "Customer GSTIN", 
            "Status", "Due Date", "Subtotal", "Tax Amount", "Total Amount", 
            "Received Amount", "Outstanding Amount"
        );

        List<List<Object>> rows = new ArrayList<>();
        for (SalesInvoiceResponse inv : page.getContent()) {
            List<Object> row = new ArrayList<>();
            row.add(inv.getInvoiceNumber());
            row.add(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "");
            row.add(inv.getCustomerName());
            row.add(inv.getCustomerGstin());
            row.add(inv.getStatus() != null ? inv.getStatus().name() : "");
            row.add(inv.getDueDate() != null ? inv.getDueDate().toString() : "");
            row.add(inv.getSubtotal());
            row.add(inv.getTaxAmount());
            row.add(inv.getTotalAmount());
            row.add(inv.getReceivedAmount());
            row.add(inv.getOutstandingAmount());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Sales Invoice Register")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
