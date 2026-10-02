package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceFilterDto;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.service.ApInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class PurchaseInvoiceDataFetcher implements ReportDataFetcher {

    private final ApInvoiceService apInvoiceService;

    @Override
    public boolean supports(String reportName) {
        return "purchase-invoice".equalsIgnoreCase(reportName) || "ap-invoices".equalsIgnoreCase(reportName) || "purchaseinvoicemanagement-export".equalsIgnoreCase(reportName) || "apinvoice-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        ApInvoiceFilterDto filter = new ApInvoiceFilterDto();
        filter.setCompanyId(request.getCompanyId());
        filter.setInvoiceDateFrom(request.getDateFrom());
        filter.setInvoiceDateTo(request.getDateTo());

        Page<ApInvoiceResponse> page = apInvoiceService.getAllInvoices(request.getCompanyId(), filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "invoiceDate")));
        
        List<String> headers = List.of(
            "Invoice Number", "Invoice Date", "Vendor Name", "Vendor GSTIN", 
            "Status", "Due Date", "Subtotal", "Tax Amount", "Total Amount", 
            "Paid Amount", "Outstanding Amount"
        );

        List<List<Object>> rows = new ArrayList<>();
        for (ApInvoiceResponse inv : page.getContent()) {
            List<Object> row = new ArrayList<>();
            row.add(inv.getInvoiceNo());
            row.add(inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "");
            row.add(inv.getVendorName());
            row.add(inv.getVendorGstin());
            row.add(inv.getStatus() != null ? inv.getStatus().name() : "");
            row.add(inv.getDueDate() != null ? inv.getDueDate().toString() : "");
            row.add(inv.getSubtotal());
            row.add(inv.getTaxAmount());
            row.add(inv.getTotalAmount());
            row.add(inv.getPaidAmount());
            row.add(inv.getOutstandingAmount());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Purchase Invoice Register")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
