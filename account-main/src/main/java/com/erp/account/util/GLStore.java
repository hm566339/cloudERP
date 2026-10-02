package com.erp.account.util;

import java.math.BigDecimal;
import java.util.*;

import com.erp.account.util.GLTransaction;

public class GLStore {
    private final List<GLTransaction> transactions = new ArrayList<>();
    private final Map<String, BigDecimal> runningBalances = new HashMap<>();
    private final Set<String> postedKeys = new HashSet<>();

    public synchronized void addTransaction(GLTransaction t, String key) {
        transactions.add(t);
        postedKeys.add(key);
        String ac = t.getAccountCode();
        if (ac != null) {
            BigDecimal prev = runningBalances.getOrDefault(ac, BigDecimal.ZERO);
            BigDecimal newBal = prev.add(nullSafe(t.getDebit()).subtract(nullSafe(t.getCredit())));
            runningBalances.put(ac, newBal);
        }
    }

    public synchronized List<GLTransaction> getTransactions() { return Collections.unmodifiableList(transactions); }
    public synchronized BigDecimal getRunningBalance(String account) { return runningBalances.getOrDefault(account, BigDecimal.ZERO); }
    public synchronized boolean isPostedKey(String key) { return postedKeys.contains(key); }

    private static java.math.BigDecimal nullSafe(java.math.BigDecimal v) { return v == null ? java.math.BigDecimal.ZERO : v; }
}
