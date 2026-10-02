package com.erp.account.util;

import com.erp.account.modules.ledger.dto.response.VendorLedgerLine;
import com.erp.account.modules.ledger.dto.response.VendorLedgerResponse;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.appayment.entity.ApPayment;
import com.erp.account.modules.vendor.entity.Vendor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class VendorLedgerHelper {

    public VendorLedgerResponse generateVendorLedger(Vendor vendor, LocalDate fromDate, LocalDate toDate) {
        VendorLedgerResponse ledger = VendorLedgerResponse.builder()
            .vendorId(vendor.getId())
            .vendorCode(vendor.getVendorCode())
            .vendorName(vendor.getVendorName())
            .fromDate(fromDate)
            .toDate(toDate)
            .build();

        List<VendorLedgerLine> lines = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;

        Set<LocalDate> allDates = new TreeSet<>();
        if (vendor.getApInvoices() != null) {
            vendor.getApInvoices().stream()
                .filter(inv -> !inv.getIsDeleted())
                .filter(inv -> isDateInRange(inv.getInvoiceDate(), fromDate, toDate))
                .forEach(inv -> allDates.add(inv.getInvoiceDate()));
        }

        if (vendor.getApPayments() != null) {
            vendor.getApPayments().stream()
                .filter(pmt -> !pmt.getIsDeleted())
                .filter(pmt -> isDateInRange(pmt.getPaymentDate(), fromDate, toDate))
                .forEach(pmt -> allDates.add(pmt.getPaymentDate()));
        }

        for (LocalDate date : allDates) {
            BigDecimal invoiceAmount = BigDecimal.ZERO;
            BigDecimal paymentAmount = BigDecimal.ZERO;

            if (vendor.getApInvoices() != null) {
                invoiceAmount = vendor.getApInvoices().stream()
                    .filter(inv -> !inv.getIsDeleted())
                    .filter(inv -> inv.getInvoiceDate().equals(date))
                    .map(ApInvoice::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            }

            if (vendor.getApPayments() != null) {
                paymentAmount = vendor.getApPayments().stream()
                    .filter(pmt -> !pmt.getIsDeleted())
                    .filter(pmt -> pmt.getPaymentDate().equals(date))
                    .map(ApPayment::getPaymentAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            }

            runningBalance = runningBalance.add(invoiceAmount).subtract(paymentAmount);

            VendorLedgerLine line = VendorLedgerLine.builder()
                .transactionDate(date)
                .invoiceAmount(invoiceAmount)
                .paymentAmount(paymentAmount)
                .balance(runningBalance)
                .build();

            lines.add(line);
        }

        ledger.setLedgerLines(lines);
        ledger.setOpeningBalance(BigDecimal.ZERO);
        ledger.setClosingBalance(runningBalance);
        ledger.setTotalInvoices(invoiceAmount(vendor, fromDate, toDate));
        ledger.setTotalPayments(paymentAmount(vendor, fromDate, toDate));

        return ledger;
    }

    public BigDecimal calculateOutstandingBalance(Vendor vendor) {
        BigDecimal outstanding = BigDecimal.ZERO;

        if (vendor.getApInvoices() != null) {
            outstanding = vendor.getApInvoices().stream()
                .filter(inv -> !inv.getIsDeleted())
                .map(ApInvoice::getOutstandingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        return outstanding;
    }

    public BigDecimal calculateAvailableCredit(Vendor vendor) {
        if (vendor.getCreditLimit() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal outstanding = calculateOutstandingBalance(vendor);
        return vendor.getCreditLimit().subtract(outstanding);
    }

    public boolean isCreditLimitExceeded(Vendor vendor, BigDecimal invoiceAmount) {
        BigDecimal currentOutstanding = calculateOutstandingBalance(vendor);
        BigDecimal totalOutstanding = currentOutstanding.add(invoiceAmount);

        if (vendor.getCreditLimit() == null) {
            return false;
        }

        return totalOutstanding.compareTo(vendor.getCreditLimit()) > 0;
    }

    private BigDecimal invoiceAmount(Vendor vendor, LocalDate fromDate, LocalDate toDate) {
        if (vendor.getApInvoices() == null) {
            return BigDecimal.ZERO;
        }

        return vendor.getApInvoices().stream()
            .filter(inv -> !inv.getIsDeleted())
            .filter(inv -> isDateInRange(inv.getInvoiceDate(), fromDate, toDate))
            .map(ApInvoice::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal paymentAmount(Vendor vendor, LocalDate fromDate, LocalDate toDate) {
        if (vendor.getApPayments() == null) {
            return BigDecimal.ZERO;
        }

        return vendor.getApPayments().stream()
            .filter(pmt -> !pmt.getIsDeleted())
            .filter(pmt -> isDateInRange(pmt.getPaymentDate(), fromDate, toDate))
            .map(ApPayment::getPaymentAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isDateInRange(LocalDate date, LocalDate fromDate, LocalDate toDate) {
        if (date == null) return false;
        if (fromDate != null && date.isBefore(fromDate)) return false;
        if (toDate != null && date.isAfter(toDate)) return false;
        return true;
    }
}
