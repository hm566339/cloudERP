package com.erp.account.modules.receiptvoucher.entity;

import com.erp.account.enums.PaymentMode;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.ReceiptVoucherStatus;
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
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.common.entity.ReceiptAllocation;


@Entity
@Table(name = "receipt_voucher", indexes = {
        @Index(name = "idx_receipt_voucher_company", columnList = "company_id"),
        @Index(name = "idx_receipt_voucher_customer", columnList = "customer_id"),
        @Index(name = "idx_receipt_voucher_no_unique", columnList = "company_id,receipt_no", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptVoucher extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @Column(name = "receipt_no", nullable = false)
    private String receiptNo;

    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    @Column(name = "receipt_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal receiptAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_mode", length = 20, nullable = false)
    private PaymentMode paymentMode;

    @Column(name = "reference_no")
    private String referenceNo;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Enumerated(EnumType.STRING)
    @Column(name = "receipt_status", length = 30)
    private ReceiptVoucherStatus receiptStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status", length = 30)
    private PostingStatus glPostingStatus;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Column(name = "gl_posting_time")
    private LocalDateTime glPostingTime;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "posted_by")
    private UUID postedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receivable_account_id", nullable = false)
    private ChartOfAccount receivableAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_account_id", nullable = false)
    private ChartOfAccount receiptAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_invoice_id")
    private SalesInvoice salesInvoice;

    @Column(name = "total_allocated_amount", precision = 19, scale = 4)
    private BigDecimal totalAllocatedAmount;

    @OneToMany(mappedBy = "receiptVoucher", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<ReceiptAllocation> allocations = new ArrayList<>();

    public void addAllocation(ReceiptAllocation allocation) {
        this.allocations.add(allocation);
        allocation.setReceiptVoucher(this);
    }
}



