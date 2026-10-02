package com.erp.account.modules.debitnote.entity;

import com.erp.account.enums.DocumentStatus;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(name = "debit_note", indexes = {
        @Index(name = "idx_debit_note_company", columnList = "company_id"),
        @Index(name = "idx_debit_note_invoice", columnList = "ap_invoice_id"),
        @Index(name = "idx_debit_note_no_unique", columnList = "company_id,debit_note_no", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DebitNote extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id", nullable = false)
    private ApInvoice apInvoice;

    @Column(name = "debit_note_no", nullable = false)
    private String debitNoteNo;

    @Column(name = "note_date", nullable = false)
    private LocalDate noteDate;

    @Column(name = "amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal amount;

    @Column(name = "gst_amount", precision = 19, scale = 4)
    private BigDecimal gstAmount;

    @Column(name = "reference_no")
    private String referenceNo;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "payable_account_id")
    private UUID payableAccountId;

    @Column(name = "purchase_return_account_id")
    private UUID purchaseReturnAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private DocumentStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status", length = 30)
    private PostingStatus glPostingStatus;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;
}


