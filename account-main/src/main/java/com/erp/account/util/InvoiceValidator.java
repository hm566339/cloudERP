package com.erp.account.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.util.Invoice;
import com.erp.account.util.InvoiceLine;
import com.erp.account.util.ValidationResult;


public class InvoiceValidator {

    public static ValidationResult validate(
            Invoice invoice,
            List<Invoice> existingInvoices,
            Set<String> activeAccounts,
            Set<Integer> openAccountingPeriods) {

        ValidationResult res = new ValidationResult();
        if (invoice == null) {
            res.setStatus("Failed");
            res.addError("Invoice is null");
            return res;
        }

        // Mandatory fields
        if (isBlank(invoice.getInvoiceNumber())) res.addError("Invoice Number is mandatory");
        if (invoice.getInvoiceDate() == null) res.addError("Invoice Date is mandatory");
        if (isBlank(invoice.getCustomerAccountCode())) res.addError("Customer/Vendor account is mandatory");
        if (invoice.getLines() == null || invoice.getLines().isEmpty()) res.addError("At least one invoice line is required");
        if (invoice.getTotalAmount() == null) res.addError("Invoice total Amount is mandatory");

        if (!res.getErrors().isEmpty()) { res.setStatus("Failed"); return res; }

        // Rule 4: Duplicate invoice numbers
        if (existingInvoices != null) {
            for (Invoice e : existingInvoices) {
                if (e == null) continue;
                if (Objects.equals(e.getInvoiceNumber(), invoice.getInvoiceNumber())) {
                    res.addError("Duplicate Invoice Number detected: " + invoice.getInvoiceNumber());
                    break;
                }
            }
        }

        // Rule 9: customer/vendor account active
        if (activeAccounts != null && !activeAccounts.contains(invoice.getCustomerAccountCode())) {
            res.addError("Customer/Vendor account is not active: " + invoice.getCustomerAccountCode());
        }

        // Rule 8: invoice date within open accounting period
        Integer period = invoice.getAccountingPeriod();
        if (period == null) {
            res.addError("Accounting period is required to validate invoice date");
        } else if (openAccountingPeriods != null && !openAccountingPeriods.contains(period)) {
            res.addError("Invoice accounting period is closed or not open: " + period);
        }

        // Line validations and totals
        BigDecimal computedTotal = BigDecimal.ZERO;
        int idx = 0;
        for (InvoiceLine line : invoice.getLines()) {
            idx++;
            if (line == null) { res.addError("Line " + idx + " is null"); continue; }

            BigDecimal taxable = safe(line.getTaxableValue());
            BigDecimal pct = safe(line.getTaxPercent());
            BigDecimal taxAmount = safe(line.getTaxAmount());
            BigDecimal lineTotal = safe(line.getLineTotal());

            // Rule 6: Prevent negative or zero invoice amounts (line-level)
            if (taxable.compareTo(BigDecimal.ZERO) <= 0) {
                res.addError("Line " + idx + ": taxable value must be greater than zero");
            }

            // Rule 2 & 7: Validate GST calculation and tax amount matches taxable value
            if (pct.compareTo(BigDecimal.ZERO) < 0 || pct.compareTo(new BigDecimal("1000")) > 0) {
                res.addError("Line " + idx + ": tax percent is invalid -> " + pct);
            } else {
                BigDecimal expectedTax = taxable.multiply(pct).divide(new BigDecimal("100"));
                expectedTax = expectedTax.setScale(2, RoundingMode.HALF_UP);
                if (taxAmount.setScale(2, RoundingMode.HALF_UP).compareTo(expectedTax) != 0) {
                    res.addError(String.format("Line %d: tax amount %s does not match expected %s (taxable %s at %s%%)", idx, taxAmount, expectedTax, taxable, pct));
                }
            }

            // Rule 1: compute totals
            computedTotal = computedTotal.add(lineTotal);
        }

        // Rule 1: Invoice Total check
        BigDecimal invoiceTotal = safe(invoice.getTotalAmount()).setScale(2, RoundingMode.HALF_UP);
        if (computedTotal.setScale(2, RoundingMode.HALF_UP).compareTo(invoiceTotal) != 0) {
            res.addError(String.format("Invoice total %s does not equal sum of line totals %s", invoiceTotal, computedTotal));
        }

        // Rule 3: Check Outstanding Amount is accurate
        BigDecimal paid = safe(invoice.getPaidAmount()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal expectedOutstanding = invoiceTotal.subtract(paid).setScale(2, RoundingMode.HALF_UP);
        if (safe(invoice.getOutstandingAmount()).setScale(2, RoundingMode.HALF_UP).compareTo(expectedOutstanding) != 0) {
            res.addError(String.format("Outstanding amount %s does not match expected %s", invoice.getOutstandingAmount(), expectedOutstanding));
        }

        // Rule 6 (again): Prevent negative or zero invoice amounts (invoice-level)
        if (invoiceTotal.compareTo(BigDecimal.ZERO) <= 0) {
            res.addError("Invoice total must be greater than zero");
        }

        if (res.getErrors().isEmpty()) {
            res.setStatus("Success");
            res.setMessage("Invoice is valid and ready for processing.");
        } else {
            res.setStatus("Failed");
        }

        return res;
    }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private static BigDecimal safe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
