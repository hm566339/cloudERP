package com.erp.account.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import com.erp.account.util.JournalEntry;
import com.erp.account.util.JournalLine;
import com.erp.account.util.ValidationResult;

public class JournalEntryValidator {

    public static ValidationResult validate(
            JournalEntry entry,
            List<JournalEntry> existingEntries,
            Set<String> activeAccounts,
            Set<String> postingAllowedAccounts,
            Set<Integer> closedFiscalYears,
            Set<Integer> closedAccountingPeriods) {

        ValidationResult res = new ValidationResult();

        if (entry == null) {
            res.setStatus("Failed");
            res.addError("Journal entry is null");
            return res;
        }

        // Mandatory fields
        if (isBlank(entry.getVoucherNumber())) res.addError("Voucher number is mandatory");
        if (entry.getVoucherDate() == null) res.addError("Voucher date is mandatory");
        if (entry.getLines() == null || entry.getLines().isEmpty()) res.addError("At least one line is required");
        if (entry.getTotalAmount() == null) res.addError("Total amount is mandatory");

        // If basic mandatory missing, return early with errors
        if (!res.getErrors().isEmpty()) {
            res.setStatus("Failed");
            return res;
        }

        // Rule 4: Fiscal year closed
        Integer fy = entry.getFiscalYear();
        if (fy == null && entry.getVoucherDate() != null) fy = entry.getVoucherDate().getYear();
        if (fy != null && closedFiscalYears != null && closedFiscalYears.contains(fy)) {
            res.addError(String.format("Fiscal year %d is closed for vouchers on %s", fy, entry.getVoucherDate()));
        }

        // Rule 5: Accounting period closed
        Integer period = entry.getAccountingPeriod();
        if (period != null && closedAccountingPeriods != null && closedAccountingPeriods.contains(period)) {
            res.addError(String.format("Accounting period %d is closed", period));
        }

        // Line-level checks and totals
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        int idx = 0;
        for (JournalLine line : entry.getLines()) {
            idx++;
            if (line == null) { res.addError("Line " + idx + " is null"); continue; }

            String acct = line.getAccountCode();
            if (isBlank(acct)) res.addError("Line " + idx + ": account code is mandatory");

            BigDecimal debit = safe(line.getDebit());
            BigDecimal credit = safe(line.getCredit());

            // Rule 8: Prevent zero amount entries
            if (debit.compareTo(BigDecimal.ZERO) == 0 && credit.compareTo(BigDecimal.ZERO) == 0) {
                res.addError("Line " + idx + ": amount cannot be zero");
            }

            // Rule 9: Either Debit or Credit, not both
            if (debit.compareTo(BigDecimal.ZERO) > 0 && credit.compareTo(BigDecimal.ZERO) > 0) {
                res.addError("Line " + idx + ": contains both debit and credit");
            }

            // Rule 2: account active
            if (acct != null && activeAccounts != null && !activeAccounts.contains(acct)) {
                res.addError("Line " + idx + ": account is not active -> " + acct);
            }

            // Rule 3: posting allowed
            if (acct != null && postingAllowedAccounts != null && !postingAllowedAccounts.contains(acct)) {
                res.addError("Line " + idx + ": posting not allowed for account -> " + acct);
            }

            totalDebit = totalDebit.add(debit);
            totalCredit = totalCredit.add(credit);
        }

        // Rule 1: totals equal
        if (totalDebit.compareTo(totalCredit) != 0) {
            res.addError(String.format("Total debits (%s) do not equal total credits (%s)", totalDebit, totalCredit));
        }

        // Rule 6: duplicate detection
        if (existingEntries != null) {
            for (JournalEntry e : existingEntries) {
                if (e == null) continue;
                boolean sameVoucher = Objects.equals(e.getVoucherNumber(), entry.getVoucherNumber())
                        && Objects.equals(e.getVoucherDate(), entry.getVoucherDate())
                        && Objects.equals(e.getReferenceNumber(), entry.getReferenceNumber())
                        && Objects.equals(e.getTotalAmount(), entry.getTotalAmount());
                if (sameVoucher) {
                    res.addError("Duplicate voucher detected (matching voucher number, date, reference and total amount)");
                    break;
                }
            }
        }

        if (res.getErrors().isEmpty()) {
            res.setStatus("Success");
            res.setMessage("Journal Entry is valid and ready for posting.");
        } else {
            res.setStatus("Failed");
        }

        return res;
    }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private static BigDecimal safe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
