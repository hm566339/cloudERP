package com.erp.account.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import com.erp.account.util.AccountBalance;
import com.erp.account.util.GLTransaction;
import com.erp.account.util.TrialBalanceResult;

public class TrialBalanceEngine {

    public static TrialBalanceResult generateTrialBalance(
            List<GLTransaction> glTransactions,
            Integer fiscalYear,
            Integer period,
            LocalDate startDate,
            LocalDate endDate,
            String company,
            boolean ignoreInactiveAccounts,
            Set<String> inactiveAccounts,
            boolean includeUnposted,
            boolean allowLockedPeriod,
            Set<Integer> closedPeriods) {

        TrialBalanceResult res = new TrialBalanceResult();
        res.setFiscalYear(fiscalYear);
        res.setPeriod(period);

        if (glTransactions == null || glTransactions.isEmpty()) {
            res.addError("No GL transactions provided");
            res.setStatus("Failed");
            return res;
        }

        // period checks
        if (period != null && closedPeriods != null && closedPeriods.contains(period) && !allowLockedPeriod) {
            res.addError("Accounting period is closed: " + period);
            res.setStatus("Failed");
            return res;
        }

        // filter transactions
        List<GLTransaction> filtered = new ArrayList<>();
        for (GLTransaction t : glTransactions) {
            if (t == null) continue;
            if (!includeUnposted && !t.isPosted()) continue;
            if (fiscalYear != null && !Objects.equals(t.getFiscalYear(), fiscalYear)) continue;
            if (period != null && !Objects.equals(t.getAccountingPeriod(), period)) continue;
            if (company != null && !company.equals(t.getCompany())) continue;
            if (startDate != null && t.getDate() != null && t.getDate().isBefore(startDate)) continue;
            if (endDate != null && t.getDate() != null && t.getDate().isAfter(endDate)) continue;
            filtered.add(t);
        }

        if (filtered.isEmpty()) {
            res.addError("No GL entries match the selected filters");
            res.setStatus("Failed");
            return res;
        }

        // group by account code
        Map<String, AccountBalance> map = new HashMap<>();

        // to compute opening balances: consider transactions before startDate (if provided)
        Map<String, BigDecimal> openingMap = new HashMap<>();
        if (startDate != null) {
            for (GLTransaction t : glTransactions) {
                if (t == null) continue;
                if (!includeUnposted && !t.isPosted()) continue;
                if (t.getDate() == null || !t.getDate().isBefore(startDate)) continue;
                if (fiscalYear != null && !Objects.equals(t.getFiscalYear(), fiscalYear)) continue;
                if (company != null && !company.equals(t.getCompany())) continue;
                String ac = t.getAccountCode();
                if (ac == null) continue;
                BigDecimal bal = openingMap.getOrDefault(ac, BigDecimal.ZERO);
                bal = bal.add(safe(t.getDebit()).subtract(safe(t.getCredit())));
                openingMap.put(ac, bal);
            }
        }

        // process filtered for debit/credit totals
        for (GLTransaction t : filtered) {
            String ac = t.getAccountCode();
            if (ac == null || ac.trim().isEmpty()) {
                res.addError("Orphan GL entry found without account mapping: id=" + t.getId());
                continue;
            }

            if (inactiveAccounts != null && inactiveAccounts.contains(ac) && !ignoreInactiveAccounts) {
                res.addError("Inactive account included: " + ac);
            }

            AccountBalance ab = map.get(ac);
            if (ab == null) {
                ab = new AccountBalance();
                ab.setAccountCode(ac);
                ab.setAccountName(t.getAccountName());
                ab.setAccountType(t.getAccountType());
                ab.setParentAccount(t.getParentAccount());
                map.put(ac, ab);
            }

            ab.setDebit(ab.getDebit().add(safe(t.getDebit())));
            ab.setCredit(ab.getCredit().add(safe(t.getCredit())));
        }

        // attach opening and closing
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        for (Map.Entry<String, AccountBalance> e : map.entrySet()) {
            String ac = e.getKey();
            AccountBalance ab = e.getValue();
            BigDecimal opening = openingMap.getOrDefault(ac, BigDecimal.ZERO);
            ab.setOpeningBalance(opening);
            BigDecimal closing = opening.add(ab.getDebit()).subtract(ab.getCredit());
            ab.setClosingBalance(closing);
            totalDebit = totalDebit.add(ab.getDebit());
            totalCredit = totalCredit.add(ab.getCredit());
            res.addAccount(ab);
        }

        res.setTotalDebit(totalDebit);
        res.setTotalCredit(totalCredit);
        res.setBalanced(totalDebit.compareTo(totalCredit) == 0);

        if (!res.isBalanced()) {
            res.addError("Trial Balance not balanced: total debit " + totalDebit + " != total credit " + totalCredit);
            res.setStatus("Failed");
        } else {
            res.setStatus("Success");
        }

        return res;
    }

    private static BigDecimal safe(BigDecimal v) { return v == null ? BigDecimal.ZERO : v; }
}
