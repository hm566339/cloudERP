package com.erp.account.modules.gljournal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.util.Invoice;


/**
 * GL Journal Entry Entity - Core ledger transaction record
 * 
 * Represents a double-entry accounting journal entry with audit trail,
 * hash-based tamper detection, and full posting lifecycle management.
 * 
 * Accounting Principles:
 * - totalDebit MUST equal totalCredit for balanced entries
 * - Minimum 2 journal lines (1 debit, 1 credit)
 * - Only DRAFT entries can be edited/posted
 * - SHA-256 hash chain for audit security
 * 
 * @author ERP Team
 * @version 1.0
 */
@Entity
@Table(name = "gl_journal_entry", indexes = {
    @Index(name = "idx_gl_journal_entry_company_id", columnList = "company_id"),
    @Index(name = "idx_voucher_date", columnList = "voucher_date"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_company_voucher_no", columnList = "company_id, voucher_no", unique = true),
    @Index(name = "uk_gl_manufacturing_source", columnList = "company_id, source_module, source_id, event_type", unique = true),
    @Index(name = "uk_gl_manufacturing_idempotency", columnList = "company_id, source_module, idempotency_key", unique = true),
    @Index(name = "idx_gl_journal_entry_company_date_status", columnList = "company_id, voucher_date, status"),
    @Index(name = "idx_gl_journal_entry_company_fiscal_year", columnList = "company_id, fiscal_year_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlJournalEntry extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Company reference - ensures multi-company segregation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /**
     * Fiscal year context for GL reporting
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiscal_year_id")
    private FiscalYear fiscalYear;

    /**
     * Accounting period - validates period closure and cutoff rules
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accounting_period_id")
    private AccountingPeriod accountingPeriod;

    /**
     * Auto-generated unique voucher number per company
     * Format: JV-2026-000001
     */
    @Column(name = "voucher_no", nullable = false, length = 20)
    private String voucherNo;

    /**
     * Transaction date - cannot be future or in closed period
     */
    @Column(name = "voucher_date", nullable = false)
    private LocalDate voucherDate;

    /**
     * Optional reference to source invoice/payment
     */
    @Column(name = "reference_no", length = 50)
    private String referenceNo;

    /**
     * Source module identifier - use enum for strong typing
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "source_module", length = 30)
    private SourceModule sourceModule;

    /**
     * Source document ID (AP Invoice ID, Payment ID, etc.)
     */
    @Column(name = "source_id")
    private UUID sourceId;

    @Column(name = "event_type", length = 60)
    private String eventType;

    @Column(name = "idempotency_key", length = 200)
    private String idempotencyKey;

    /**
     * Journal entry narration/description
     */
    @Column(name = "narration", columnDefinition = "TEXT")
    private String narration;

    /**
     * Current posting status - DRAFT, POSTED, REVERSED, CANCELLED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PostingStatus status = PostingStatus.DRAFT;

    /**
     * Total debit amount for validation
     * MUST equal totalCredit for balanced entry
     */
    @Column(name = "total_debit", precision = 19, scale = 4)
    private BigDecimal totalDebit = BigDecimal.ZERO;

    /**
     * Total credit amount for validation
     * MUST equal totalDebit for balanced entry
     */
    @Column(name = "total_credit", precision = 19, scale = 4)
    private BigDecimal totalCredit = BigDecimal.ZERO;

    /**
     * SHA-256 hash of current entry - tamper detection
     */
    @Column(name = "hash_value", columnDefinition = "TEXT")
    private String hashValue;

    /**
     * Previous hash in chain - audit trail
     */
    @Column(name = "previous_hash", columnDefinition = "TEXT")
    private String previousHash;

    /**
     * Hash algorithm used (SHA-256, SHA-512)
     */
    @Column(name = "hash_algorithm", length = 50)
    private String hashAlgorithm = "SHA-256";

    /**
     * User who posted the entry
     */
    @Column(name = "posted_by")
    private UUID postedBy;

    /**
     * Timestamp when entry was posted
     */
    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    /**
     * Optimistic locking version
     */
    @Version
    @Column(name = "version")
    private Long version;

    // createdBy/updatedBy are inherited from BaseEntity

    /**
     * One-to-many relationship with journal lines
     * Cascade all operations, orphan removal for deleted lines
     */
    @OneToMany(
        mappedBy = "journalEntry",
        cascade = CascadeType.ALL,
        orphanRemoval = true,
        fetch = FetchType.LAZY
    )
    @org.hibernate.annotations.BatchSize(size = 50)
    @JsonIgnore
    private Set<GlJournalLine> journalLines = new HashSet<>();

    /**
     * Business logic: Check if entry is balanced
     * 
     * @return true if totalDebit == totalCredit with EPSILON precision
     */
    public boolean isBalanced() {
        if (totalDebit == null || totalCredit == null) {
            return false;
        }
        // Use EPSILON for BigDecimal comparison (2 decimal places for amount comparison)
        return totalDebit.compareTo(totalCredit) == 0;
    }

    /**
     * Business logic: Check if entry can be posted
     * Only DRAFT entries can transition to POSTED
     * 
     * @return true if status is DRAFT
     */
    public boolean canPost() {
        return PostingStatus.DRAFT == this.status;
    }

    /**
     * Business logic: Check if entry can be reversed
     * Only POSTED entries can be reversed
     * 
     * @return true if status is POSTED
     */
    public boolean canReverse() {
        return PostingStatus.POSTED == this.status;
    }

    /**
     * Business logic: Check if entry can be edited
     * Only DRAFT entries can be edited
     * 
     * @return true if status is DRAFT
     */
    public boolean canEdit() {
        return PostingStatus.DRAFT == this.status;
    }

    /**
     * Business logic: Check if entry can be deleted
     * Only DRAFT entries can be deleted
     * 
     * @return true if status is DRAFT and not soft-deleted
     */
    public boolean canDelete() {
        return PostingStatus.DRAFT == this.status && !Boolean.TRUE.equals(super.getIsDeleted());
    }

    /**
     * Get line count for validation
     * 
     * @return number of active journal lines
     */
    public int getLineCount() {
        return journalLines != null ? journalLines.size() : 0;
    }

    /**
     * Get debit line count
     * 
     * @return count of lines with debit amount > 0
     */
    public long getDebitLineCount() {
        if (journalLines == null) return 0;
        return journalLines.stream()
            .filter(line -> line.getDebitAmount() != null && line.getDebitAmount().compareTo(BigDecimal.ZERO) > 0)
            .count();
    }

    /**
     * Get credit line count
     * 
     * @return count of lines with credit amount > 0
     */
    public long getCreditLineCount() {
        if (journalLines == null) return 0;
        return journalLines.stream()
            .filter(line -> line.getCreditAmount() != null && line.getCreditAmount().compareTo(BigDecimal.ZERO) > 0)
            .count();
    }
}


