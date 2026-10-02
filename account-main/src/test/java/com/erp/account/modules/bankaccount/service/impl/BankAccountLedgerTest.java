package com.erp.account.modules.bankaccount.service.impl;

import com.erp.account.common.exception.BankAccountNotFoundException;
import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.bankaccount.dto.response.BankLedgerPageResult;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.company.entity.Company;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BankAccountLedgerTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankTransactionRepository bankTransactionRepository;

    @InjectMocks
    private BankAccountServiceImpl bankAccountService;

    private UUID bankAccountId;
    private UUID companyId;
    private BankAccount bankAccount;

    @BeforeEach
    void setUp() {
        bankAccountId = UUID.randomUUID();
        companyId = UUID.randomUUID();

        Company company = new Company();
        company.setId(companyId);

        bankAccount = BankAccount.builder()
                .id(bankAccountId)
                .bankName("HDFC Bank")
                .accountNumber("1234567890")
                .ifscCode("HDFC0001234")
                .openingBalance(new BigDecimal("100000.00"))
                .company(company)
                .isActive(true)
                .build();
        bankAccount.setIsDeleted(false);
    }

    @Test
    @DisplayName("1. Should return empty ledger when bank account has no transactions")
    void testEmptyLedger() {
        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(BigDecimal.ZERO);
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(BigDecimal.ZERO);
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(List.of());
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(), PageRequest.of(0, 20), 0));

        BankLedgerPageResult result = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));

        assertNotNull(result);
        BankLedgerResponse response = result.getLedgerResponse();
        assertEquals(bankAccountId, response.getBankAccountId());
        assertEquals("HDFC Bank", response.getBankName());
        assertEquals("1234567890", response.getAccountNumber());
        assertEquals("HDFC0001234", response.getIfscCode());
        assertEquals(new BigDecimal("100000.00"), response.getOpeningBalance());
        assertEquals(new BigDecimal("0.00"), response.getTotalDebits());
        assertEquals(new BigDecimal("0.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("100000.00"), response.getClosingBalance());
        assertEquals(0L, response.getTotalTransactions());
        assertEquals(0L, response.getReconciledTransactions());
        assertEquals(0L, response.getUnreconciledTransactions());
        assertTrue(response.getLedgerEntries().isEmpty());
    }

    @Test
    @DisplayName("2. Should throw BankAccountNotFoundException when bank account does not exist")
    void testNonExistentBankAccount() {
        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.empty());

        assertThrows(BankAccountNotFoundException.class, () ->
                bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20)));
    }

    @Test
    @DisplayName("3. Should correctly calculate running balance and totals for a single credit transaction")
    void testSingleCreditTransaction() {
        BankTransaction creditTx = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 20))
                .referenceNo("REF-CR-1")
                .utrNo("UTR001")
                .narration("Client invoice payment")
                .transactionType(BankTransactionType.RECEIPT)
                .creditAmount(new BigDecimal("25000.00"))
                .debitAmount(BigDecimal.ZERO)
                .reconciled(true)
                .build();

        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(BigDecimal.ZERO);
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("25000.00"));
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(List.of(creditTx));
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(creditTx), PageRequest.of(0, 20), 1));

        BankLedgerPageResult result = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));
        BankLedgerResponse response = result.getLedgerResponse();

        assertEquals(new BigDecimal("100000.00"), response.getOpeningBalance());
        assertEquals(new BigDecimal("0.00"), response.getTotalDebits());
        assertEquals(new BigDecimal("25000.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("125000.00"), response.getClosingBalance());
        assertEquals(1L, response.getTotalTransactions());
        assertEquals(1L, response.getReconciledTransactions());
        assertEquals(0L, response.getUnreconciledTransactions());

        assertEquals(1, response.getLedgerEntries().size());
        BankLedgerEntryResponse entry = response.getLedgerEntries().get(0);
        assertEquals(new BigDecimal("25000.00"), entry.getCreditAmount());
        assertEquals(new BigDecimal("0.00"), entry.getDebitAmount());
        assertEquals(new BigDecimal("125000.00"), entry.getRunningBalance());
        assertTrue(entry.getReconciled());
    }

    @Test
    @DisplayName("4. Should correctly calculate running balance and totals for a single debit transaction")
    void testSingleDebitTransaction() {
        BankTransaction debitTx = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 20))
                .referenceNo("REF-DR-1")
                .utrNo("UTR002")
                .narration("Office rent")
                .transactionType(BankTransactionType.PAYMENT)
                .debitAmount(new BigDecimal("25000.00"))
                .creditAmount(BigDecimal.ZERO)
                .reconciled(false)
                .build();

        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("25000.00"));
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(BigDecimal.ZERO);
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(List.of(debitTx));
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(debitTx), PageRequest.of(0, 20), 1));

        BankLedgerPageResult result = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));
        BankLedgerResponse response = result.getLedgerResponse();

        assertEquals(new BigDecimal("100000.00"), response.getOpeningBalance());
        assertEquals(new BigDecimal("25000.00"), response.getTotalDebits());
        assertEquals(new BigDecimal("0.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("75000.00"), response.getClosingBalance());
        assertEquals(1L, response.getTotalTransactions());
        assertEquals(0L, response.getReconciledTransactions());
        assertEquals(1L, response.getUnreconciledTransactions());

        assertEquals(1, response.getLedgerEntries().size());
        BankLedgerEntryResponse entry = response.getLedgerEntries().get(0);
        assertEquals(new BigDecimal("0.00"), entry.getCreditAmount());
        assertEquals(new BigDecimal("25000.00"), entry.getDebitAmount());
        assertEquals(new BigDecimal("75000.00"), entry.getRunningBalance());
        assertFalse(entry.getReconciled());
    }

    @Test
    @DisplayName("5. Should correctly calculate multiple transactions (Requirement 24 scenario)")
    void testMultipleTransactions() {
        // Opening = 100,000
        // Tx1: Credit 50,000 -> Running = 150,000
        // Tx2: Debit 20,000  -> Running = 130,000
        // Tx3: Credit 10,000 -> Running = 140,000
        // Closing = 140,000, TotalCredits = 60,000, TotalDebits = 20,000

        BankTransaction tx1 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 1))
                .referenceNo("TX1")
                .narration("Credit 1")
                .creditAmount(new BigDecimal("50000.00"))
                .debitAmount(BigDecimal.ZERO)
                .reconciled(true)
                .transactionType(BankTransactionType.RECEIPT)
                .build();

        BankTransaction tx2 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 5))
                .referenceNo("TX2")
                .narration("Debit 1")
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(new BigDecimal("20000.00"))
                .reconciled(true)
                .transactionType(BankTransactionType.PAYMENT)
                .build();

        BankTransaction tx3 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 10))
                .referenceNo("TX3")
                .narration("Credit 2")
                .creditAmount(new BigDecimal("10000.00"))
                .debitAmount(BigDecimal.ZERO)
                .reconciled(false)
                .transactionType(BankTransactionType.RECEIPT)
                .build();

        List<BankTransaction> allTx = List.of(tx1, tx2, tx3);

        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("20000.00"));
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("60000.00"));
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(3L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(2L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(allTx);
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(allTx, PageRequest.of(0, 20), 3));

        BankLedgerPageResult result = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));
        BankLedgerResponse response = result.getLedgerResponse();

        assertEquals(new BigDecimal("100000.00"), response.getOpeningBalance());
        assertEquals(new BigDecimal("20000.00"), response.getTotalDebits());
        assertEquals(new BigDecimal("60000.00"), response.getTotalCredits());
        assertEquals(new BigDecimal("140000.00"), response.getClosingBalance());
        assertEquals(3L, response.getTotalTransactions());
        assertEquals(2L, response.getReconciledTransactions());
        assertEquals(1L, response.getUnreconciledTransactions());

        List<BankLedgerEntryResponse> entries = response.getLedgerEntries();
        assertEquals(3, entries.size());
        assertEquals(new BigDecimal("150000.00"), entries.get(0).getRunningBalance());
        assertEquals(new BigDecimal("130000.00"), entries.get(1).getRunningBalance());
        assertEquals(new BigDecimal("140000.00"), entries.get(2).getRunningBalance());
    }

    @Test
    @DisplayName("6. Should maintain correct running balance across pages (Page 2 requests)")
    void testCrossPageRunningBalance() {
        // 3 total transactions: Tx1 (Page 0), Tx2 (Page 1), Tx3 (Page 2) with pageSize=1
        BankTransaction tx1 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 1))
                .creditAmount(new BigDecimal("50000.00"))
                .debitAmount(BigDecimal.ZERO)
                .build();

        BankTransaction tx2 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 5))
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(new BigDecimal("20000.00"))
                .build();

        BankTransaction tx3 = BankTransaction.builder()
                .id(UUID.randomUUID())
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 10))
                .creditAmount(new BigDecimal("10000.00"))
                .debitAmount(BigDecimal.ZERO)
                .build();

        List<BankTransaction> allTx = List.of(tx1, tx2, tx3);

        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId))
                .thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("20000.00"));
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("60000.00"));
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(3L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(3L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(allTx);

        // User requests Page 1 (which should contain Tx2)
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), eq(PageRequest.of(1, 1))))
                .thenReturn(new PageImpl<>(List.of(tx2), PageRequest.of(1, 1), 3));

        BankLedgerPageResult result = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(1, 1));
        BankLedgerResponse response = result.getLedgerResponse();

        // The single entry on Page 1 is Tx2, and its running balance MUST be 130,000 (100,000 + 50,000 - 20,000)
        assertEquals(1, response.getLedgerEntries().size());
        BankLedgerEntryResponse entry = response.getLedgerEntries().get(0);
        assertEquals(tx2.getId(), entry.getTransactionId());
        assertEquals(new BigDecimal("130000.00"), entry.getRunningBalance());

        // Pagination metadata
        assertEquals(1, result.getPagination().getPage());
        assertEquals(1, result.getPagination().getSize());
        assertEquals(3L, result.getPagination().getTotalElements());
        assertEquals(3, result.getPagination().getTotalPages());
        assertTrue(result.getPagination().isHasNext());
        assertTrue(result.getPagination().isHasPrevious());
    }
}
