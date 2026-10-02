package com.erp.account.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.util.*;


public class AutoGlPostingEngine {

    // accountMapping keys: AR, SALES, GST_OUTPUT, GST_CGST, GST_SGST, GST_IGST, ROUNDOFF, AP, EXPENSE, GST_INPUT, BANK, CASH
    public PostingResult postSalesInvoice(Invoice invoice,
                                          Map<String, String> accountMapping,
                                          Set<String> activeAccounts,
                                          Set<String> postedVouchers,
                                          Set<Integer> closedAccountingPeriods,
                                          String createdBy,
                                          String transactionCurrency,
                                          String baseCurrency,
                                          BigDecimal exchangeRate) {

        PostingResult out = new PostingResult();
        out.setTransaction_type("SalesInvoice");

        if (invoice == null) { out.addError("Invoice is null"); out.setStatus("Failed"); return out; }

        String key = "SalesInvoice:" + invoice.getInvoiceNumber();
        if (postedVouchers != null && postedVouchers.contains(key)) {
            out.addError("Duplicate posting detected for voucher: " + invoice.getInvoiceNumber());
            out.setStatus("Failed");
            return out;
        }

        // period check
        Integer period = invoice.getAccountingPeriod();
        if (period != null && closedAccountingPeriods != null && closedAccountingPeriods.contains(period)) {
            out.addError("Accounting period is closed: " + period);
            out.setStatus("Failed");
            return out;
        }

        // required mappings
        String salesAcct = accountMapping.get("SALES");
        String arAcct = invoice.getCustomerAccountCode() != null ? invoice.getCustomerAccountCode() : accountMapping.get("AR");
        String gstOut = accountMapping.get("GST_OUTPUT");

        if (salesAcct == null) out.addError("Missing account mapping: SALES");
        if (arAcct == null) out.addError("Missing account mapping: AR (or customer account code)");
        if (gstOut == null) out.addError("Missing account mapping: GST_OUTPUT");

        if (!out.getErrors().isEmpty()) { out.setStatus("Failed"); return out; }

        // active account checks
        if (activeAccounts != null) {
            if (!activeAccounts.contains(salesAcct)) out.addError("Sales account is not active: " + salesAcct);
            if (!activeAccounts.contains(arAcct)) out.addError("Customer/AR account is not active: " + arAcct);
            if (!activeAccounts.contains(gstOut)) out.addError("GST output account is not active: " + gstOut);
            if (!out.getErrors().isEmpty()) { out.setStatus("Failed"); return out; }
        }

        // compute totals
        BigDecimal totalTaxable = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        List<com.erp.account.util.InvoiceLine> lines = invoice.getLines();
        if (lines != null) {
            for (InvoiceLine l : lines) {
                totalTaxable = totalTaxable.add(safe(l.getTaxableValue()));
                totalTax = totalTax.add(safe(l.getTaxAmount()));
                total = total.add(safe(l.getLineTotal()));
            }
        }

        // Build GL entries: Debit AR total, Credit Sales (taxable sum), Credit GST output (tax)
        String voucherNo = "GL-" + Instant.now().toEpochMilli();
        out.setVoucher_no(voucherNo);

        // Debit AR
        out.addEntry(new GLEntry(arAcct, total, BigDecimal.ZERO, transactionCurrency, "Sales Invoice " + invoice.getInvoiceNumber()));

        // Credit Sales
        out.addEntry(new GLEntry(salesAcct, BigDecimal.ZERO, totalTaxable, transactionCurrency, "Sales for invoice " + invoice.getInvoiceNumber()));

        // Credit GST output (handle CGST/SGST split if configured)
        String gstC = accountMapping.get("GST_CGST");
        String gstS = accountMapping.get("GST_SGST");
        String gstI = accountMapping.get("GST_IGST");
        if (gstC != null && gstS != null) {
            BigDecimal half = totalTax.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
            out.addEntry(new GLEntry(gstC, BigDecimal.ZERO, half, transactionCurrency, "CGST for invoice " + invoice.getInvoiceNumber()));
            out.addEntry(new GLEntry(gstS, BigDecimal.ZERO, totalTax.subtract(half), transactionCurrency, "SGST for invoice " + invoice.getInvoiceNumber()));
        } else if (gstI != null) {
            out.addEntry(new GLEntry(gstI, BigDecimal.ZERO, totalTax, transactionCurrency, "IGST for invoice " + invoice.getInvoiceNumber()));
        } else {
            out.addEntry(new GLEntry(gstOut, BigDecimal.ZERO, totalTax, transactionCurrency, "GST Output for invoice " + invoice.getInvoiceNumber()));
        }

        // Validate totals balance
        BigDecimal debitSum = BigDecimal.ZERO;
        BigDecimal creditSum = BigDecimal.ZERO;
        for (GLEntry e : out.getGl_entries()) { debitSum = debitSum.add(safe(e.getDebit())); creditSum = creditSum.add(safe(e.getCredit())); }

        if (debitSum.compareTo(creditSum) != 0) {
            BigDecimal diff = debitSum.subtract(creditSum);
            String roundAcct = accountMapping.get("ROUNDOFF");
            if (roundAcct != null) {
                if (diff.compareTo(BigDecimal.ZERO) > 0) {
                    // need credit
                    out.addEntry(new GLEntry(roundAcct, BigDecimal.ZERO, diff.abs(), transactionCurrency, "Round-off"));
                } else {
                    out.addEntry(new GLEntry(roundAcct, diff.abs(), BigDecimal.ZERO, transactionCurrency, "Round-off"));
                }
            } else {
                out.addError("Unbalanced GL: debits " + debitSum + " != credits " + creditSum + ". Provide ROUNDOFF account mapping to auto-balance.");
                out.setStatus("Failed");
                return out;
            }
        }

        // Final duplicate prevention: mark postedVouchers (caller should persist)
        if (postedVouchers != null) postedVouchers.add(key);

        out.setStatus("Success");
        return out;
    }

    private static BigDecimal safe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
