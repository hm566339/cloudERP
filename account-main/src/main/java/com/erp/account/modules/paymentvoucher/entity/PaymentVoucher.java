package com.erp.account.modules.paymentvoucher.entity;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.vendor.entity.Vendor;


@Entity
@Table(name = "payment_voucher", indexes = {
        @Index(name = "idx_payment_voucher_company", columnList = "company_id"),
        @Index(name = "idx_payment_voucher_vendor", columnList = "vendor_id"),
        @Index(name = "idx_payment_voucher_no_unique", columnList = "company_id,voucher_no", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVoucher extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false)
    private Vendor vendor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @Column(name = "voucher_no", nullable = false)
    private String voucherNo;

    @Column(name = "voucher_date", nullable = false)
    private LocalDate voucherDate;

    @Column(name = "payment_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal paymentAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20, nullable = false)
    private PaymentMode paymentMode;

    @Column(name = "reference_no")
    private String referenceNo;

    @Column(name = "cheque_number")
    private String chequeNumber;

    @Column(name = "cheque_date")
    private LocalDate chequeDate;

    @Column(name = "upi_reference_number")
    private String upiReferenceNumber;

    @Column(name = "transaction_reference")
    private String transactionReference;

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

    @Column(name = "gl_posting_time")
    private LocalDateTime glPostingTime;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payable_account_id", nullable = false)
    private ChartOfAccount payableAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_account_id", nullable = false)
    private ChartOfAccount paymentAccount;

    @Column(name = "total_allocated_amount", precision = 19, scale = 4)
    private BigDecimal totalAllocatedAmount;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
    private com.erp.account.modules.purchaseorder.entity.PurchaseOrder purchaseOrder;

    @OneToMany(mappedBy = "paymentVoucher", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private List<PaymentVoucherAllocation> allocations = new ArrayList<>();
}


