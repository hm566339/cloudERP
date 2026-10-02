package com.erp.account.modules.salesorder.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;
import com.erp.account.modules.quotation.entity.Quotation;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales_order", indexes = {
        @Index(name = "idx_so_company", columnList = "company_id"),
        @Index(name = "idx_so_customer", columnList = "customer_id"),
        @Index(name = "idx_so_pi", columnList = "source_pi_id"),
        @Index(name = "idx_so_number", columnList = "so_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "so_number", nullable = false, length = 50)
    private String soNumber;

    @Column(name = "so_date", nullable = false)
    private LocalDate soDate;

    // Lineage
    @Column(name = "source_pi_id", updatable = false)
    private UUID sourceProformaInvoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_pi_id", insertable = false, updatable = false)
    private ProformaInvoice sourceProformaInvoice;

    @Column(name = "source_pi_number", length = 50, updatable = false)
    private String sourceProformaInvoiceNumber;

    @Column(name = "source_quotation_id", updatable = false)
    private UUID sourceQuotationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_quotation_id", insertable = false, updatable = false)
    private Quotation sourceQuotation;

    @Column(name = "source_quotation_number", length = 50, updatable = false)
    private String sourceQuotationNumber;

    // Customer
    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    // Address Snapshots
    @Column(name = "billing_address_id")
    private UUID billingAddressId;

    @Column(name = "billing_address_snapshot", columnDefinition = "TEXT")
    private String billingAddressSnapshot;

    @Column(name = "billing_state_code", length = 2)
    private String billingStateCode;

    @Column(name = "delivery_address_id")
    private UUID deliveryAddressId;

    @Column(name = "delivery_address_snapshot", columnDefinition = "TEXT")
    private String deliveryAddressSnapshot;

    // Payment and Bank Details
    @Column(name = "bank_account_id")
    private UUID bankAccountId;

    @Column(name = "bank_details_snapshot", columnDefinition = "TEXT")
    private String bankDetailsSnapshot;

    // Commercial Details
    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "exchange_rate", precision = 19, scale = 6, nullable = false)
    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "place_of_supply_state_id")
    private UUID placeOfSupplyStateId;

    @Column(name = "place_of_supply_state_code", length = 2)
    private String placeOfSupplyStateCode;

    // Totals
    @Column(name = "subtotal", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "freight_charges", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal freightCharges = BigDecimal.ZERO;

    @Column(name = "other_charges", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Column(name = "total_before_round_off", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal totalBeforeRoundOff = BigDecimal.ZERO;

    @Column(name = "round_off", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // Terms & Conditions
    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "payment_term_id")
    private UUID paymentTermId;

    @Column(name = "terms_condition_id")
    private UUID termsConditionId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SalesOrderStatus status = SalesOrderStatus.DRAFT;

    @OneToMany(mappedBy = "salesOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SalesOrderItem> items = new ArrayList<>();



    public void addSalesOrderItem(SalesOrderItem item) {
        items.add(item);
        item.setSalesOrder(this);
    }

    public void removeSalesOrderItem(SalesOrderItem item) {
        items.remove(item);
        item.setSalesOrder(null);
    }
}
