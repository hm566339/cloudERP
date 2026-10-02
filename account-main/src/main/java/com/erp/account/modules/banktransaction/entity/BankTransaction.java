package com.erp.account.modules.banktransaction.entity;

import com.erp.account.enums.BankTransactionType;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;


/**
 * Bank Transaction Entity
 * 
 * Represents a bank transaction with:
 * - Double-entry accounting support
 * - Multi-company isolation
 * - Reconciliation tracking
 * - GL posting integration
 * - Audit compliance
 * 
 * @author ERP System
 * @version 1.0
 */
@Entity
@Table(name = "bank_transaction", indexes = {
    @Index(name = "idx_company_date", columnList = "company_id, transaction_date"),
    @Index(name = "idx_bank_account_date", columnList = "bank_account_id, transaction_date"),
    @Index(name = "idx_reference_company", columnList = "reference_no, company_id"),
    @Index(name = "idx_utr_company", columnList = "utr_no, company_id"),
    @Index(name = "idx_reconciled", columnList = "reconciled")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankTransaction extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id", nullable = false)
    private BankAccount bankAccount;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "reference_no", length = 100, nullable = false)
    private String referenceNo;

    @Column(name = "utr_no", length = 50)
    private String utrNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private BankTransactionType transactionType;

    @Column(name = "debit_amount", precision = 19, scale = 4)
    private BigDecimal debitAmount;

    @Column(name = "credit_amount", precision = 19, scale = 4)
    private BigDecimal creditAmount;

    @Column(name = "narration", length = 1000)
    private String narration;

    @Column(name = "reconciled")
    private Boolean reconciled = Boolean.FALSE;

    @Column(name = "reconciled_date")
    private LocalDateTime reconciledDate;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status", length = 30)
    private PostingStatus glPostingStatus;
}


