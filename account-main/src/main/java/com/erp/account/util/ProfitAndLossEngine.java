package com.erp.account.util;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.erp.account.util.AccountBalance;
import com.erp.account.util.PnLCategoryBalance;
import com.erp.account.util.PnLResult;

public class ProfitAndLossEngine {

    // accountCategoryMap: accountCode -> category (REVENUE, COGS, EXPENSE, TAX)
    public static PnLResult generatePnL(
            List<AccountBalance> accountBalances,
            Map<String,String> accountCategoryMap,
            Integer fiscalYear,
            Integer period,
            boolean ignoreInactiveAccounts,
            Set<String> inactiveAccounts,
            boolean allowLockedPeriod,
            Set<Integer> closedPeriods) {

        PnLResult res = new PnLResult();
        res.setFiscalYear(fiscalYear);
        res.setPeriod(period);

        if (accountBalances == null || accountBalances.isEmpty()) {
            res.addError("No account balances provided"); res.setStatus("Failed"); return res;
        }

        if (period != null && closedPeriods != null && closedPeriods.contains(period) && !allowLockedPeriod) {
            res.addError("Accounting period is closed: " + period); res.setStatus("Failed"); return res;
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalCOGS = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;

        for (AccountBalance ab : accountBalances) {
            if (ab == null) continue;
            String ac = ab.getAccountCode();
            if (ac == null || ac.trim().isEmpty()) { res.addError("Orphan account found without code"); continue; }

            if (inactiveAccounts != null && inactiveAccounts.contains(ac) && !ignoreInactiveAccounts) {
                res.addError("Inactive account included: " + ac);
            }

            String cat = null;
            if (accountCategoryMap != null) cat = accountCategoryMap.get(ac);
            if (cat == null) cat = ab.getAccountType();
            if (cat == null) { res.addError("Missing account classification for: " + ac); continue; }

            PnLCategoryBalance p = new PnLCategoryBalance();
            p.setAccountCode(ac); p.setAccountName(ab.getAccountName()); p.setCategory(cat);
            p.setOpeningBalance(ab.getOpeningBalance()); p.setDebit(ab.getDebit()); p.setCredit(ab.getCredit()); p.setClosingBalance(ab.getClosingBalance());

            String up = cat.toUpperCase();
            if (up.contains("REVEN")) {
                totalRevenue = totalRevenue.add(p.getClosingBalance()); res.addRevenue(p);
            } else if (up.contains("COGS") || up.contains("COST")) {
                totalCOGS = totalCOGS.add(p.getClosingBalance()); res.addExpense(p);
            } else if (up.contains("EXPENSE") || up.contains("TAX") || up.contains("DEPRE")) {
                totalExpenses = totalExpenses.add(p.getClosingBalance()); res.addExpense(p);
            } else {
                // Unknown: treat as expense by default
                totalExpenses = totalExpenses.add(p.getClosingBalance()); res.addExpense(p);
            }
        }

        BigDecimal grossProfit = totalRevenue.subtract(totalCOGS);
        BigDecimal netProfit = totalRevenue.subtract(totalCOGS.add(totalExpenses));

        res.setTotalRevenue(totalRevenue);
        res.setTotalCOGS(totalCOGS);
        res.setTotalExpenses(totalExpenses);
        res.setGrossProfit(grossProfit);
        res.setNetProfit(netProfit);

        res.setStatus("Success");
        return res;
    }
}
