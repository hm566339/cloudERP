package com.erp.account.modules.creditnote.entity;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;


@Entity
@Table(name = "credit_note", indexes = {
        @Index(name = "idx_credit_note_company", columnList = "company_id"),
        @Index(name = "idx_credit_note_invoice", columnList = "sales_invoice_id"),
        @Index(name = "idx_credit_note_no_unique", columnList = "company_id,credit_note_no", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreditNote extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_invoice_id", nullable = false)
    private SalesInvoice salesInvoice;

    @Column(name = "credit_note_no", nullable = false)
    private String creditNoteNo;

    @Column(name = "note_date", nullable = false)
    private LocalDate noteDate;

    @Column(name = "amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "gst_amount", precision = 19, scale = 4)
    private BigDecimal gstAmount;

    @Column(name = "reference_no")
    private String referenceNo;

    @Column(name = "receivable_account_id")
    private UUID receivableAccountId;

    @Column(name = "revenue_adjustment_account_id")
    private UUID revenueAdjustmentAccountId;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private DocumentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status", length = 30)
    private PostingStatus glPostingStatus;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "posting_time")
    private LocalDateTime postingTime;
}


