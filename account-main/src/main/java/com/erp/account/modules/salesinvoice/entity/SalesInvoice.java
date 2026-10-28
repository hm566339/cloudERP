package com.erp.account.modules.salesinvoice.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PaymentStatus;
import com.erp.account.enums.PostingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.util.Invoice;

/**
 * SalesInvoice Entity
 * Represents an ERP Sales Invoice with multi-company support
 * Implements soft delete architecture and comprehensive audit trail
 *
 * @author ERP System
 * @since 1.0.0
 */
@Entity
@Table(name = "sales_invoice", uniqueConstraints = {
        @UniqueConstraint(name = "uk_sales_invoice_company_number", columnNames = { "company_id", "invoice_number" })
}, indexes = {
        @Index(name = "idx_sales_invoice_company", columnList = "company_id"),
        @Index(name = "idx_sales_invoice_customer", columnList = "customer_id"),
        @Index(name = "idx_sales_invoice_status", columnList = "status"),
        @Index(name = "idx_sales_invoice_invoice_date", columnList = "invoice_date"),
        @Index(name = "idx_sales_invoice_due_date", columnList = "due_date"),
        @Index(name = "idx_sales_invoice_number", columnList = "invoice_number"),
        @Index(name = "idx_sales_invoice_so", columnList = "source_sales_order_id"),
        @Index(name = "idx_sales_invoice_dc", columnList = "source_delivery_challan_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoice extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    /**
     * Multi-company support: company_id is mandatory and immutable
     */
    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    /**
     * Customer must belong to the same company
     */
    @Column(name = "customer_id", nullable = false, updatable = false)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    // Lineage from Sales Order
    @Column(name = "source_sales_order_id", updatable = false)
    private UUID sourceSalesOrderId;

    @Column(name = "source_sales_order_number", length = 50, updatable = false)
    private String sourceSalesOrderNumber;

    // Lineage from Delivery Challan
    @Column(name = "source_delivery_challan_id", updatable = false)
    private UUID sourceDeliveryChallanId;

    @Column(name = "source_delivery_challan_number", length = 50, updatable = false)
    private String sourceDeliveryChallanNumber;

    /**
     * Invoice number - unique per company
     */
    @Column(name = "invoice_number", nullable = false, length = 50)
    private String invoiceNumber;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Multi-currency support
     */
    @Column(name = "invoice_currency", length = 3)
    private String invoiceCurrency;

    /**
     * Exchange rate with 6 decimal places for precision
     */
    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    /**
     * Financial amounts with 4 decimal places precision
     */
    @Column(name = "subtotal", precision = 19, scale = 4, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "freight_charges", precision = 19, scale = 4)
    private BigDecimal freightCharges;

    @Column(name = "other_charges", precision = 19, scale = 4)
    private BigDecimal otherCharges;

    @Column(name = "total_before_round_off", precision = 19, scale = 4)
    private BigDecimal totalBeforeRoundOff;

    @Column(name = "round_off", precision = 19, scale = 4)
    private BigDecimal roundOff;

    @Column(name = "received_amount", precision = 19, scale = 4)
    private BigDecimal receivedAmount;

    @Column(name = "outstanding_amount", precision = 19, scale = 4)
    private BigDecimal outstandingAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Column(name = "receivable_account_id", nullable = false)
    private UUID receivableAccountId;

    @Column(name = "revenue_account_id", nullable = false)
    private UUID revenueAccountId;

    @Column(name = "output_cgst_account_id")
    private UUID outputCgstAccountId;

    @Column(name = "output_sgst_account_id")
    private UUID outputSgstAccountId;

    @Column(name = "output_igst_account_id")
    private UUID outputIgstAccountId;

    @Column(name = "output_cess_account_id")
    private UUID outputCessAccountId;

    /**
     * GST: place of supply for tax calculation
     */
    @Column(name = "place_of_supply_state_id")
    private UUID placeOfSupplyStateId;

    @Column(name = "place_of_supply_state_code", length = 10)
    private String placeOfSupplyStateCode;

    // ============================================================
    // DELIVERY ADDRESS SNAPSHOT
    // ============================================================
    @Column(name = "delivery_address_id")
    private UUID deliveryAddressId;

    @Column(name = "delivery_address_line1")
    private String deliveryAddressLine1;

    @Column(name = "delivery_address_line2")
    private String deliveryAddressLine2;

    @Column(name = "delivery_city")
    private String deliveryCity;

    @Column(name = "delivery_state")
    private String deliveryState;

    @Column(name = "delivery_postal_code")
    private String deliveryPostalCode;

    @Column(name = "delivery_country")
    private String deliveryCountry;

    // ============================================================
    // BILLING ADDRESS SNAPSHOT
    // ============================================================
    @Column(name = "billing_address_id")
    private UUID billingAddressId;

    @Column(name = "billing_address_line1")
    private String billingAddressLine1;

    @Column(name = "billing_address_line2")
    private String billingAddressLine2;

    @Column(name = "billing_city")
    private String billingCity;

    @Column(name = "billing_state")
    private String billingState;

    @Column(name = "billing_postal_code")
    private String billingPostalCode;

    @Column(name = "billing_country")
    private String billingCountry;

    @Column(name = "billing_state_code", length = 10)
    private String billingStateCode;

    /**
     * Invoice workflow status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private InvoiceStatus status;

    /**
     * Approval tracking
     */
    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    /**
     * GL Posting tracking
     */
    @Column(name = "gl_journal_entry_id")
    private UUID glJournalEntryId;

    @Enumerated(EnumType.STRING)
    @Column(name = "gl_posting_status")
    private PostingStatus glPostingStatus;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "payment_term_id")
    private UUID paymentTermId;

    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "terms_condition_id")
    private UUID termsConditionId;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ============================================================
    // GST E-INVOICE / IRP ATTRIBUTES (Rule 48(4))
    // ============================================================

    @Column(name = "gst_registration_id")
    private UUID gstRegistrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gst_registration_id", insertable = false, updatable = false)
    private GstRegistration gstRegistration;

    @Column(name = "irn", length = 64)
    private String irn;

    @Column(name = "ack_no", length = 50)
    private String ackNo;

    @Column(name = "ack_date")
    private LocalDateTime ackDate;

    @Column(name = "signed_invoice", columnDefinition = "TEXT")
    private String signedInvoice;

    @Column(name = "signed_qr_code", columnDefinition = "TEXT")
    private String signedQrCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "einvoice_status", length = 30)
    @Builder.Default
    private EinvoiceStatus einvoiceStatus = EinvoiceStatus.NOT_REQUESTED;

    @Column(name = "einvoice_failure_reason", columnDefinition = "TEXT")
    private String einvoiceFailureReason;

    @Column(name = "is_mock_einvoice")
    @Builder.Default
    private Boolean isMockEinvoice = false;

    /**
     * One-to-Many relationship with SalesInvoiceItem
     */
    @OneToMany(mappedBy = "salesInvoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private Set<SalesInvoiceItem> salesInvoiceItems = new HashSet<>();

    // ============================================================
    // TAXES (Grouped by Slab)
    // ============================================================

    @OneToMany(mappedBy = "salesInvoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private Set<InvoiceTax> invoiceTaxes = new HashSet<>();

    // Helper methods for bidirectional relationships
    public void addInvoiceTax(InvoiceTax tax) {
        invoiceTaxes.add(tax);
        tax.setSalesInvoice(this);
    }



    /**
     * Helper method to add sales invoice item
     */
    public void addSalesInvoiceItem(SalesInvoiceItem item) {
        if (salesInvoiceItems == null) {
            salesInvoiceItems = new HashSet<>();
        }
        salesInvoiceItems.add(item);
        item.setSalesInvoice(this);
    }

    /**
     * Helper method to remove sales invoice item
     */
    public void removeSalesInvoiceItem(SalesInvoiceItem item) {
        if (salesInvoiceItems != null) {
            salesInvoiceItems.remove(item);
            item.setSalesInvoice(null);
        }
    }

    /**
     * Helper method to check if invoice is editable
     */
    public boolean isEditable() {
        return status != InvoiceStatus.POSTED && status != InvoiceStatus.PAID && status != InvoiceStatus.CANCELLED;
    }

    /**
     * Helper method to check if invoice can be posted
     */
    public boolean canBePosted() {
        return status == InvoiceStatus.APPROVED;
    }
}
