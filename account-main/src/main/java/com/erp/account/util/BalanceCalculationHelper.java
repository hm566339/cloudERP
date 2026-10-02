package com.erp.account.util;

import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.banktransaction.entity.BankTransaction;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public final class BalanceCalculationHelper {

    private BalanceCalculationHelper() {
        throw new UnsupportedOperationException("BalanceCalculationHelper is a utility class");
    }

    public static BigDecimal calculateCurrentBalance(BankAccount bankAccount, List<BankTransaction> transactions) {
        BigDecimal debitTotal = transactions.stream()
                .map(tx -> tx.getDebitAmount() == null ? BigDecimal.ZERO : tx.getDebitAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal creditTotal = transactions.stream()
                .map(tx -> tx.getCreditAmount() == null ? BigDecimal.ZERO : tx.getCreditAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return calculateOpeningBalance(bankAccount)
                .add(creditTotal)
                .subtract(debitTotal);
    }

    public static BigDecimal calculateUnreconciledBalance(List<BankTransaction> unreconciledTransactions) {
        BigDecimal debitTotal = unreconciledTransactions.stream()
                .map(tx -> tx.getDebitAmount() == null ? BigDecimal.ZERO : tx.getDebitAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal creditTotal = unreconciledTransactions.stream()
                .map(tx -> tx.getCreditAmount() == null ? BigDecimal.ZERO : tx.getCreditAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return creditTotal.subtract(debitTotal);
    }

    public static BigDecimal calculateOpeningBalance(BankAccount bankAccount) {
        return bankAccount.getOpeningBalance() == null ? BigDecimal.ZERO : bankAccount.getOpeningBalance();
    }

    public static void sortTransactionsChronologically(List<BankTransaction> transactions) {
        transactions.sort(Comparator.comparing(BankTransaction::getTransactionDate));
    }
}
