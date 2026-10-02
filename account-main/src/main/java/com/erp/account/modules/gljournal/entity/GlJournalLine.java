package com.erp.account.modules.gljournal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.company.entity.Company;


/**
 * GL Journal Line Entity - Individual ledger line item
 * 
 * Represents a single debit or credit line in a journal entry.
 * Each line must have either debit OR credit, never both.
 * 
 * Business Rules:
 * - Either debitAmount OR creditAmount must be > 0, never both
 * - Debit and Credit cannot both be on same line
 * - Amount must be positive
 * - Exchange rate required for non-base currency lines
 * - Account must be active and posting allowed
 * 
 * @author ERP Team
 * @version 1.0
 */
@Entity
@Table(name = "gl_journal_line", indexes = {
    @Index(name = "idx_gl_journal_line_company_id", columnList = "company_id"),
    @Index(name = "idx_journal_entry_id", columnList = "journal_entry_id"),
    @Index(name = "idx_account_id", columnList = "account_id"),
    @Index(name = "idx_gl_journal_line_company_account", columnList = "company_id, account_id"),
    @Index(name = "idx_gl_journal_line_company_branch", columnList = "company_id, branch_id"),
    @Index(name = "idx_gl_journal_line_company_cost_center", columnList = "company_id, cost_center_id"),
    @Index(name = "idx_gl_journal_line_company_project", columnList = "company_id, project_id"),
    @Index(name = "idx_gl_journal_line_company_department", columnList = "company_id, department_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GlJournalLine extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Company reference - multi-company segregation
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    /**
     * Parent journal entry - bidirectional relationship
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_entry_id", nullable = false)
    private GlJournalEntry journalEntry;

    /**
     * GL Account being debited or credited
     * Must be active with posting_allowed = true
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id")
    private ChartOfAccount account;

    /**
     * Debit amount - defaults to ZERO
     * Either this OR creditAmount must be > 0, never both
     */
    @Column(name = "debit_amount", precision = 19, scale = 4)
    private BigDecimal debitAmount = BigDecimal.ZERO;

    /**
     * Credit amount - defaults to ZERO
     * Either this OR debitAmount must be > 0, never both
     */
    @Column(name = "credit_amount", precision = 19, scale = 4)
    private BigDecimal creditAmount = BigDecimal.ZERO;

    /**
     * Currency code for multi-currency entries (e.g., USD, EUR)
     * Null = base currency
     */
    @Column(name = "currency_code", length = 3)
    private String currencyCode;

    /**
     * Exchange rate to base currency
     * Mandatory if currencyCode is not null and not base currency
     * Precision: 6 decimal places for FX rates
     */
    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    /**
     * Line-level description/narration
     * Optional - overrides journal entry narration if needed
     */
    @Column(name = "line_description", columnDefinition = "TEXT")
    private String lineDescription;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "cost_center_id")
    private UUID costCenterId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "department_id")
    private UUID departmentId;

    /**
     * Business logic: Check if line has valid debit/credit
     * Exactly one (debit OR credit) must be > 0
     * 
     * @return true if exactly one of debit or credit is > 0
     */

    /**
     * Business logic: Check if line has exactly one positive amount.
     *
     * @return true when exactly one of debit/credit is greater than zero
     */
    public boolean isValidLine() {
        boolean debit = debitAmount != null && debitAmount.compareTo(BigDecimal.ZERO) > 0;
        boolean credit = creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0;
        return debit ^ credit;
    }

    /**
     * Business logic: Check if line is a debit
     * 
     * @return true if debitAmount > 0
     */
    public boolean isDebit() {
        return debitAmount != null && debitAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Business logic: Check if line is a credit
     * 
     * @return true if creditAmount > 0
     */
    public boolean isCredit() {
        return creditAmount != null && creditAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Get the amount (debit or credit)
     * 
     * @return the non-zero amount
     */
    public BigDecimal getAmount() {
        if (isDebit()) {
            return debitAmount;
        } else if (isCredit()) {
            return creditAmount;
        }
        return BigDecimal.ZERO;
    }

    

    /**
     * Calculate line amount in base currency
     * 
     * @return amount * exchangeRate if foreign currency, else amount
     */
    public BigDecimal getBaseAmount() {
        BigDecimal amount = getAmount();
        if (exchangeRate != null && exchangeRate.compareTo(BigDecimal.ONE) != 0) {
            return amount.multiply(exchangeRate);
        }
        return amount;
    }
}


