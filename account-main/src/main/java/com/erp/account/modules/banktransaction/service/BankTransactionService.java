package com.erp.account.modules.banktransaction.service;

import com.erp.account.modules.banktransaction.dto.BankTransactionRequest;
import com.erp.account.modules.banktransaction.dto.request.BankTransactionFilterDto;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import com.erp.account.modules.banktransaction.dto.response.BankReconciliationResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionListResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionResponse;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.enums.BankTransactionType;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service Interface for Bank Transaction Management
 * 
 * Defines business operations for managing bank transactions including:
 * - Transaction CRUD operations
 * - Validation and reconciliation
 * - GL posting
 * - Bank ledger generation
 * - Reconciliation reporting
 * 
 * @author ERP System
 * @version 1.0
 */
public interface BankTransactionService {

    // ==================== TRANSACTION CRUD ====================

    /**
     * Create a new bank transaction
     * 
     * Performs comprehensive validation, GL posting, and audit logging.
     * 
     * @param request the transaction request DTO
     * @return the created transaction response
     */
    BankTransactionResponse createTransaction(RequestWrapper<BankTransactionRequest> request);

    /**
     * Update an existing bank transaction
     * 
     * Validates that transaction is not reconciled.
     * Reverses existing GL posting and creates new one.
     * 
     * @param transactionId the transaction ID
     * @param request the updated request DTO
     * @return the updated transaction response
     */
    BankTransactionResponse updateTransaction(UUID transactionId, RequestWrapper<BankTransactionRequest> request);

    /**
     * Delete (soft-delete) a bank transaction
     * 
     * Marks transaction as deleted instead of physical removal.
     * Reverses associated GL posting.
     * 
     * @param transactionId the transaction ID
     */
    void deleteTransaction(UUID transactionId);

    /**
     * Get transaction by ID
     * 
     * @param transactionId the transaction ID
     * @return the transaction response
     */
    BankTransactionResponse getTransactionById(UUID transactionId);

    /**
     * Get all transactions with advanced filtering and pagination
     * 
     * @param bankAccountId optional bank account ID filter
     * @param transactionType optional transaction type filter
     * @param referenceNo optional reference number filter
     * @param utrNo optional UTR number filter
     * @param reconciled optional reconciliation status filter
     * @param startDate optional start date filter
     * @param endDate optional end date filter
     * @param pageable pagination info
     * @return paginated transaction list
     */
    BankTransactionListResponse getAllTransactions(
            BankTransactionFilterDto filter,
            Pageable pageable);

    // ==================== BANK ACCOUNT QUERIES ====================

    /**
     * Get transactions by bank account
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated transaction list
     */
    BankTransactionListResponse getTransactionsByBankAccount(UUID bankAccountId, Pageable pageable);

    /**
     * Get reconciled transactions for a bank account
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated reconciled transaction list
     */
    BankTransactionListResponse getReconciledTransactions(UUID bankAccountId, Pageable pageable);

    /**
     * Get unreconciled transactions for a bank account
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return paginated unreconciled transaction list
     */
    BankTransactionListResponse getUnreconciledTransactions(UUID bankAccountId, Pageable pageable);

    // ==================== RECONCILIATION ====================

    /**
     * Reconcile a bank transaction
     * 
     * Marks transaction as reconciled and prevents further modifications.
     * 
     * @param transactionId the transaction ID
     * @return the reconciled transaction response
     */
    BankTransactionResponse reconcileTransaction(UUID transactionId);

    /**
     * Unreconcile a bank transaction
     * 
     * Reverses reconciliation status, allowing modifications.
     * 
     * @param transactionId the transaction ID
     * @return the unreconciled transaction response
     */
    BankTransactionResponse unreconcileTransaction(UUID transactionId);

    /**
     * Get reconciliation summary for a bank account
     * 
     * Compares book balance vs bank statement balance.
     * 
     * @param bankAccountId the bank account ID
     * @param bankStatementBalance the bank statement closing balance
     * @param pageable pagination for unmatched transactions
     * @return reconciliation summary response
     */
    BankReconciliationResponse getReconciliationSummary(
            UUID bankAccountId,
            BigDecimal bankStatementBalance,
            Pageable pageable);

    // ==================== REVERSAL & GL POSTING ====================

    /**
     * Reverse a bank transaction
     * 
     * Creates a reversal transaction with opposite amounts.
     * Marks original transaction as reversed.
     * 
     * @param transactionId the transaction ID
     * @param reversalNarration the reversal narration
     * @return the reversal transaction response
     */
    BankTransactionResponse reverseTransaction(UUID transactionId, String reversalNarration);

    /**
     * Generate GL posting for a transaction
     * 
     * Creates double-entry journal posting.
     * For credit transactions: DR Bank, CR Counter Account
     * For debit transactions: DR Counter Account, CR Bank
     * 
     * @param transactionId the transaction ID
     * @return GL journal entry ID
     */
    UUID generateGlPosting(UUID transactionId);

    /**
     * Reverse GL posting for a transaction
     * 
     * @param transactionId the transaction ID
     */
    void reverseGlPosting(UUID transactionId);

    // ==================== BALANCE CALCULATIONS ====================

    /**
     * Calculate running balance for a transaction
     * 
     * Computes cumulative balance up to transaction date.
     * 
     * @param transactionId the transaction ID
     * @return the running balance
     */
    BigDecimal calculateRunningBalance(UUID transactionId);

    /**
     * Calculate book balance for a bank account
     * 
     * Book Balance = Opening Balance + Credits - Debits
     * 
     * @param bankAccountId the bank account ID
     * @return the book balance
     */
    BigDecimal calculateBookBalance(UUID bankAccountId);

    /**
     * Calculate reconciled balance for a bank account
     * 
     * @param bankAccountId the bank account ID
     * @return the reconciled balance
     */
    BigDecimal calculateReconciledBalance(UUID bankAccountId);

    // ==================== LEDGER REPORTS ====================

    /**
     * Generate bank ledger for a bank account
     * 
     * @param bankAccountId the bank account ID
     * @param pageable pagination info
     * @return bank ledger response with all entries and balances
     */
    BankLedgerResponse getBankLedger(UUID bankAccountId, Pageable pageable);

    /**
     * Generate bank ledger for date range
     * 
     * @param bankAccountId the bank account ID
     * @param startDate start date
     * @param endDate end date
     * @param pageable pagination info
     * @return bank ledger response for date range
     */
    BankLedgerResponse getBankLedgerForDateRange(
            UUID bankAccountId,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable);

    // ==================== VALIDATION ====================

    /**
     * Validate a transaction request
     * 
     * Checks all business rules before creation/update.
     * 
     * @param request the transaction request
     * @param isUpdate true if validating for update
     */
    void validateTransaction(BankTransactionRequest request, boolean isUpdate);

    /**
     * Check if transaction can be modified
     * 
     * Reconciled transactions cannot be modified.
     * 
     * @param transactionId the transaction ID
     */
    void validateTransactionModifiable(UUID transactionId);

    /**
     * Check company isolation
     * 
     * Ensures user company matches transaction company.
     * 
     * @param transactionId the transaction ID
     * @param companyId the company ID
     */
    void validateCompanyAccess(UUID transactionId, UUID companyId);
}
