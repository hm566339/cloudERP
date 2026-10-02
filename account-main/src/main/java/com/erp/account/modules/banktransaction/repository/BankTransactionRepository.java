package com.erp.account.modules.banktransaction.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for BankTransaction Entity
 * 
 * Provides data access with custom queries, specifications, and pagination support.
 * 
 * @author ERP System
 * @version 1.0
 */
@Repository
public interface BankTransactionRepository extends JpaRepository<BankTransaction, UUID>, JpaSpecificationExecutor<BankTransaction> {

    // ==================== BASIC QUERIES ====================

    Page<BankTransaction> findAllByBankAccountIdAndIsDeletedFalse(UUID bankAccountId, Pageable pageable);

    Page<BankTransaction> findAllByCompanyIdAndBankAccountIdAndIsDeletedFalse(UUID companyId, UUID bankAccountId, Pageable pageable);

    List<BankTransaction> findAllByBankAccountIdAndReconciledFalseAndIsDeletedFalse(UUID bankAccountId);

    boolean existsByBankAccountIdAndIsDeletedFalse(UUID bankAccountId);

    // ==================== REFERENCE & UTR & GL QUERIES ====================

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.referenceNo = :referenceNo " +
           "AND bt.company.id = :companyId AND bt.isDeleted = false")
    Optional<BankTransaction> findByReferenceNoAndCompanyId(
            @Param("referenceNo") String referenceNo,
            @Param("companyId") UUID companyId);

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.glJournalEntryId = :glJournalEntryId AND bt.isDeleted = false")
    Optional<BankTransaction> findByGlJournalEntryIdAndIsDeletedFalse(@Param("glJournalEntryId") UUID glJournalEntryId);

    @Query("SELECT CASE WHEN COUNT(bt) > 0 THEN true ELSE false END FROM BankTransaction bt " +
           "WHERE bt.glJournalEntryId = :glJournalEntryId AND bt.isDeleted = false")
    Boolean existsByGlJournalEntryIdAndIsDeletedFalse(@Param("glJournalEntryId") UUID glJournalEntryId);

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.utrNo = :utrNo " +
           "AND bt.company.id = :companyId AND bt.isDeleted = false")
    Optional<BankTransaction> findByUtrNoAndCompanyId(
            @Param("utrNo") String utrNo,
            @Param("companyId") UUID companyId);

    @Query("SELECT CASE WHEN COUNT(bt) > 0 THEN true ELSE false END FROM BankTransaction bt " +
           "WHERE bt.referenceNo = :referenceNo AND bt.company.id = :companyId " +
           "AND bt.isDeleted = false")
    Boolean existsByReferenceNoAndCompanyId(
            @Param("referenceNo") String referenceNo,
            @Param("companyId") UUID companyId);

    @Query("SELECT CASE WHEN COUNT(bt) > 0 THEN true ELSE false END FROM BankTransaction bt " +
           "WHERE bt.utrNo = :utrNo AND bt.company.id = :companyId " +
           "AND bt.isDeleted = false")
    Boolean existsByUtrNoAndCompanyId(
            @Param("utrNo") String utrNo,
            @Param("companyId") UUID companyId);

    // ==================== TRANSACTION TYPE QUERIES ====================

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.transactionType = :transactionType " +
           "AND bt.company.id = :companyId AND bt.isDeleted = false " +
           "ORDER BY bt.transactionDate DESC")
    Page<BankTransaction> findByTransactionTypeAndCompanyId(
            @Param("transactionType") BankTransactionType transactionType,
            @Param("companyId") UUID companyId,
            Pageable pageable);

    // ==================== RECONCILIATION QUERIES ====================

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
           "AND bt.reconciled = true AND bt.isDeleted = false " +
           "ORDER BY bt.transactionDate DESC")
    Page<BankTransaction> findReconciledByBankAccountId(
            @Param("bankAccountId") UUID bankAccountId,
            Pageable pageable);

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
           "AND bt.reconciled = false AND bt.isDeleted = false " +
           "ORDER BY bt.transactionDate DESC")
    Page<BankTransaction> findUnreconciledByBankAccountId(
            @Param("bankAccountId") UUID bankAccountId,
            Pageable pageable);

    @Query("SELECT COUNT(bt) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = false " +
           "AND bt.isDeleted = false")
    Long countUnreconciledTransactions(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT COUNT(bt) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = true " +
           "AND bt.isDeleted = false")
    Long countReconciledTransactions(@Param("bankAccountId") UUID bankAccountId);

    // ==================== DATE RANGE QUERIES ====================

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
           "AND bt.transactionDate BETWEEN :startDate AND :endDate " +
           "AND bt.isDeleted = false ORDER BY bt.transactionDate DESC")
    Page<BankTransaction> findByDateRange(
            @Param("bankAccountId") UUID bankAccountId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.company.id = :companyId " +
           "AND bt.transactionDate BETWEEN :startDate AND :endDate " +
           "AND bt.isDeleted = false ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findByCompanyIdAndDateRange(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    // ==================== AMOUNT AGGREGATION QUERIES ====================

    @Query("SELECT COALESCE(SUM(bt.debitAmount), 0) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false")
    BigDecimal sumDebitByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT COALESCE(SUM(bt.creditAmount), 0) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false")
    BigDecimal sumCreditByBankAccountId(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT bt.bankAccount.id, COALESCE(SUM(bt.debitAmount), 0), COALESCE(SUM(bt.creditAmount), 0), COUNT(bt) " +
           "FROM BankTransaction bt WHERE bt.bankAccount.id IN :bankAccountIds AND bt.isDeleted = false GROUP BY bt.bankAccount.id")
    List<Object[]> summarizeByBankAccountIds(@Param("bankAccountIds") List<UUID> bankAccountIds);

    @Query("SELECT bt.bankAccount.id, COALESCE(SUM(bt.debitAmount), 0), COALESCE(SUM(bt.creditAmount), 0) " +
           "FROM BankTransaction bt WHERE bt.bankAccount.id IN :bankAccountIds AND bt.reconciled = true AND bt.isDeleted = false GROUP BY bt.bankAccount.id")
    List<Object[]> summarizeReconciledByBankAccountIds(@Param("bankAccountIds") List<UUID> bankAccountIds);

    @Query("SELECT COALESCE(SUM(bt.debitAmount), 0) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = true " +
           "AND bt.isDeleted = false")
    BigDecimal sumReconciledDebitAmount(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT COALESCE(SUM(bt.creditAmount), 0) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = true " +
           "AND bt.isDeleted = false")
    BigDecimal sumReconciledCreditAmount(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT COALESCE(SUM(bt.debitAmount), 0) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = false " +
           "AND bt.isDeleted = false")
    BigDecimal sumUnreconciledDebitAmount(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT COALESCE(SUM(bt.creditAmount), 0) FROM BankTransaction bt " +
           "WHERE bt.bankAccount.id = :bankAccountId AND bt.reconciled = false " +
           "AND bt.isDeleted = false")
    BigDecimal sumUnreconciledCreditAmount(@Param("bankAccountId") UUID bankAccountId);

    // ==================== LEDGER QUERIES ====================
    long countByBankAccountIdAndIsDeletedFalse(UUID bankAccountId);
    long countByBankAccountIdAndReconciledTrueAndIsDeletedFalse(UUID bankAccountId);
    long countByBankAccountIdAndReconciledFalseAndIsDeletedFalse(UUID bankAccountId);
    @Query("SELECT COALESCE(SUM(bt.debitAmount), 0) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false AND bt.transactionDate < :cutoffDate")
    BigDecimal sumDebitBeforeDate(@Param("bankAccountId") UUID bankAccountId, @Param("cutoffDate") java.time.LocalDate cutoffDate);

    @Query("SELECT COALESCE(SUM(bt.creditAmount), 0) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false AND bt.transactionDate < :cutoffDate")
    BigDecimal sumCreditBeforeDate(@Param("bankAccountId") UUID bankAccountId, @Param("cutoffDate") java.time.LocalDate cutoffDate);
    
    @Query("SELECT MIN(bt.transactionDate) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false")
    java.time.LocalDate getMinTransactionDate(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT MAX(bt.transactionDate) FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId AND bt.isDeleted = false")
    java.time.LocalDate getMaxTransactionDate(@Param("bankAccountId") UUID bankAccountId);

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.bankAccount.id = :bankAccountId " +
           "AND bt.isDeleted = false ORDER BY bt.transactionDate ASC")
    List<BankTransaction> findAllByBankAccountIdOrderByTransactionDate(
            @Param("bankAccountId") UUID bankAccountId);

    // ==================== UNRECONCILED QUERIES ====================

    @Query("SELECT bt FROM BankTransaction bt WHERE bt.company.id = :companyId " +
           "AND bt.reconciled = false AND bt.isDeleted = false " +
           "ORDER BY bt.transactionDate DESC")
    List<BankTransaction> findAllUnreconciledByCompanyId(@Param("companyId") UUID companyId);
}
