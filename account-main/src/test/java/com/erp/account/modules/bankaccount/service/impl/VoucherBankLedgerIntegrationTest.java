package com.erp.account.modules.bankaccount.service.impl;

import com.erp.account.enums.BankTransactionType;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
import com.erp.account.modules.accounting.service.AccountingPolicyService;
import com.erp.account.modules.accounting.service.AccountingPostingService;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.apinvoice.service.AccountingValidationService;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.bankaccount.dto.response.BankLedgerPageResult;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.repository.BankAccountRepository;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryRequest;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import com.erp.account.modules.paymentvoucher.repository.PaymentVoucherRepository;
import com.erp.account.modules.paymentvoucher.service.impl.PaymentVoucherServiceImpl;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.receiptvoucher.repository.ReceiptVoucherRepository;
import com.erp.account.modules.receiptvoucher.service.ReceiptVoucherPostingService;
import com.erp.account.modules.salesinvoice.repository.SalesInvoiceRepository;
import com.erp.account.modules.vendor.entity.Vendor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoucherBankLedgerIntegrationTest {

    @Mock
    private BankAccountRepository bankAccountRepository;

    @Mock
    private BankTransactionRepository bankTransactionRepository;

    @Mock
    private SalesInvoiceRepository salesInvoiceRepository;

    @Mock
    private GlJournalEntryService glJournalEntryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private AccountingPolicyService accountingPolicyService;

    @Mock
    private AccountingPostingService accountingPostingService;

    @Mock
    private AccountingValidationService accountingValidationService;

    @Mock
    private PaymentVoucherRepository paymentVoucherRepository;

    @InjectMocks
    private ReceiptVoucherPostingService receiptVoucherPostingService;

    @InjectMocks
    private BankAccountServiceImpl bankAccountService;

    private UUID companyId;
    private UUID bankAccountId;
    private Company company;
    private BankAccount bankAccount;
    private ChartOfAccount bankGlAccount;
    private ChartOfAccount receivableAccount;
    private ChartOfAccount payableAccount;
    private Customer customer;
    private Vendor vendor;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        bankAccountId = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);

        bankGlAccount = new ChartOfAccount();
        bankGlAccount.setId(UUID.randomUUID());
        bankGlAccount.setAccountCode("1010-HDFC");
        bankGlAccount.setAccountName("HDFC Bank Account");
        bankGlAccount.setCompany(company);

        receivableAccount = new ChartOfAccount();
        receivableAccount.setId(UUID.randomUUID());
        receivableAccount.setAccountCode("1050-AR");
        receivableAccount.setAccountName("Accounts Receivable");
        receivableAccount.setCompany(company);

        payableAccount = new ChartOfAccount();
        payableAccount.setId(UUID.randomUUID());
        payableAccount.setAccountCode("2010-AP");
        payableAccount.setAccountName("Accounts Payable");
        payableAccount.setCompany(company);

        bankAccount = BankAccount.builder()
                .id(bankAccountId)
                .bankName("HDFC Bank")
                .accountNumber("XXXXXXXX7890")
                .ifscCode("HDFC0001234")
                .openingBalance(new BigDecimal("250000.00"))
                .company(company)
                .glAccount(bankGlAccount)
                .isActive(true)
                .build();
        bankAccount.setIsDeleted(false);

        customer = new Customer();
        customer.setId(UUID.randomUUID());
        customer.setCustomerName("ABC Pvt Ltd");
        customer.setCustomerCode("CUST-001");
        customer.setCompany(company);

        vendor = new Vendor();
        vendor.setId(UUID.randomUUID());
        vendor.setVendorName("XYZ Suppliers");
        vendor.setVendorCode("VEND-001");
        vendor.setCompany(company);
    }

    @Test
    @DisplayName("Test 1: Receipt Voucher Posting creates Bank Transaction & updates Bank Ledger")
    void testReceiptVoucherPostingCreatesBankLedgerTransaction() {
        UUID journalId = UUID.randomUUID();
        GlJournalEntry journalEntry = new GlJournalEntry();
        journalEntry.setId(journalId);

        when(accountingValidationService.fiscalYearFor(any(), any())).thenReturn(new FiscalYear());
        when(accountingValidationService.accountingPeriodFor(any(), any())).thenReturn(new AccountingPeriod());
        when(accountingPostingService.postJournalEntry(any(GlJournalEntryRequest.class), any(), any(), any(), any(), any()))
                .thenReturn(journalEntry);
        when(bankTransactionRepository.existsByGlJournalEntryIdAndIsDeletedFalse(journalId)).thenReturn(false);

        ReceiptVoucher receiptVoucher = ReceiptVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .customer(customer)
                .bankAccount(bankAccount)
                .receiptNo("RV-000123")
                .receiptDate(LocalDate.of(2026, 8, 24))
                .receiptAmount(new BigDecimal("50000.00"))
                .paymentMode(PaymentMode.NEFT)
                .referenceNo("UTR-RV-001")
                .receiptAccount(bankGlAccount)
                .receivableAccount(receivableAccount)
                .receiptStatus(ReceiptVoucherStatus.APPROVED)
                .glPostingStatus(PostingStatus.DRAFT)
                .allocations(new ArrayList<>())
                .build();

        // 1. Post Receipt Voucher
        receiptVoucherPostingService.post(receiptVoucher);

        // 2. Verify BankTransaction was created and saved
        ArgumentCaptor<BankTransaction> captor = ArgumentCaptor.forClass(BankTransaction.class);
        verify(bankTransactionRepository).save(captor.capture());
        BankTransaction savedTx = captor.getValue();

        assertNotNull(savedTx);
        assertEquals(bankAccount.getId(), savedTx.getBankAccount().getId());
        assertEquals("RV-000123", savedTx.getReferenceNo());
        assertEquals("UTR-RV-001", savedTx.getUtrNo());
        assertEquals(BankTransactionType.RECEIPT, savedTx.getTransactionType());
        assertEquals(new BigDecimal("50000.00"), savedTx.getCreditAmount());
        assertEquals(BigDecimal.ZERO, savedTx.getDebitAmount());
        assertEquals(journalId, savedTx.getGlJournalEntryId());
        assertEquals(PostingStatus.POSTED, savedTx.getGlPostingStatus());
        assertFalse(savedTx.getReconciled());

        // 3. Verify Bank Ledger calculation reflects this transaction
        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId)).thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(BigDecimal.ZERO);
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("50000.00"));
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(0L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(List.of(savedTx));
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(savedTx), PageRequest.of(0, 20), 1));

        BankLedgerPageResult ledgerResult = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));
        BankLedgerResponse ledger = ledgerResult.getLedgerResponse();

        assertEquals(new BigDecimal("250000.00"), ledger.getOpeningBalance());
        assertEquals(new BigDecimal("0.00"), ledger.getTotalDebits());
        assertEquals(new BigDecimal("50000.00"), ledger.getTotalCredits());
        assertEquals(new BigDecimal("300000.00"), ledger.getClosingBalance());
        assertEquals(1L, ledger.getTotalTransactions());
        assertEquals(1, ledger.getLedgerEntries().size());
        assertEquals(new BigDecimal("300000.00"), ledger.getLedgerEntries().get(0).getRunningBalance());
        assertEquals("RV-000123", ledger.getLedgerEntries().get(0).getReferenceNo());
    }

    @Test
    @DisplayName("Test 2 & 3: Interleaved Receipt Voucher + Payment Voucher running balance on Bank Ledger")
    void testInterleavedReceiptAndPaymentVouchersOnLedger() {
        // Initial Opening Balance = ₹250,000.00
        // Tx1: Receipt Voucher RV-1 = +₹50,000.00 -> Running = ₹300,000.00
        // Tx2: Payment Voucher PV-1 = -₹25,000.00 -> Running = ₹275,000.00

        BankTransaction rvTx = BankTransaction.builder()
                .id(UUID.randomUUID())
                .company(company)
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 20))
                .referenceNo("RV-0001")
                .utrNo("UTR-RV-001")
                .transactionType(BankTransactionType.RECEIPT)
                .creditAmount(new BigDecimal("50000.00"))
                .debitAmount(BigDecimal.ZERO)
                .narration("Receipt Voucher: RV-0001 - ABC Pvt Ltd")
                .reconciled(true)
                .build();

        BankTransaction pvTx = BankTransaction.builder()
                .id(UUID.randomUUID())
                .company(company)
                .bankAccount(bankAccount)
                .transactionDate(LocalDate.of(2026, 8, 22))
                .referenceNo("PV-0001")
                .utrNo("UTR-PV-001")
                .transactionType(BankTransactionType.PAYMENT)
                .creditAmount(BigDecimal.ZERO)
                .debitAmount(new BigDecimal("25000.00"))
                .narration("Payment Voucher: PV-0001 - XYZ Suppliers")
                .reconciled(false)
                .build();

        List<BankTransaction> allTx = List.of(rvTx, pvTx);

        when(bankAccountRepository.findByIdAndIsDeletedFalse(bankAccountId)).thenReturn(Optional.of(bankAccount));
        when(bankTransactionRepository.sumDebitByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("25000.00"));
        when(bankTransactionRepository.sumCreditByBankAccountId(bankAccountId)).thenReturn(new BigDecimal("50000.00"));
        when(bankTransactionRepository.countByBankAccountIdAndIsDeletedFalse(bankAccountId)).thenReturn(2L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId)).thenReturn(1L);
        when(bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId)).thenReturn(allTx);
        when(bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(eq(bankAccountId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(allTx, PageRequest.of(0, 20), 2));

        BankLedgerPageResult ledgerResult = bankAccountService.getBankLedger(bankAccountId, PageRequest.of(0, 20));
        BankLedgerResponse ledger = ledgerResult.getLedgerResponse();

        assertEquals(new BigDecimal("250000.00"), ledger.getOpeningBalance());
        assertEquals(new BigDecimal("25000.00"), ledger.getTotalDebits());
        assertEquals(new BigDecimal("50000.00"), ledger.getTotalCredits());
        assertEquals(new BigDecimal("275000.00"), ledger.getClosingBalance());
        assertEquals(2L, ledger.getTotalTransactions());
        assertEquals(1L, ledger.getReconciledTransactions());
        assertEquals(1L, ledger.getUnreconciledTransactions());

        assertEquals(2, ledger.getLedgerEntries().size());
        assertEquals(new BigDecimal("300000.00"), ledger.getLedgerEntries().get(0).getRunningBalance());
        assertEquals(new BigDecimal("275000.00"), ledger.getLedgerEntries().get(1).getRunningBalance());
    }

    @Test
    @DisplayName("Test 4: Cash Receipt (No Bank Account) does NOT create Bank Transaction")
    void testCashReceiptDoesNotCreateBankTransaction() {
        UUID journalId = UUID.randomUUID();
        GlJournalEntry journalEntry = new GlJournalEntry();
        journalEntry.setId(journalId);

        when(accountingValidationService.fiscalYearFor(any(), any())).thenReturn(new FiscalYear());
        when(accountingValidationService.accountingPeriodFor(any(), any())).thenReturn(new AccountingPeriod());
        when(accountingPostingService.postJournalEntry(any(), any(), any(), any(), any(), any())).thenReturn(journalEntry);

        ReceiptVoucher cashReceipt = ReceiptVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .customer(customer)
                .bankAccount(null) // No bank account selected (Cash transaction)
                .receiptNo("RV-CASH-01")
                .receiptDate(LocalDate.of(2026, 8, 24))
                .receiptAmount(new BigDecimal("10000.00"))
                .paymentMode(PaymentMode.CASH)
                .receiptAccount(bankGlAccount)
                .receivableAccount(receivableAccount)
                .receiptStatus(ReceiptVoucherStatus.APPROVED)
                .allocations(new ArrayList<>())
                .build();

        receiptVoucherPostingService.post(cashReceipt);

        // Verify NO bank transaction is saved
        verify(bankTransactionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Test 5: Receipt Voucher Reversal soft-deletes the Bank Transaction from Ledger")
    void testReceiptVoucherReversalSoftDeletesBankTransaction() {
        UUID journalId = UUID.randomUUID();

        BankTransaction existingTx = BankTransaction.builder()
                .id(UUID.randomUUID())
                .company(company)
                .bankAccount(bankAccount)
                .glJournalEntryId(journalId)
                .build();
        existingTx.setIsDeleted(false);

        ReceiptVoucher postedReceipt = ReceiptVoucher.builder()
                .id(UUID.randomUUID())
                .company(company)
                .glJournalEntryId(journalId)
                .glPostingStatus(PostingStatus.POSTED)
                .receiptStatus(ReceiptVoucherStatus.POSTED)
                .allocations(new ArrayList<>())
                .build();

        when(bankTransactionRepository.findByGlJournalEntryIdAndIsDeletedFalse(journalId))
                .thenReturn(Optional.of(existingTx));

        receiptVoucherPostingService.reverse(postedReceipt);

        assertTrue(existingTx.getIsDeleted());
        verify(bankTransactionRepository).save(existingTx);
        verify(glJournalEntryService).reverseJournalEntry(journalId);
    }
}
