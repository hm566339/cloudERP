package com.erp.account.util;

import com.erp.account.modules.bankaccount.dto.response.BankLedgerEntryResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class BankLedgerHelper {

    private BankLedgerHelper() {
        throw new UnsupportedOperationException("BankLedgerHelper is a utility class");
    }

    public static java.util.List<com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse> buildTransactionLedgerEntries(
            List<BankTransaction> transactions,
            BigDecimal openingBalance
    ) {
        java.util.List<com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse> ledgerEntries = new ArrayList<>();

        BigDecimal runningBalance =
                openingBalance == null ? BigDecimal.ZERO : openingBalance;

        List<BankTransaction> sortedTransactions = transactions.stream()
                .sorted(Comparator.comparing(BankTransaction::getTransactionDate))
                .toList();

        for (BankTransaction transaction : sortedTransactions) {

            BigDecimal debit = transaction.getDebitAmount() == null
                    ? BigDecimal.ZERO
                    : transaction.getDebitAmount();

            BigDecimal credit = transaction.getCreditAmount() == null
                    ? BigDecimal.ZERO
                    : transaction.getCreditAmount();

            runningBalance = runningBalance.add(credit).subtract(debit);

            ledgerEntries.add(
                    com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse.builder()
                            .transactionId(transaction.getId())
                            .transactionDate(transaction.getTransactionDate())
                            .referenceNo(transaction.getReferenceNo())
                            .utrNo(transaction.getUtrNo())
                            .narration(transaction.getNarration())
                            .debitAmount(debit)
                            .creditAmount(credit)
                            .runningBalance(runningBalance)
                            .reconciled(Boolean.TRUE.equals(transaction.getReconciled()))
                            .transactionType(transaction.getTransactionType() != null ? transaction.getTransactionType().name() : null)
                            .build()
            );
        }

        return ledgerEntries;
    }

    public static List<BankLedgerEntryResponse> buildLedgerEntries(
            List<BankTransaction> transactions,
            BigDecimal openingBalance
    ) {

        List<BankLedgerEntryResponse> ledgerEntries = new ArrayList<>();

        BigDecimal runningBalance =
                openingBalance == null ? BigDecimal.ZERO : openingBalance;

        List<BankTransaction> sortedTransactions = transactions.stream()
                .sorted(Comparator.comparing(BankTransaction::getTransactionDate))
                .toList();

        for (BankTransaction transaction : sortedTransactions) {

            BigDecimal debit = transaction.getDebitAmount() == null
                    ? BigDecimal.ZERO
                    : transaction.getDebitAmount();

            BigDecimal credit = transaction.getCreditAmount() == null
                    ? BigDecimal.ZERO
                    : transaction.getCreditAmount();

            runningBalance = runningBalance.add(credit).subtract(debit);

            ledgerEntries.add(
                    BankLedgerEntryResponse.builder()
                            .transactionId(transaction.getId())
                            .transactionDate(transaction.getTransactionDate())
                            .referenceNo(transaction.getReferenceNo())
                            .narration(transaction.getNarration())
                            .debitAmount(debit)
                            .creditAmount(credit)
                            .reconciled(Boolean.TRUE.equals(transaction.getReconciled()))
                            .runningBalance(runningBalance)
                            .build()
            );
        }

        return ledgerEntries;
    }
}
