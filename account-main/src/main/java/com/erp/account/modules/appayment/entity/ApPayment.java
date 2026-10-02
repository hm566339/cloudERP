package com.erp.account.modules.appayment.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.vendor.entity.Vendor;


@Entity
@Table(name = "ap_payment", indexes = {
    @Index(name = "idx_ap_payment_company", columnList = "company_id"),
    @Index(name = "idx_ap_payment_vendor", columnList = "vendor_id"),
    @Index(name = "idx_ap_payment_no_unique", columnList = "company_id,payment_no", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPayment extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @Column(name = "payment_no", nullable = false)
    private String paymentNo;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "payment_amount", precision = 19, scale = 4)
    private BigDecimal paymentAmount;

    @Column(name = "tds_amount", precision = 19, scale = 4)
    private BigDecimal tdsAmount;

    @Column(name = "tds_payable_account_id")
    private UUID tdsPayableAccountId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20)
    private PaymentMode paymentMode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @Column(name = "reference_no")
    private String referenceNo;

    @Column(name = "cheque_number")
    private String chequeNumber;

    @Column(name = "utr_number")
    private String utrNumber;

    @Column(name = "transaction_id")
    private String transactionId;

    @Column(name = "cheque_date")
    private LocalDate chequeDate;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 30)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status", length = 30)
    private PostingStatus glPostingStatus;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Column(name = "reverse_gl_journal_entry_id")
    private UUID reverseGlJournalEntryId;

    @Column(name = "gl_posting_time")
    private LocalDateTime glPostingTime;

    @Column(name = "total_allocated_amount", precision = 19, scale = 4)
    private BigDecimal totalAllocatedAmount;

    @OneToMany(mappedBy = "apPayment", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<ApPaymentAllocation> allocations = new ArrayList<>();
}


