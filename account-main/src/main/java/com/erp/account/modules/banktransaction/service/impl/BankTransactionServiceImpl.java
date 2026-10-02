package com.erp.account.modules.banktransaction.service.impl;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.exception.BankTransactionNotFoundException;
import com.erp.account.common.exception.DuplicateReferenceException;
import com.erp.account.common.exception.DuplicateUtrException;
import com.erp.account.common.exception.InvalidBankTransactionException;
import com.erp.account.common.exception.ReconciliationException;
import com.erp.account.common.validator.BankTransactionValidationUtil;
import com.erp.account.enums.BankTransactionType;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.banktransaction.dto.BankTransactionRequest;
import com.erp.account.modules.banktransaction.dto.request.BankTransactionFilterDto;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerEntryResponse;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.dto.response.BankReconciliationResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionListResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionResponse;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import com.erp.account.modules.banktransaction.mapper.BankTransactionMapper;
import com.erp.account.modules.banktransaction.repository.BankTransactionRepository;
import com.erp.account.modules.banktransaction.service.BankTransactionService;
import com.erp.account.modules.banktransaction.specification.BankTransactionSpecification;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.util.BalanceCalculationHelper;
import com.erp.account.util.BankLedgerHelper;
import com.erp.account.util.TenantUtils;
import com.erp.account.util.TransactionPostingHelper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;


/**
 * Service Implementation for Bank Transaction Management
 * 
 * Implements comprehensive business logic for:
 * - Transaction CRUD with validation
 * - Double-entry GL posting
 * - Bank reconciliation
 * - Ledger generation
 * - Audit compliance
 * 
 * @author ERP System
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BankTransactionServiceImpl implements BankTransactionService {

    private final BankTransactionRepository bankTransactionRepository;
    private final BankTransactionMapper bankTransactionMapper;
    private final BankAccountService bankAccountService;
    private final BankTransactionValidationUtil validationUtil;
    private final TransactionPostingHelper postingHelper;

    // ==================== TRANSACTION CRUD ====================

    @Override
    @Transactional
    public BankTransactionResponse createTransaction(RequestWrapper<BankTransactionRequest> requestWrapper) {
        BankTransactionRequest request = requestWrapper.unwrap();
        log.info("Creating bank transaction with reference: {}", request.getReferenceNo());

        // Validate request
        validateTransaction(request, false);

        // Get bank account and company
        BankAccount bankAccount = validationUtil.validateBankAccountExists(request.getBankAccountId());
        Company company = bankAccount.getCompany();

        // Check for duplicate reference/UTR at company level
        if (request.getReferenceNo() != null && 
            bankTransactionRepository.existsByReferenceNoAndCompanyId(request.getReferenceNo(), company.getId())) {
            throw new DuplicateReferenceException(request.getReferenceNo(), company.getId());
        }

        if (request.getUtrNo() != null && 
            bankTransactionRepository.existsByUtrNoAndCompanyId(request.getUtrNo(), company.getId())) {
            throw new DuplicateUtrException(request.getUtrNo(), company.getId());
        }

        // Create transaction entity
        BankTransaction transaction = bankTransactionMapper.requestToEntity(request);
        transaction.setCompany(company);
        transaction.setBankAccount(bankAccount);
        transaction.setReconciled(false);

        // Save transaction
        BankTransaction savedTransaction = bankTransactionRepository.save(transaction);
        log.info("Bank transaction created with ID: {}", savedTransaction.getId());

        // Generate GL posting
        try {
            generateGlPosting(savedTransaction.getId());
            log.info("GL posting generated for transaction ID: {}", savedTransaction.getId());
        } catch (Exception e) {
            log.error("Failed to generate GL posting for transaction {}", savedTransaction.getId(), e);
            throw new InvalidBankTransactionException("Failed to generate GL posting", e);
        }

        // Build response with running balance
        return buildResponse(getBankTransactionEntity(savedTransaction.getId()), true);
    }

    @Override
    @Transactional
    public BankTransactionResponse updateTransaction(UUID transactionId, RequestWrapper<BankTransactionRequest> requestWrapper) {
        BankTransactionRequest request = requestWrapper.unwrap();
        log.info("Updating bank transaction: {}", transactionId);

        // Get existing transaction
        BankTransaction transaction = getBankTransactionEntity(transactionId);

        // Validate not reconciled
        validateTransactionModifiable(transactionId);

        // Validate request
        validateTransaction(request, true);

        // Update only modifiable fields
        bankTransactionMapper.updateEntityFromRequest(request, transaction);
        
        BankTransaction updated = bankTransactionRepository.save(transaction);
        log.info("Bank transaction updated: {}", transactionId);

        return buildResponse(updated, true);
    }

    @Override
    @Transactional
    public void deleteTransaction(UUID transactionId) {
        log.info("Deleting bank transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        // Validate not reconciled
        validateTransactionModifiable(transactionId);

        // Reverse GL posting
        try {
            reverseGlPosting(transactionId);
        } catch (Exception e) {
            log.warn("Failed to reverse GL posting for transaction {}", transactionId, e);
        }

        // Soft delete
        transaction.setIsDeleted(true);
        bankTransactionRepository.save(transaction);
        log.info("Bank transaction deleted (soft): {}", transactionId);
    }

    @Override
    @Transactional(readOnly = true)
    public BankTransactionResponse getTransactionById(UUID transactionId) {
        log.debug("Fetching bank transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        return buildResponse(transaction, true);
    }

    @Override
    @Transactional(readOnly = true)
    public BankTransactionListResponse getAllTransactions(
            BankTransactionFilterDto filter,
            Pageable pageable) {
        log.debug("Fetching all bank transactions with filters");

        UUID companyId = TenantUtils.getCurrentCompanyId();
        Specification<BankTransaction> spec = BankTransactionSpecification.getFilterSpecification(filter, companyId);

        Page<BankTransaction> page = bankTransactionRepository.findAll(spec, pageable);

        List<BankTransactionResponse> responses = page.getContent().stream()
                .map(transaction -> buildResponse(transaction, false))
                .collect(Collectors.toList());

        return BankTransactionListResponse.builder()
                .transactions(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    // ==================== BANK ACCOUNT QUERIES ====================

    @Override
    @Transactional(readOnly = true)
    public BankTransactionListResponse getTransactionsByBankAccount(UUID bankAccountId, Pageable pageable) {
        log.debug("Fetching transactions for bank account: {}", bankAccountId);

        Page<BankTransaction> page = bankTransactionRepository.findAllByBankAccountIdAndIsDeletedFalse(
                bankAccountId, pageable);

        List<BankTransactionResponse> responses = page.getContent().stream()
                .map(transaction -> buildResponse(transaction, false))
                .collect(Collectors.toList());

        return BankTransactionListResponse.builder()
                .transactions(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BankTransactionListResponse getReconciledTransactions(UUID bankAccountId, Pageable pageable) {
        log.debug("Fetching reconciled transactions for bank account: {}", bankAccountId);

        Page<BankTransaction> page = bankTransactionRepository.findReconciledByBankAccountId(
                bankAccountId, pageable);

        List<BankTransactionResponse> responses = page.getContent().stream()
                .map(transaction -> buildResponse(transaction, false))
                .collect(Collectors.toList());

        return BankTransactionListResponse.builder()
                .transactions(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BankTransactionListResponse getUnreconciledTransactions(UUID bankAccountId, Pageable pageable) {
        log.debug("Fetching unreconciled transactions for bank account: {}", bankAccountId);

        Page<BankTransaction> page = bankTransactionRepository.findUnreconciledByBankAccountId(
                bankAccountId, pageable);

        List<BankTransactionResponse> responses = page.getContent().stream()
                .map(transaction -> buildResponse(transaction, false))
                .collect(Collectors.toList());

        return BankTransactionListResponse.builder()
                .transactions(responses)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isLast(page.isLast())
                .build();
    }

    // ==================== RECONCILIATION ====================

    @Override
    @Transactional
    public BankTransactionResponse reconcileTransaction(UUID transactionId) {
        log.info("Reconciling transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        if (Boolean.TRUE.equals(transaction.getReconciled())) {
            return buildResponse(transaction, true);
        }
        transaction.setReconciled(true);
        transaction.setReconciledDate(LocalDateTime.now());
        BankTransaction updated = bankTransactionRepository.save(transaction);

        return buildResponse(updated, true);
    }

    @Override
    @Transactional
    public BankTransactionResponse unreconcileTransaction(UUID transactionId) {
        log.info("Unreconciling transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        transaction.setReconciled(false);
        transaction.setReconciledDate(null);
        BankTransaction updated = bankTransactionRepository.save(transaction);

        return buildResponse(updated, true);
    }

    @Override
    @Transactional(readOnly = true)
    public BankReconciliationResponse getReconciliationSummary(
            UUID bankAccountId,
            BigDecimal bankStatementBalance,
            Pageable pageable) {
        log.info("Generating reconciliation summary for bank account: {}", bankAccountId);

        validationUtil.validateBankAccountExists(bankAccountId);

        BigDecimal bookBalance = calculateBookBalance(bankAccountId);
        BigDecimal reconciliationDifference = bookBalance.subtract(bankStatementBalance);

        List<BankTransaction> unreconciledTransactions = 
                bankTransactionRepository.findAllByBankAccountIdAndReconciledFalseAndIsDeletedFalse(bankAccountId);

        List<BankLedgerEntryResponse> unmatchedEntries = unreconciledTransactions.stream()
                .map(bt -> BankLedgerEntryResponse.builder()
                        .transactionId(bt.getId())
                        .transactionDate(bt.getTransactionDate())
                        .referenceNo(bt.getReferenceNo())
                        .utrNo(bt.getUtrNo())
                        .narration(bt.getNarration())
                        .debitAmount(bt.getDebitAmount() == null ? BigDecimal.ZERO : bt.getDebitAmount())
                        .creditAmount(bt.getCreditAmount() == null ? BigDecimal.ZERO : bt.getCreditAmount())
                        .reconciled(false)
                        .build())
                .collect(Collectors.toList());

        BigDecimal totalOutstanding = unreconciledTransactions.stream()
                .map(bt -> {
                    BigDecimal debit = bt.getDebitAmount() == null ? BigDecimal.ZERO : bt.getDebitAmount();
                    BigDecimal credit = bt.getCreditAmount() == null ? BigDecimal.ZERO : bt.getCreditAmount();
                    return debit.add(credit);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BankReconciliationResponse.builder()
                .bankAccountId(bankAccountId)
                .bookBalance(bookBalance)
                .bankStatementBalance(bankStatementBalance)
                .reconciliationDifference(reconciliationDifference)
                .isReconciled(reconciliationDifference.compareTo(BigDecimal.ZERO) == 0)
                .matchedTransactionCount(bankTransactionRepository.countReconciledTransactions(bankAccountId))
                .unmatchedTransactionCount(bankTransactionRepository.countUnreconciledTransactions(bankAccountId))
                .totalOutstanding(totalOutstanding)
                .unmatchedTransactions(unmatchedEntries)
                .build();
    }

    // ==================== REVERSAL & GL POSTING ====================

    @Override
    @Transactional
    public BankTransactionResponse reverseTransaction(UUID transactionId, String reversalNarration) {
        log.info("Reversing transaction: {}", transactionId);

        BankTransaction original = getBankTransactionEntity(transactionId);

        // Create reversal transaction with opposite amounts
        BankTransaction reversal = BankTransaction.builder()
                .company(original.getCompany())
                .bankAccount(original.getBankAccount())
                .transactionDate(LocalDate.now())
                .referenceNo(original.getReferenceNo() + "_REVERSAL")
                .utrNo(original.getUtrNo() != null ? original.getUtrNo() + "_REVERSAL" : null)
                .transactionType(BankTransactionType.REVERSAL)
                .debitAmount(original.getCreditAmount())
                .creditAmount(original.getDebitAmount())
                .narration(reversalNarration != null ? reversalNarration : "Reversal of transaction " + transactionId)
                .reconciled(false)
                .build();

        BankTransaction savedReversal = bankTransactionRepository.save(reversal);
        
        // Generate GL posting for reversal
        generateGlPosting(savedReversal.getId());

        log.info("Transaction reversed with new ID: {}", savedReversal.getId());

        return buildResponse(getBankTransactionEntity(savedReversal.getId()), true);
    }

    @Override
    @Transactional
    public UUID generateGlPosting(UUID transactionId) {
        log.info("Generating GL posting for transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        UUID journalId = postingHelper.createGlPosting(transaction);
        transaction.setGlJournalEntryId(journalId);
        transaction.setGlPostingStatus(PostingStatus.POSTED);
        bankTransactionRepository.save(transaction);
        return journalId;
    }

    @Override
    @Transactional
    public void reverseGlPosting(UUID transactionId) {
        log.info("Reversing GL posting for transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        postingHelper.reverseGlPosting(transaction);
        transaction.setGlPostingStatus(PostingStatus.REVERSED);
        bankTransactionRepository.save(transaction);
    }

    // ==================== BALANCE CALCULATIONS ====================

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateRunningBalance(UUID transactionId) {
        log.debug("Calculating running balance for transaction: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        BankAccount bankAccount = transaction.getBankAccount();
        List<BankTransaction> transactions = bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccount.getId()).stream()
                .filter(tx -> !tx.getTransactionDate().isAfter(transaction.getTransactionDate()))
                .collect(Collectors.toList());

        return BalanceCalculationHelper.calculateCurrentBalance(bankAccount, transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateBookBalance(UUID bankAccountId) {
        log.debug("Calculating book balance for bank account: {}", bankAccountId);

        BankAccount bankAccount = validationUtil.validateBankAccountExists(bankAccountId);
        BigDecimal openingBalance = BalanceCalculationHelper.calculateOpeningBalance(bankAccount);
        BigDecimal totalDebits = bankTransactionRepository.sumDebitByBankAccountId(bankAccountId);
        BigDecimal totalCredits = bankTransactionRepository.sumCreditByBankAccountId(bankAccountId);

        return openingBalance.add(totalCredits).subtract(totalDebits)
                .setScale(4, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateReconciledBalance(UUID bankAccountId) {
        log.debug("Calculating reconciled balance for bank account: {}", bankAccountId);

        BankAccount bankAccount = validationUtil.validateBankAccountExists(bankAccountId);
        BigDecimal openingBalance = BalanceCalculationHelper.calculateOpeningBalance(bankAccount);
        BigDecimal totalDebits = bankTransactionRepository.sumReconciledDebitAmount(bankAccountId);
        BigDecimal totalCredits = bankTransactionRepository.sumReconciledCreditAmount(bankAccountId);

        return openingBalance.add(totalCredits).subtract(totalDebits)
                .setScale(4, RoundingMode.HALF_UP);
    }

    // ==================== LEDGER REPORTS ====================

    @Override
    @Transactional(readOnly = true)
    public BankLedgerResponse getBankLedger(UUID bankAccountId, Pageable pageable) {
        log.info("Generating bank ledger for account: {}", bankAccountId);

        BankAccount bankAccount = validationUtil.validateBankAccountExists(bankAccountId);
        List<BankTransaction> transactions = bankTransactionRepository.findAllByBankAccountIdOrderByTransactionDate(bankAccountId);

        return buildBankLedgerResponse(bankAccount, transactions);
    }

    @Override
    @Transactional(readOnly = true)
    public BankLedgerResponse getBankLedgerForDateRange(
            UUID bankAccountId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {
        log.info("Generating bank ledger for account {} from {} to {}", bankAccountId, startDate, endDate);

        BankAccount bankAccount = validationUtil.validateBankAccountExists(bankAccountId);
        Page<BankTransaction> transactionsPage = bankTransactionRepository.findByDateRange(
                bankAccountId, startDate, endDate, pageable);

        return buildBankLedgerResponse(bankAccount, transactionsPage.getContent());
    }

    // ==================== VALIDATION ====================

    @Override
    public void validateTransaction(BankTransactionRequest request, boolean isUpdate) {
        log.debug("Validating transaction request");

        validationUtil.validateTransactionRequest(request, isUpdate);
    }

    @Override
    public void validateTransactionModifiable(UUID transactionId) {
        log.debug("Validating transaction is modifiable: {}", transactionId);

        BankTransaction transaction = getBankTransactionEntity(transactionId);

        if (Boolean.TRUE.equals(transaction.getReconciled())) {
            throw new ReconciliationException(transactionId, "Reconciled transactions cannot be modified");
        }
    }

    @Override
    public void validateCompanyAccess(UUID transactionId, UUID companyId) {
        BankTransaction transaction = getBankTransactionEntity(transactionId);

        if (!transaction.getCompany().getId().equals(companyId)) {
            throw new InvalidBankTransactionException(
                    "companyId",
                    companyId.toString(),
                    "Cross-company transaction access not allowed"
            );
        }
    }

    private BankTransaction getBankTransactionEntity(UUID transactionId) {
        BankTransaction transaction = bankTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new BankTransactionNotFoundException(transactionId.toString()));
        if (!TenantUtils.isSystemAdmin()) {
            UUID companyId = TenantUtils.getCurrentCompanyId();
            if (!transaction.getCompany().getId().equals(companyId)) {
                throw new BankTransactionNotFoundException("Bank transaction not found");
            }
        }
        return transaction;
    }

    // ==================== PRIVATE HELPER METHODS ====================

    private BankLedgerResponse buildBankLedgerResponse(BankAccount bankAccount, List<BankTransaction> transactions) {
        BigDecimal openingBalance = bankAccount.getOpeningBalance();
        List<BankLedgerEntryResponse> ledgerEntries = BankLedgerHelper.buildTransactionLedgerEntries(transactions, openingBalance);

        BigDecimal totalDebits = bankTransactionRepository.sumDebitByBankAccountId(bankAccount.getId());
        BigDecimal totalCredits = bankTransactionRepository.sumCreditByBankAccountId(bankAccount.getId());
        BigDecimal closingBalance = openingBalance.add(totalCredits).subtract(totalDebits)
                .setScale(4, RoundingMode.HALF_UP);

        Long reconciledCount = bankTransactionRepository.countReconciledTransactions(bankAccount.getId());
        Long unreconciledCount = bankTransactionRepository.countUnreconciledTransactions(bankAccount.getId());

        return BankLedgerResponse.builder()
                .bankAccountId(bankAccount.getId())
                .bankName(bankAccount.getBankName())
                .accountNumber(bankAccount.getAccountNumber())
                .ifscCode(bankAccount.getIfscCode())
                .openingBalance(openingBalance)
                .totalDebits(totalDebits)
                .totalCredits(totalCredits)
                .closingBalance(closingBalance)
                .totalTransactions((long) transactions.size())
                .reconciledTransactions(reconciledCount)
                .unreconciledTransactions(unreconciledCount)
                .ledgerEntries(ledgerEntries)
                .build();
    }

    private BankTransactionResponse buildResponse(BankTransaction transaction, boolean includeRunningBalance) {
        BankTransactionResponse response = bankTransactionMapper.entityToResponse(transaction);
        response.setTransactionAmount(calculateTransactionAmount(transaction));
        response.setReconciledDate(transaction.getReconciledDate());
        response.setGlJournalEntryId(transaction.getGlJournalEntryId());
        response.setGlStatus(transaction.getGlPostingStatus() != null ? transaction.getGlPostingStatus().name() : null);
        if (includeRunningBalance) {
            response.setRunningBalance(calculateRunningBalance(transaction.getId()));
        }
        return response;
    }

    private BigDecimal calculateTransactionAmount(BankTransaction transaction) {
        BigDecimal debit = transaction.getDebitAmount() == null ? BigDecimal.ZERO : transaction.getDebitAmount();
        BigDecimal credit = transaction.getCreditAmount() == null ? BigDecimal.ZERO : transaction.getCreditAmount();
        return debit.add(credit);
    }
}
