package com.erp.account.modules.paymentvoucher.exporter;

import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherFilterDto;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.paymentvoucher.service.PaymentVoucherService;
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
public class PaymentVoucherDataFetcher implements ReportDataFetcher {

    private final PaymentVoucherService paymentVoucherService;

    @Override
    public boolean supports(String reportName) {
        return "payment-vouchers".equalsIgnoreCase(reportName) || "paymentvoucher-export".equalsIgnoreCase(reportName) || "paymentvouchers-export".equalsIgnoreCase(reportName) || "paymentvouchermanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        PaymentVoucherFilterDto filter = new PaymentVoucherFilterDto();
        
        Page<PaymentVoucherResponse> page = paymentVoucherService.getAllPaymentVouchers(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "voucherDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (PaymentVoucherResponse v : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(v.getVoucherNo() != null ? v.getVoucherNo() : "");
                row.add(v.getVoucherDate() != null ? v.getVoucherDate().toString() : "");
                row.add(v.getVendorName() != null ? v.getVendorName() : "");
                row.add(v.getPaymentAmount() != null ? v.getPaymentAmount() : 0);
                row.add(v.getPaymentMode() != null ? v.getPaymentMode().name() : "");
                row.add(v.getReferenceNo() != null ? v.getReferenceNo() : "");
                row.add(v.getPaymentStatus() != null ? v.getPaymentStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Voucher No", "Date", "Vendor Name", "Amount", "Payment Mode", "Reference No", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("Payment Vouchers")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
