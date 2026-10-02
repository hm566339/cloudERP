package com.erp.account.modules.gljournal.repository;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.enums.SourceModule;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
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
 * GL Journal Entry Repository
 * 
 * Provides CRUD and custom query methods for journal entries.
 * Supports complex filtering and financial reporting queries.
 * 
 * @author ERP Team
 * @version 1.0
 */
@Repository
public interface GlJournalEntryRepository
        extends JpaRepository<GlJournalEntry, UUID>, JpaSpecificationExecutor<GlJournalEntry> {

    @Query("SELECT j FROM GlJournalEntry j LEFT JOIN FETCH j.journalLines WHERE j.id = :id AND j.isDeleted = false")
    Optional<GlJournalEntry> findByIdWithLines(@Param("id") UUID id);

    /**
     * Find by voucher number and company
     * 
     * @param voucherNo voucher number
     * @param companyId company ID
     * @return Optional of GlJournalEntry
     */
    Optional<GlJournalEntry> findByVoucherNoAndCompanyIdAndIsDeletedFalse(String voucherNo, UUID companyId);

    /**
     * Find all by company (pagination)
     * 
     * @param companyId company ID
     * @param pageable  pagination info
     * @return Page of GlJournalEntry
     */
    Page<GlJournalEntry> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    /**
     * Find all by company and status
     * 
     * @param companyId company ID
     * @param status    posting status
     * @param pageable  pagination info
     * @return Page of entries
     */
    Page<GlJournalEntry> findByCompanyIdAndStatusAndIsDeletedFalse(UUID companyId, PostingStatus status,
            Pageable pageable);

    /**
     * Find by date range
     * 
     * @param companyId company ID
     * @param startDate start date
     * @param endDate   end date
     * @param pageable  pagination
     * @return Page of entries
     */
    @Query("SELECT g FROM GlJournalEntry g WHERE g.company.id = :companyId " +
            "AND g.voucherDate BETWEEN :startDate AND :endDate " +
            "AND g.isDeleted = false " +
            "ORDER BY g.voucherDate DESC")
    Page<GlJournalEntry> findByDateRange(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            Pageable pageable);

    /**
     * Find by source module and source ID
     * 
     * @param sourceModule module (AP, AR, EXPENSE, etc.)
     * @param sourceId     source document ID
     * @return List of entries
     */
    @Query("SELECT g FROM GlJournalEntry g WHERE g.sourceModule = :sourceModule " +
            "AND g.sourceId = :sourceId AND g.isDeleted = false")
    List<GlJournalEntry> findBySourceModuleAndSourceId(
            @Param("sourceModule") SourceModule sourceModule,
            @Param("sourceId") UUID sourceId);

    Optional<GlJournalEntry> findFirstByCompanyIdAndSourceModuleAndSourceIdAndEventTypeAndIsDeletedFalse(
            UUID companyId, SourceModule sourceModule, UUID sourceId, String eventType);

    Optional<GlJournalEntry> findFirstByCompanyIdAndSourceModuleAndIdempotencyKeyAndIsDeletedFalse(
            UUID companyId, SourceModule sourceModule, String idempotencyKey);

    /**
     * Find all DRAFT entries for company
     * 
     * @param companyId company ID
     * @return List of draft entries
     */
    List<GlJournalEntry> findByCompanyIdAndStatusAndIsDeletedFalse(UUID companyId, PostingStatus status);

    /**
     * Count posted entries by company and date
     * 
     * @param companyId company ID
     * @param startDate start date
     * @param endDate   end date
     * @return count of posted entries
     */
    @Query("SELECT COUNT(g) FROM GlJournalEntry g WHERE g.company.id = :companyId " +
            "AND g.status = 'POSTED' AND g.isDeleted = false " +
            "AND g.voucherDate BETWEEN :startDate AND :endDate")
    Long countPostedEntries(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Get total debit amount by company and date
     * 
     * @param companyId company ID
     * @param startDate start date
     * @param endDate   end date
     * @return total debit amount
     */
    @Query("SELECT COALESCE(SUM(g.totalDebit), 0) FROM GlJournalEntry g " +
            "WHERE g.company.id = :companyId AND g.status = 'POSTED' " +
            "AND g.isDeleted = false AND g.voucherDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalDebitByDateRange(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Get total credit amount by company and date
     * 
     * @param companyId company ID
     * @param startDate start date
     * @param endDate   end date
     * @return total credit amount
     */
    @Query("SELECT COALESCE(SUM(g.totalCredit), 0) FROM GlJournalEntry g " +
            "WHERE g.company.id = :companyId AND g.status = 'POSTED' " +
            "AND g.isDeleted = false AND g.voucherDate BETWEEN :startDate AND :endDate")
    BigDecimal getTotalCreditByDateRange(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find entries by narration (search)
     * 
     * @param companyId company ID
     * @param keyword   search keyword
     * @param pageable  pagination
     * @return Page of matching entries
     */
    @Query("SELECT g FROM GlJournalEntry g WHERE g.company.id = :companyId " +
            "AND LOWER(g.narration) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "AND g.isDeleted = false")
    Page<GlJournalEntry> searchByNarration(
            @Param("companyId") UUID companyId,
            @Param("keyword") String keyword,
            Pageable pageable);

    /**
     * Find entries by reference number
     * 
     * @param companyId   company ID
     * @param referenceNo reference number
     * @return List of entries
     */
    List<GlJournalEntry> findByCompanyIdAndReferenceNoAndIsDeletedFalse(UUID companyId, String referenceNo);

    /**
     * Find entries in accounting period
     * 
     * @param periodId accounting period ID
     * @param pageable pagination
     * @return Page of entries
     */
    @Query("SELECT g FROM GlJournalEntry g WHERE g.accountingPeriod.id = :periodId " +
            "AND g.isDeleted = false ORDER BY g.voucherDate DESC")
    Page<GlJournalEntry> findByAccountingPeriod(
            @Param("periodId") UUID periodId,
            Pageable pageable);

    /**
     * Check if unbalanced entries exist
     * 
     * @param companyId company ID
     * @return count of unbalanced entries
     */
    @Query("SELECT COUNT(g) FROM GlJournalEntry g WHERE g.company.id = :companyId " +
            "AND g.totalDebit != g.totalCredit AND g.isDeleted = false")
    Long countUnbalancedEntries(@Param("companyId") UUID companyId);

    /**
     * Find maximum voucher number for auto-generation
     * 
     * @param companyId company ID
     * @param prefix    voucher prefix (e.g., JV-2026)
     * @return max sequence number
     */
    @Query(value = "SELECT MAX(CAST(SUBSTRING(g.voucher_no, LENGTH(:prefix) + 2) AS BIGINT)) " +
            "FROM gl_journal_entry g WHERE g.company_id = :companyId " +
            "AND g.voucher_no LIKE CONCAT(:prefix, '-%') AND g.is_deleted = false", nativeQuery = true)
    Long getMaxVoucherSequence(
            @Param("companyId") UUID companyId,
            @Param("prefix") String prefix);

    /**
     * (Duplicate method removed) Use existing
     * findByCompanyIdAndStatusAndIsDeletedFalse with Pageable.
     */

    /**
     * Check for duplicate voucher
     * 
     * @param voucherNo voucher number
     * @param companyId company ID
     * @return true if exists
     */
    boolean existsByVoucherNoAndCompanyIdAndIsDeletedFalse(String voucherNo, UUID companyId);

    Optional<GlJournalEntry> findTopByCompanyIdAndStatusInAndIsDeletedFalseOrderByCreatedAtDesc(UUID companyId,
            List<PostingStatus> statuses);

    Optional<GlJournalEntry> findByIdAndCompanyIdAndIsDeletedFalse(UUID id, UUID companyId);

    /**
     * Find entries by fiscal year for reporting
     * 
     * @param fiscalYearId fiscal year ID
     * @param status       posting status
     * @param pageable     pagination
     * @return Page of entries
     */
    @Query("SELECT g FROM GlJournalEntry g WHERE g.fiscalYear.id = :fiscalYearId " +
            "AND g.status = :status AND g.isDeleted = false")
    Page<GlJournalEntry> findByFiscalYearAndStatus(
            @Param("fiscalYearId") UUID fiscalYearId,
            @Param("status") PostingStatus status,
            Pageable pageable);

    // Convenience methods that exclude soft-deleted rows
    Page<GlJournalEntry> findAllByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);

    Page<GlJournalEntry> findAllByCompanyIdAndVoucherDateBetweenAndIsDeletedFalse(UUID companyId, LocalDate startDate,
            LocalDate endDate, Pageable pageable);

    Optional<GlJournalEntry> findBySourceIdAndSourceModule(UUID id,
            SourceModule glSourceModule);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {
            "company",
            "fiscalYear",
            "accountingPeriod",
            "journalLines",
            "journalLines.account"
    })
    @Query("SELECT j FROM GlJournalEntry j WHERE j.id = :id AND j.company.id = :companyId AND j.isDeleted = false")
    Optional<GlJournalEntry> findProfileByIdAndCompanyId(@Param("id") UUID id, @Param("companyId") UUID companyId);

    @Override
    @EntityGraph(attributePaths = { "company" })
    Page<GlJournalEntry> findAll(Specification<GlJournalEntry> spec, Pageable pageable);
}
