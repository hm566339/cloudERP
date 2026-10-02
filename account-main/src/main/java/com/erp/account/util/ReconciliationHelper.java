package com.erp.account.util;

import com.erp.account.modules.bankaccount.dto.response.BankReconciliationResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;

import java.math.BigDecimal;
import java.util.List;

public final class ReconciliationHelper {

    private ReconciliationHelper() {
        throw new UnsupportedOperationException("ReconciliationHelper is a utility class");
    }

    public static BankReconciliationResponse buildReconciliationResponse(
            BigDecimal bookBalance,
            BigDecimal bankStatementBalance,
            List<BankTransaction> matchedTransactions,
            List<BankTransaction> unreconciledTransactions) {

        BigDecimal reconciliationDifference = bookBalance.subtract(bankStatementBalance);
        BigDecimal unreconciledAmount = BalanceCalculationHelper.calculateUnreconciledBalance(unreconciledTransactions);

        return BankReconciliationResponse.builder()
                .bookBalance(bookBalance)
                .bankStatementBalance(bankStatementBalance)
                .reconciliationDifference(reconciliationDifference)
                .unreconciledAmount(unreconciledAmount)
                .matchedTransactionCount(matchedTransactions == null ? 0 : matchedTransactions.size())
                .unreconciledTransactionCount(unreconciledTransactions == null ? 0 : unreconciledTransactions.size())
                .totalTransactionCount((matchedTransactions == null ? 0 : matchedTransactions.size()) + (unreconciledTransactions == null ? 0 : unreconciledTransactions.size()))
                .build();
    }
}
