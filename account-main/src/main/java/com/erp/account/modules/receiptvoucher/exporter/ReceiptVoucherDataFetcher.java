package com.erp.account.modules.receiptvoucher.exporter;

import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherFilterDto;
import com.erp.account.modules.receiptvoucher.dto.response.ReceiptVoucherResponse;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ReceiptVoucherDataFetcher implements ReportDataFetcher {

    private final ReceiptVoucherService receiptVoucherService;

    @Override
    public boolean supports(String reportName) {
        return "receipt-vouchers".equalsIgnoreCase(reportName) || "receiptvoucher-export".equalsIgnoreCase(reportName) || "receiptvouchers-export".equalsIgnoreCase(reportName) || "receiptvouchermanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        ReceiptVoucherFilterDto filter = new ReceiptVoucherFilterDto();
        
        Page<ReceiptVoucherResponse> page = receiptVoucherService.getReceipts(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "receiptDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (ReceiptVoucherResponse r : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(r.getReceiptNo() != null ? r.getReceiptNo() : "");
                row.add(r.getReceiptDate() != null ? r.getReceiptDate().toString() : "");
                row.add(r.getCustomerName() != null ? r.getCustomerName() : "");
                row.add(r.getReceiptAmount() != null ? r.getReceiptAmount() : 0);
                row.add(r.getPaymentMode() != null ? r.getPaymentMode().name() : "");
                row.add(r.getReferenceNo() != null ? r.getReferenceNo() : "");
                row.add(r.getReceiptStatus() != null ? r.getReceiptStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Receipt No", "Date", "Customer Name", "Amount", "Payment Mode", "Reference No", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("Receipt Vouchers")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
