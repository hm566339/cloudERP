package com.erp.account.util;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import com.erp.account.util.AccountBalance;
import com.erp.account.util.AccountCategoryBalance;
import com.erp.account.util.BalanceSheetResult;

public class BalanceSheetEngine {

    // accountCategoryMap: accountCode -> category (ASSET, LIABILITY, EQUITY)
    public static BalanceSheetResult generateBalanceSheet(
            List<AccountBalance> accountBalances,
            Map<String,String> accountCategoryMap,
            Integer fiscalYear,
            Integer period,
            String company,
            boolean ignoreInactiveAccounts,
            Set<String> inactiveAccounts,
            boolean allowLockedPeriod,
            Set<Integer> closedPeriods) {

        BalanceSheetResult res = new BalanceSheetResult();
        res.setFiscalYear(fiscalYear);
        res.setPeriod(period);

        if (accountBalances == null || accountBalances.isEmpty()) {
            res.addError("No account balances provided"); res.setStatus("Failed"); return res;
        }

        if (period != null && closedPeriods != null && closedPeriods.contains(period) && !allowLockedPeriod) {
            res.addError("Accounting period is closed: " + period); res.setStatus("Failed"); return res;
        }

        BigDecimal totalAssets = BigDecimal.ZERO;
        BigDecimal totalLiabilities = BigDecimal.ZERO;
        BigDecimal totalEquity = BigDecimal.ZERO;

        Map<String,AccountCategoryBalance> categorized = new HashMap<>();

        for (AccountBalance ab : accountBalances) {
            if (ab == null) continue;
            String ac = ab.getAccountCode();
            if (ac == null || ac.trim().isEmpty()) { res.addError("Orphan account found without code"); continue; }

            if (inactiveAccounts != null && inactiveAccounts.contains(ac) && !ignoreInactiveAccounts) {
                res.addError("Inactive account included: " + ac);
            }

            String cat = null;
            if (accountCategoryMap != null) cat = accountCategoryMap.get(ac);
            if (cat == null) {
                // try infer from account type if present in AccountBalance
                cat = ab.getAccountType();
            }
            if (cat == null) { res.addError("Missing account group mapping for: " + ac); continue; }

            AccountCategoryBalance acb = new AccountCategoryBalance();
            acb.setAccountCode(ac);
            acb.setAccountName(ab.getAccountName());
            acb.setCategory(cat);
            acb.setOpeningBalance(ab.getOpeningBalance());
            acb.setDebit(ab.getDebit());
            acb.setCredit(ab.getCredit());
            acb.setClosingBalance(ab.getClosingBalance());

            categorized.put(ac, acb);

            String up = cat.toUpperCase();
            if (up.contains("ASSET")) {
                totalAssets = totalAssets.add(acb.getClosingBalance());
                res.addAsset(acb);
            } else if (up.contains("LIABIL" ) ) {
                totalLiabilities = totalLiabilities.add(acb.getClosingBalance());
                res.addLiability(acb);
            } else if (up.contains("EQUITY") || up.contains("CAPITAL") || up.contains("RETAIN")) {
                totalEquity = totalEquity.add(acb.getClosingBalance());
                res.addEquity(acb);
            } else {
                // unknown treated as asset by default
                totalAssets = totalAssets.add(acb.getClosingBalance());
                res.addAsset(acb);
            }
        }

        res.setTotalAssets(totalAssets);
        res.setTotalLiabilities(totalLiabilities);
        res.setTotalEquity(totalEquity);

        // Balance check: Assets == Liabilities + Equity
        BigDecimal rhs = totalLiabilities.add(totalEquity);
        boolean balanced = totalAssets.compareTo(rhs) == 0;
        res.setBalanced(balanced);
        if (!balanced) {
            res.addError("Balance Sheet mismatch: assets " + totalAssets + " != liabilities+equity " + rhs);
            res.setStatus("Failed");
        } else {
            res.setStatus("Success");
        }

        return res;
    }
}
