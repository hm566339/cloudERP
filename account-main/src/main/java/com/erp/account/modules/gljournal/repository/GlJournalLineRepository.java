package com.erp.account.modules.gljournal.repository;

import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * GL Journal Line Repository
 *
 * Provides CRUD and custom query methods for journal line items.
 * Supports account ledger queries, balance calculations, and drill-down
 * reporting.
 *
 * @author ERP Team
 * @version 1.0
 */
@Repository
public interface GlJournalLineRepository
              extends JpaRepository<GlJournalLine, UUID>, JpaSpecificationExecutor<GlJournalLine> {

       /** Find all lines for journal entry */
       List<GlJournalLine> findAllByJournalEntryIdAndIsDeletedFalse(UUID journalEntryId);

       /** Find all lines by account */
       List<GlJournalLine> findAllByAccountIdAndIsDeletedFalse(UUID accountId);

       @Query("SELECT l FROM GlJournalLine l WHERE l.journalEntry.id = :journalEntryId " +
                     "AND l.debitAmount > 0 AND l.isDeleted = false")
       List<GlJournalLine> findDebitLines(@Param("journalEntryId") UUID journalEntryId);

       @Query("SELECT l FROM GlJournalLine l WHERE l.journalEntry.id = :journalEntryId " +
                     "AND l.creditAmount > 0 AND l.isDeleted = false")
       List<GlJournalLine> findCreditLines(@Param("journalEntryId") UUID journalEntryId);

       @Query("SELECT l FROM GlJournalLine l WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.isDeleted = false ORDER BY l.journalEntry.voucherDate ASC")
       Page<GlJournalLine> getAccountLedger(@Param("companyId") UUID companyId, @Param("accountId") UUID accountId, Pageable pageable);

       @Query("SELECT l FROM GlJournalLine l WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.journalEntry.voucherDate BETWEEN :startDate AND :endDate " +
                     "AND l.isDeleted = false ORDER BY l.journalEntry.voucherDate ASC")
       Page<GlJournalLine> getAccountLedgerByDateRange(@Param("companyId") UUID companyId,
                     @Param("accountId") UUID accountId,
                     @Param("startDate") LocalDate startDate,
                     @Param("endDate") LocalDate endDate,
                     Pageable pageable);

              @Query("SELECT COALESCE(SUM(l.debitAmount), 0) FROM GlJournalLine l " +
                          "WHERE l.company.id = :companyId AND l.account.id = :accountId AND l.journalEntry.status = 'POSTED' " +
                          "AND l.isDeleted = false")
              BigDecimal getTotalDebitForAccount(@Param("companyId") UUID companyId, @Param("accountId") UUID accountId);

              @Query("SELECT COALESCE(SUM(l.creditAmount), 0) FROM GlJournalLine l " +
                          "WHERE l.company.id = :companyId AND l.account.id = :accountId AND l.journalEntry.status = 'POSTED' " +
                          "AND l.isDeleted = false")
              BigDecimal getTotalCreditForAccount(@Param("companyId") UUID companyId, @Param("accountId") UUID accountId);

              @Query("SELECT COALESCE(SUM(l.debitAmount), 0) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.journalEntry.voucherDate BETWEEN :startDate AND :endDate " +
                     "AND l.isDeleted = false")
              BigDecimal getTotalDebitForAccountByDateRange(@Param("companyId") UUID companyId,
                                                      @Param("accountId") UUID accountId,
                                                      @Param("startDate") LocalDate startDate,
                                                      @Param("endDate") LocalDate endDate);

              @Query("SELECT COALESCE(SUM(l.creditAmount), 0) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.journalEntry.voucherDate BETWEEN :startDate AND :endDate " +
                     "AND l.isDeleted = false")
              BigDecimal getTotalCreditForAccountByDateRange(@Param("companyId") UUID companyId,
                                                       @Param("accountId") UUID accountId,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);

              @Query("SELECT COALESCE(SUM(l.debitAmount), 0) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.journalEntry.voucherDate < :startDate " +
                     "AND l.isDeleted = false")
              BigDecimal getTotalDebitForAccountBeforeDate(@Param("companyId") UUID companyId,
                                                          @Param("accountId") UUID accountId,
                                                          @Param("startDate") LocalDate startDate);

              @Query("SELECT COALESCE(SUM(l.creditAmount), 0) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.journalEntry.voucherDate < :startDate " +
                     "AND l.isDeleted = false")
              BigDecimal getTotalCreditForAccountBeforeDate(@Param("companyId") UUID companyId,
                                                           @Param("accountId") UUID accountId,
                                                           @Param("startDate") LocalDate startDate);

              @Query("SELECT COALESCE(SUM(l.debitAmount), 0) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId " +
                     "AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.isDeleted = false")
              BigDecimal getTotalPostedDebitForAccount(@Param("companyId") UUID companyId,
                                                       @Param("accountId") UUID accountId);

                    @Query(value = "SELECT COALESCE(SUM(l.debit_amount), 0) FROM gl_journal_line l JOIN gl_journal_entry e ON l.journal_entry_id = e.id "
                           + "WHERE l.company_id = :companyId AND l.account_id = :accountId "
                           + "AND l.department_id = :departmentId "
                           + "AND e.status = 'POSTED' AND l.is_deleted = false", nativeQuery = true)
                    BigDecimal getTotalPostedDebitForAccountAndDepartment(@Param("companyId") UUID companyId,
                                                                   @Param("accountId") UUID accountId,
                                                                   @Param("departmentId") UUID departmentId);

                    @Query(value = "SELECT COALESCE(SUM(l.debit_amount), 0) FROM gl_journal_line l JOIN gl_journal_entry e ON l.journal_entry_id = e.id "
                           + "WHERE l.company_id = :companyId AND l.account_id = :accountId "
                           + "AND l.department_id = :departmentId AND l.cost_center_id = :costCenterId "
                           + "AND e.status = 'POSTED' AND l.is_deleted = false", nativeQuery = true)
                    BigDecimal getTotalPostedDebitForAccountDepartmentCostCenter(@Param("companyId") UUID companyId,
                                                                          @Param("accountId") UUID accountId,
                                                                          @Param("departmentId") UUID departmentId,
                                                                          @Param("costCenterId") UUID costCenterId);

              Optional<GlJournalLine> findByIdAndIsDeletedFalse(UUID id);

              Optional<GlJournalLine> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

              @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
                  "company",
                  "journalEntry",
                  "journalEntry.fiscalYear",
                  "journalEntry.accountingPeriod",
                  "account",
                  "account.group",
                  "account.group.category"
              })
              @Query("SELECT l FROM GlJournalLine l WHERE l.id = :id AND l.company.id = :companyId AND l.isDeleted = false")
              Optional<GlJournalLine> findProfileByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") UUID companyId);

              Page<GlJournalLine> findByJournalEntryIdAndIsDeletedFalse(UUID journalEntryId, Pageable pageable);

              Page<GlJournalLine> findByAccountIdAndIsDeletedFalse(UUID accountId, Pageable pageable);

              Page<GlJournalLine> findByAccountIdAndCompanyIdAndIsDeletedFalse(UUID accountId, UUID companyId, Pageable pageable);

              List<GlJournalLine> findByJournalEntryAndIsDeletedFalse(GlJournalEntry journalEntry);

              @Query("SELECT l FROM GlJournalLine l WHERE l.company.id = :companyId " +
                     "AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.isDeleted = false " +
                     "AND (:fiscalYearId IS NULL OR l.journalEntry.fiscalYear.id = :fiscalYearId) " +
                     "AND (:accountingPeriodId IS NULL OR l.journalEntry.accountingPeriod.id = :accountingPeriodId)")
              List<GlJournalLine> findPostedLinesForAccountContext(@Param("companyId") UUID companyId,
                                                                   @Param("accountId") UUID accountId,
                                                                   @Param("fiscalYearId") UUID fiscalYearId,
                                                                   @Param("accountingPeriodId") UUID accountingPeriodId);

              /**
               * Convenience: find all lines for a given journal entry (non-deleted)
               * Service layer historically calls findByJournalEntry(...) so keep this signature.
               */
              List<GlJournalLine> findByJournalEntry(GlJournalEntry journalEntry);

                       /**
                        * Native aggregation for trial balance: opening and period totals per account.
                        */
                        interface TrialBalanceProjection {
                               String getAccountId();
                               String getAccountCode();
                               String getAccountName();
                               String getAccountType();
                               String getCategoryCode();
                               java.math.BigDecimal getOpeningBalance();
                               java.math.BigDecimal getOpeningDebit();
                               java.math.BigDecimal getOpeningCredit();
                               java.math.BigDecimal getPeriodDebit();
                               java.math.BigDecimal getPeriodCredit();
                        }

                            @Query(value = "SELECT CAST(a.id AS varchar) as accountId, a.account_code as accountCode, a.account_name as accountName, "
                                   + "a.account_type as accountType, ac.code as categoryCode, COALESCE(a.opening_balance, 0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount ELSE 0 END),0) as openingDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.credit_amount ELSE 0 END),0) as openingCredit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount ELSE 0 END),0) as periodDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.credit_amount ELSE 0 END),0) as periodCredit "
                                   + "FROM chart_of_account a "
                                   + "JOIN account_group ag ON a.group_id = ag.id "
                                   + "JOIN account_category ac ON ag.category_id = ac.id "
                                   + "LEFT JOIN gl_journal_line l ON l.account_id = a.id AND l.company_id = :companyId AND l.is_deleted = false "
                                   + "LEFT JOIN gl_journal_entry e ON l.journal_entry_id = e.id AND e.status = 'POSTED' "
                                   + "WHERE a.company_id = :companyId AND COALESCE(a.is_deleted, false) = false "
                                   + "GROUP BY a.id, a.account_code, a.account_name, a.account_type, ac.code, a.opening_balance "
                                   + "ORDER BY a.account_code",
                                   nativeQuery = true)
                            List<TrialBalanceProjection> aggregateTrialBalance(@Param("companyId") UUID companyId,
                                                                        @Param("startDate") java.time.LocalDate startDate,
                                                                        @Param("endDate") java.time.LocalDate endDate);

                            @Query(value = "SELECT CAST(a.id AS varchar) as accountId, a.account_code as accountCode, a.account_name as accountName, "
                                   + "a.account_type as accountType, ac.code as categoryCode, COALESCE(a.opening_balance, 0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount ELSE 0 END),0) as openingDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.credit_amount ELSE 0 END),0) as openingCredit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount ELSE 0 END),0) as periodDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.credit_amount ELSE 0 END),0) as periodCredit "
                                   + "FROM chart_of_account a "
                                   + "JOIN account_group ag ON a.group_id = ag.id "
                                   + "JOIN account_category ac ON ag.category_id = ac.id "
                                   + "LEFT JOIN gl_journal_line l ON l.account_id = a.id AND l.is_deleted = false "
                                   + "LEFT JOIN gl_journal_entry e ON l.journal_entry_id = e.id AND e.status = 'POSTED' "
                                   + "WHERE COALESCE(a.is_deleted, false) = false "
                                   + "GROUP BY a.id, a.account_code, a.account_name, a.account_type, ac.code, a.opening_balance "
                                   + "ORDER BY a.account_code",
                                   nativeQuery = true)
                            List<TrialBalanceProjection> aggregateTrialBalanceAllCompanies(@Param("startDate") java.time.LocalDate startDate,
                                                                                       @Param("endDate") java.time.LocalDate endDate);

                            @Query(value = "SELECT CAST(a.id AS varchar) as accountId, a.account_code as accountCode, a.account_name as accountName, "
                                   + "a.account_type as accountType, ac.code as categoryCode, COALESCE(a.opening_balance, 0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount ELSE 0 END),0) as openingDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.credit_amount ELSE 0 END),0) as openingCredit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount ELSE 0 END),0) as periodDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.credit_amount ELSE 0 END),0) as periodCredit "
                                   + "FROM chart_of_account a "
                                   + "JOIN account_group ag ON a.group_id = ag.id "
                                   + "JOIN account_category ac ON ag.category_id = ac.id "
                                   + "LEFT JOIN gl_journal_line l ON l.account_id = a.id AND l.company_id = :companyId AND l.is_deleted = false "
                                   + "LEFT JOIN gl_journal_entry e ON l.journal_entry_id = e.id AND e.status = 'POSTED' "
                                   + "WHERE a.company_id = :companyId AND COALESCE(a.is_deleted, false) = false "
                                   + "GROUP BY a.id, a.account_code, a.account_name, a.account_type, ac.code, a.opening_balance "
                                   + "ORDER BY a.account_code",
                                   countQuery = "SELECT COUNT(*) FROM chart_of_account a WHERE a.company_id = :companyId AND COALESCE(a.is_deleted, false) = false",
                                   nativeQuery = true)
                            org.springframework.data.domain.Page<TrialBalanceProjection> aggregateTrialBalancePaged(@Param("companyId") UUID companyId,
                                                                                                         @Param("startDate") java.time.LocalDate startDate,
                                                                                                         @Param("endDate") java.time.LocalDate endDate,
                                                                                                         org.springframework.data.domain.Pageable pageable);

                            @Query(value = "SELECT CAST(a.id AS varchar) as accountId, a.account_code as accountCode, a.account_name as accountName, "
                                   + "a.account_type as accountType, ac.code as categoryCode, COALESCE(a.opening_balance, 0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount ELSE 0 END),0) as openingDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.credit_amount ELSE 0 END),0) as openingCredit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount ELSE 0 END),0) as periodDebit, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.credit_amount ELSE 0 END),0) as periodCredit "
                                   + "FROM chart_of_account a "
                                   + "JOIN account_group ag ON a.group_id = ag.id "
                                   + "JOIN account_category ac ON ag.category_id = ac.id "
                                   + "LEFT JOIN gl_journal_line l ON l.account_id = a.id AND l.is_deleted = false "
                                   + "LEFT JOIN gl_journal_entry e ON l.journal_entry_id = e.id AND e.status = 'POSTED' "
                                   + "WHERE COALESCE(a.is_deleted, false) = false "
                                   + "GROUP BY a.id, a.account_code, a.account_name, a.account_type, ac.code, a.opening_balance "
                                   + "ORDER BY a.account_code",
                                   countQuery = "SELECT COUNT(*) FROM chart_of_account a WHERE COALESCE(a.is_deleted, false) = false",
                                   nativeQuery = true)
                            org.springframework.data.domain.Page<TrialBalanceProjection> aggregateTrialBalancePagedAllCompanies(@Param("startDate") java.time.LocalDate startDate,
                                                                                                                        @Param("endDate") java.time.LocalDate endDate,
                                                                                                                        org.springframework.data.domain.Pageable pageable);

                            @Query(value = "SELECT COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount - l.credit_amount ELSE 0 END),0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount - l.credit_amount ELSE 0 END),0) as periodBalance "
                                   + "FROM gl_journal_line l JOIN gl_journal_entry e ON l.journal_entry_id = e.id "
                                   + "WHERE l.company_id = :companyId AND e.status = 'POSTED' AND l.is_deleted = false",
                                   nativeQuery = true)
                            java.util.Map<String, Object> aggregateCompanyTotals(@Param("companyId") UUID companyId,
                                                                          @Param("startDate") java.time.LocalDate startDate,
                                                                          @Param("endDate") java.time.LocalDate endDate);

                            @Query(value = "SELECT COALESCE(SUM(CASE WHEN e.voucher_date < :startDate THEN l.debit_amount - l.credit_amount ELSE 0 END),0) as openingBalance, "
                                   + "COALESCE(SUM(CASE WHEN e.voucher_date BETWEEN :startDate AND :endDate THEN l.debit_amount - l.credit_amount ELSE 0 END),0) as periodBalance "
                                   + "FROM gl_journal_line l JOIN gl_journal_entry e ON l.journal_entry_id = e.id "
                                   + "WHERE e.status = 'POSTED' AND l.is_deleted = false",
                                   nativeQuery = true)
                            java.util.Map<String, Object> aggregateAllCompaniesTotals(@Param("startDate") java.time.LocalDate startDate,
                                                                                 @Param("endDate") java.time.LocalDate endDate);

              @Query("SELECT COUNT(l) FROM GlJournalLine l " +
                     "WHERE l.company.id = :companyId " +
                     "AND l.account.id = :accountId " +
                     "AND l.journalEntry.status = 'POSTED' " +
                     "AND l.isDeleted = false")
              long countPostedLinesForAccount(@Param("companyId") UUID companyId,
                                              @Param("accountId") UUID accountId);

              /**
               * Native aggregation for bulk fetching posted balances by account ID.
               * Used by BankAccounts API to enrich list endpoints efficiently.
               */
              interface AccountBalanceProjection {
                     String getAccountId();
                     java.math.BigDecimal getTotalDebit();
                     java.math.BigDecimal getTotalCredit();
                     Long getTransactionCount();
              }

              @Query(value = "SELECT CAST(l.account_id AS varchar) as accountId, " +
                     "COALESCE(SUM(l.debit_amount), 0) as totalDebit, " +
                     "COALESCE(SUM(l.credit_amount), 0) as totalCredit, " +
                     "COUNT(l.id) as transactionCount " +
                     "FROM gl_journal_line l " +
                     "JOIN gl_journal_entry e ON l.journal_entry_id = e.id " +
                     "WHERE l.account_id IN :accountIds " +
                     "AND e.status = 'POSTED' AND l.is_deleted = false " +
                     "GROUP BY l.account_id", nativeQuery = true)
              List<AccountBalanceProjection> aggregatePostedBalancesForAccounts(@Param("accountIds") List<UUID> accountIds);
}
