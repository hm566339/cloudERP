package com.erp.account.modules.apinvoice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.enums.GstTreatment;
import com.erp.account.enums.ItcEligibility;
import com.erp.account.enums.PaymentType;
import com.erp.account.enums.PurchaseDocumentType;
import com.erp.account.enums.PurchaseNature;
import com.erp.account.enums.PurchaseSource;

import jakarta.persistence.*;
import lombok.*;


import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.account.modules.appayment.entity.ApPaymentAllocation;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.debitnote.entity.DebitNote;
import com.erp.account.modules.vendor.entity.Vendor;


@Entity
@Table(name = "ap_invoice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApInvoice extends BaseEntity implements Serializable {

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

    @Column(name = "invoice_no", nullable = false)
    private String invoiceNo;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "invoice_currency")
    private String invoiceCurrency;

    @Column(name = "is_reverse_charge")
    private Boolean isReverseCharge = false;

    @Column(name = "is_blocked_itc")
    private Boolean isBlockedItc = false;

    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    @Column(name = "subtotal", precision = 19, scale = 4)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", precision = 19, scale = 4)
    private BigDecimal taxAmount;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "input_cgst_account_id")
    private UUID inputCgstAccountId;

    @Column(name = "input_sgst_account_id")
    private UUID inputSgstAccountId;

    @Column(name = "input_igst_account_id")
    private UUID inputIgstAccountId;

    @Column(name = "input_cess_account_id")
    private UUID inputCessAccountId;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "freight_charges", precision = 19, scale = 4)
    private BigDecimal freightCharges;

    @Column(name = "total_before_round_off", precision = 19, scale = 4)
    private BigDecimal totalBeforeRoundOff;

    @Column(name = "round_off", precision = 19, scale = 4)
    private BigDecimal roundOff;

    @Column(name = "paid_amount", precision = 19, scale = 4)
    private BigDecimal paidAmount;

    @Column(name = "outstanding_amount", precision = 19, scale = 4)
    private BigDecimal outstandingAmount;

    @Column(name = "tds_amount", precision = 19, scale = 4)
    private BigDecimal tdsAmount;

    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Column(name = "reverse_gl_journal_entry_id")
    private UUID reverseGlJournalEntryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status")
    private PostingStatus glPostingStatus;

    @Column(name = "gl_posting_time")
    private LocalDateTime glPostingTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;


    @Column(name = "place_of_supply_state_id")
    private UUID placeOfSupplyStateId;

    @Column(name = "place_of_supply_state_code", length = 10)
    private String placeOfSupplyStateCode;

    // ============================================================
    // VENDOR ADDRESS SNAPSHOT
    // ============================================================
    @Column(name = "vendor_address_id")
    private UUID vendorAddressId;

    @Column(name = "purchase_address_line1")
    private String purchaseAddressLine1;

    @Column(name = "purchase_address_line2")
    private String purchaseAddressLine2;

    @Column(name = "purchase_city")
    private String purchaseCity;

    @Column(name = "purchase_state")
    private String purchaseState;

    @Column(name = "purchase_postal_code")
    private String purchasePostalCode;

    @Column(name = "purchase_country")
    private String purchaseCountry;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @Column(name = "goods_receipt_id")
    private UUID goodsReceiptId;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_source", length = 40)
    private PurchaseSource purchaseSource;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 40)
    private PurchaseDocumentType documentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "purchase_nature", length = 20)
    private PurchaseNature purchaseNature;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", length = 20)
    private PaymentType paymentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "gst_treatment", length = 30)
    private GstTreatment gstTreatment;

    @Enumerated(EnumType.STRING)
    @Column(name = "itc_eligibility", length = 30)
    private ItcEligibility itcEligibility;

    @Column(name = "itc_reason", length = 500)
    private String itcReason;

    @Column(name = "supplier_invoice_number", length = 100)
    private String supplierInvoiceNumber;

    @Column(name = "supplier_invoice_date")
    private LocalDate supplierInvoiceDate;

    @OneToMany(mappedBy = "apInvoice", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonIgnore
    private List<ApInvoiceItem> items;

    @OneToMany(mappedBy = "apInvoice", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ApPaymentAllocation> allocations;

    @OneToMany(mappedBy = "apInvoice", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DebitNote> debitNotes;
}


