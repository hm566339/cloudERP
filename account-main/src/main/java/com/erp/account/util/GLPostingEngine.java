package com.erp.account.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Set;

import com.erp.account.util.GLEntry;
import com.erp.account.util.GLTransaction;
import com.erp.account.util.PostingResult;

public class GLPostingEngine {

    public PostingResult postVoucher(
            String voucherNo,
            String voucherType,
            LocalDate postingDate,
            List<GLEntry> entries,
            String referenceDocument,
            String createdBy,
            String transactionCurrency,
            String baseCurrency,
            BigDecimal exchangeRate,
            Set<String> activeAccounts,
            Set<String> postingAllowedAccounts,
            Set<Integer> closedFiscalYears,
            Set<Integer> closedAccountingPeriods,
            Integer fiscalYear,
            Integer accountingPeriod,
            GLStore store) {

        PostingResult out = new PostingResult();
        out.setTransaction_type(voucherType);

        if (entries == null || entries.isEmpty()) {
            out.addError("No GL entries provided"); out.setStatus("Failed"); return out;
        }

        if (postingDate == null) postingDate = LocalDate.now();
        if (voucherNo == null || voucherNo.trim().isEmpty()) voucherNo = "V-" + Instant.now().toEpochMilli();
        out.setVoucher_no(voucherNo);

        // validate currency/exchange
        if (transactionCurrency == null || baseCurrency == null) { out.addError("Currency information missing"); out.setStatus("Failed"); return out; }
        if (exchangeRate == null || exchangeRate.compareTo(BigDecimal.ZERO) <= 0) { out.addError("Invalid exchange rate"); out.setStatus("Failed"); return out; }

        // fiscal/period checks
        if (fiscalYear != null && closedFiscalYears != null && closedFiscalYears.contains(fiscalYear)) { out.addError("Fiscal year is closed: " + fiscalYear); out.setStatus("Failed"); return out; }
        if (accountingPeriod != null && closedAccountingPeriods != null && closedAccountingPeriods.contains(accountingPeriod)) { out.addError("Accounting period is closed: " + accountingPeriod); out.setStatus("Failed"); return out; }

        // duplicate check
        String key = voucherType + ":" + voucherNo + ":" + postingDate + ":" + entries.stream().map(e -> e.getAccount()+":"+e.getDebit()+":"+e.getCredit()).reduce((a,b)->a+"|"+b).orElse("");
        if (store != null && store.isPostedKey(key)) { out.addError("Duplicate posting detected: " + voucherNo); out.setStatus("Failed"); return out; }

        // validation per entry
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        int idx = 0;
        for (GLEntry e : entries) {
            idx++;
            if (e.getAccount() == null || e.getAccount().trim().isEmpty()) { out.addError("Entry " + idx + ": missing account code"); }
            BigDecimal d = nullSafe(e.getDebit());
            BigDecimal c = nullSafe(e.getCredit());
            if (d.compareTo(BigDecimal.ZERO) == 0 && c.compareTo(BigDecimal.ZERO) == 0) out.addError("Entry " + idx + ": zero amount not allowed");
            if (d.compareTo(BigDecimal.ZERO) > 0 && c.compareTo(BigDecimal.ZERO) > 0) out.addError("Entry " + idx + ": cannot have both debit and credit");
            // account active
            if (activeAccounts != null && !activeAccounts.contains(e.getAccount())) out.addError("Entry " + idx + ": account not active -> " + e.getAccount());
            // posting allowed
            if (postingAllowedAccounts != null && !postingAllowedAccounts.contains(e.getAccount())) out.addError("Entry " + idx + ": posting not allowed for account -> " + e.getAccount());

            totalDebit = totalDebit.add(d);
            totalCredit = totalCredit.add(c);
        }

        if (!out.getErrors().isEmpty()) { out.setStatus("Failed"); return out; }

        if (totalDebit.compareTo(totalCredit) != 0) { out.addError("Unbalanced voucher: debit " + totalDebit + " != credit " + totalCredit); out.setStatus("Failed"); return out; }

        // persist to store as GLTransaction entries and update running balances
        for (GLEntry e : entries) {
            GLTransaction t = new GLTransaction();
            t.setId(voucherNo + ":" + e.getAccount());
            t.setAccountCode(e.getAccount());
            t.setAccountName("");
            t.setDate(postingDate);
            t.setDebit(nullSafe(e.getDebit()));
            t.setCredit(nullSafe(e.getCredit()));
            t.setPosted(true);
            t.setFiscalYear(fiscalYear);
            t.setAccountingPeriod(accountingPeriod);
            t.setCompany(null);
            t.setCurrency(transactionCurrency);
            t.setNarration(e.getNarration());
            // store key is same for all lines
            if (store != null) store.addTransaction(t, key);
            // compute running balance to include in output entries
            BigDecimal running = store != null ? store.getRunningBalance(e.getAccount()) : nullSafe(e.getDebit()).subtract(nullSafe(e.getCredit()));
            // add output entry with running balance in narration to meet required output
            out.addEntry(new com.erp.account.util.GLEntry(e.getAccount(), e.getDebit(), e.getCredit(), e.getCurrency(), e.getNarration() + " | running_balance=" + running));
        }

        out.setPosting_date(postingDate != null ? postingDate.toString() : null);
        out.setStatus("Success");
        return out;
    }

    private static BigDecimal nullSafe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
