package com.erp.account.modules.bankaccount.mapper;

import com.erp.account.modules.bankaccount.dto.response.profile.*;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class BankAccountProfileMapper {

    public BankAccountProfileResponse toProfileResponse(BankAccount bankAccount) {
        if (bankAccount == null) return null;

        return BankAccountProfileResponse.builder()
                .bankAccountMaster(mapMaster(bankAccount))
                .companyInformation(mapCompany(bankAccount.getCompany()))
                .linkedGlAccount(mapGlAccount(bankAccount.getGlAccount()))
                .linkedLedgerAccount(mapLedgerAccount(bankAccount.getGlAccount(), bankAccount.getOpeningBalance(), null))
                .balanceSummary(mapBalanceSummary(bankAccount))
                .bankTransactions(mapBankTransactions(bankAccount.getBankTransactions()))
                .paymentVouchers(mapPaymentVouchers(bankAccount.getPaymentVouchers()))
                .receiptVouchers(new ArrayList<>()) // Receipt Vouchers not directly linked
                .bankReconciliation(mapReconciliation(bankAccount))
                .generalLedgerPostings(new ArrayList<>()) // GL Postings typically linked via transactions, returning empty for bank master
                .statistics(mapStatistics(bankAccount))
                .relatedDocuments(mapRelatedDocuments(bankAccount))
                .attachments(new ArrayList<>()) // No attachments table currently
                .auditInformation(mapAuditInfo(bankAccount))
                .build();
    }

    private BankAccountMasterDto mapMaster(BankAccount bankAccount) {
        if (bankAccount == null) return null;
        String accNum = bankAccount.getAccountNumber();
        String masked = accNum;
        if (accNum != null && accNum.length() > 4) {
            masked = "X".repeat(accNum.length() - 4) + accNum.substring(accNum.length() - 4);
        }
        
        return BankAccountMasterDto.builder()
                .bankAccountId(bankAccount.getId())
                .companyId(bankAccount.getCompany() != null ? bankAccount.getCompany().getId() : null)
                .bankName(bankAccount.getBankName())
                .branchName(bankAccount.getBranchName())
                .accountNumber(masked)
                .ifscCode(bankAccount.getIfscCode())
                .upiId(bankAccount.getUpiId())
                .accountType(bankAccount.getAccountType())
                .isActive(bankAccount.getIsActive())
                .build();
    }

    private CompanyProfileDto mapCompany(Company company) {
        if (company == null) return null;
        return CompanyProfileDto.builder()
                .companyId(company.getId())
                .companyName(company.getCompanyName())
                .gstin(company.getGstin())
                .pan(null) // Company does not have PAN mapped yet
                .baseCurrency(company.getBaseCurrency())
                .build();
    }

    private LinkedGlAccountDto mapGlAccount(ChartOfAccount glAccount) {
        if (glAccount == null) return null;
        return LinkedGlAccountDto.builder()
                .glAccountId(glAccount.getId())
                .glAccountCode(glAccount.getAccountCode())
                .glAccountName(glAccount.getAccountName())
                .accountType(glAccount.getAccountType() != null ? glAccount.getAccountType().name() : null)
                .currentLedgerBalance(BigDecimal.ZERO) // typically calculated dynamically
                .build();
    }

    private LinkedLedgerAccountDto mapLedgerAccount(ChartOfAccount glAccount, BigDecimal openingBalance, BigDecimal currentBalance) {
        if (glAccount == null) return null;
        return LinkedLedgerAccountDto.builder()
                .ledgerAccountId(glAccount.getId())
                .ledgerAccountCode(glAccount.getAccountCode())
                .ledgerAccountName(glAccount.getAccountName())
                .openingBalance(openingBalance)
                .currentBalance(currentBalance) // Bank current balance, simplified here
                .closingBalance(currentBalance)
                .build();
    }

    private BalanceSummaryDto mapBalanceSummary(BankAccount bankAccount) {
        // Simplified mapping. Uncleared amount would normally be calculated from unreconciled transactions.
        return BalanceSummaryDto.builder()
                .openingBalance(bankAccount.getOpeningBalance())
                .currentBalance(null)
                .reconciledBalance(BigDecimal.ZERO)
                .availableBalance(null)
                .unclearedAmount(BigDecimal.ZERO)
                .closingBalance(null)
                .build();
    }

    private List<BankTransactionProfileDto> mapBankTransactions(List<BankTransaction> transactions) {
        if (transactions == null || transactions.isEmpty()) return new ArrayList<>();
        
        List<BankTransaction> sorted = new ArrayList<>(transactions);
        sorted.sort(Comparator.comparing(BankTransaction::getTransactionDate));
        
        List<BankTransactionProfileDto> dtos = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO; // Starting from 0 or opening balance ideally
        
        for (BankTransaction tx : sorted) {
            BigDecimal debit = tx.getDebitAmount() != null ? tx.getDebitAmount() : BigDecimal.ZERO;
            BigDecimal credit = tx.getCreditAmount() != null ? tx.getCreditAmount() : BigDecimal.ZERO;
            runningBalance = runningBalance.add(debit).subtract(credit); // Assuming debit is deposit, credit is withdrawal
            
            dtos.add(BankTransactionProfileDto.builder()
                    .transactionId(tx.getId())
                    .transactionDate(tx.getTransactionDate())
                    .voucherNumber(tx.getReferenceNo()) // Assuming reference is voucher number
                    .voucherType(tx.getTransactionType() != null ? tx.getTransactionType().name() : null)
                    .referenceNumber(tx.getReferenceNo())
                    .description(tx.getNarration())
                    .debit(debit)
                    .credit(credit)
                    .runningBalance(runningBalance)
                    .transactionStatus(tx.getGlPostingStatus() != null ? tx.getGlPostingStatus().name() : null)
                    .build());
        }
        
        return dtos;
    }

    private List<PaymentVoucherProfileSnippetDto> mapPaymentVouchers(List<PaymentVoucher> vouchers) {
        if (vouchers == null) return new ArrayList<>();
        return vouchers.stream().map(v -> PaymentVoucherProfileSnippetDto.builder()
                .voucherId(v.getId())
                .voucherNumber(v.getVoucherNo())
                .vendorName(v.getVendor() != null ? v.getVendor().getVendorName() : null)
                .paymentAmount(v.getPaymentAmount())
                .paymentMode(v.getPaymentMode())
                .status(v.getPaymentStatus())
                .build()).collect(Collectors.toList());
    }

    private BankReconciliationSnippetDto mapReconciliation(BankAccount bankAccount) {
        return BankReconciliationSnippetDto.builder()
                .reconciliationStatus("UNRECONCILED")
                .lastReconciliationDate(null)
                .clearedBalance(BigDecimal.ZERO)
                .unclearedDeposits(BigDecimal.ZERO)
                .outstandingCheques(BigDecimal.ZERO)
                .reconciliationDifference(BigDecimal.ZERO)
                .build();
    }

    private BankStatisticsDto mapStatistics(BankAccount bankAccount) {
        int txCount = bankAccount.getBankTransactions() != null ? bankAccount.getBankTransactions().size() : 0;
        int pvCount = bankAccount.getPaymentVouchers() != null ? bankAccount.getPaymentVouchers().size() : 0;
        
        BigDecimal totalDeposits = BigDecimal.ZERO;
        BigDecimal totalWithdrawals = BigDecimal.ZERO;
        
        if (bankAccount.getBankTransactions() != null) {
            for (BankTransaction tx : bankAccount.getBankTransactions()) {
                if (tx.getDebitAmount() != null) totalDeposits = totalDeposits.add(tx.getDebitAmount());
                if (tx.getCreditAmount() != null) totalWithdrawals = totalWithdrawals.add(tx.getCreditAmount());
            }
        }
        
        return BankStatisticsDto.builder()
                .totalTransactions(txCount)
                .totalReceipts(0) // Requires receipt vouchers logic
                .totalPayments(pvCount)
                .totalDeposits(totalDeposits)
                .totalWithdrawals(totalWithdrawals)
                .averageMonthlyBalance(null)
                .lastTransactionDate(null) // Could dynamically compute from tx list
                .build();
    }

    private RelatedDocumentsDto mapRelatedDocuments(BankAccount bankAccount) {
        List<UUID> pvs = new ArrayList<>();
        if (bankAccount.getPaymentVouchers() != null) {
            pvs = bankAccount.getPaymentVouchers().stream().map(PaymentVoucher::getId).collect(Collectors.toList());
        }
        
        return RelatedDocumentsDto.builder()
                .paymentVouchers(pvs)
                .receiptVouchers(new ArrayList<>())
                .journalEntries(new ArrayList<>())
                .bankCharges(new ArrayList<>())
                .interestEntries(new ArrayList<>())
                .bankStatements(new ArrayList<>())
                .build();
    }

    private AuditInfoDto mapAuditInfo(BankAccount bankAccount) {
        return AuditInfoDto.builder()
                .createdBy(bankAccount.getCreatedBy())
                .createdAt(bankAccount.getCreatedAt())
                .updatedBy(bankAccount.getUpdatedBy())
                .updatedAt(bankAccount.getUpdatedAt())
                .isDeleted(bankAccount.getIsDeleted())
                .build();
    }
}
