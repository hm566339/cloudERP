package com.erp.account.modules.quotation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;
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

/**
 * Quotation Entity
 * Represents a pre-sale document (Quotation) with multi-company support.
 * Implements soft delete architecture and comprehensive audit trail.
 */
@Entity
@Table(name = "quotation", uniqueConstraints = {
        @UniqueConstraint(name = "uk_quotation_company_number", columnNames = { "company_id", "quotation_number" })
}, indexes = {
        @Index(name = "idx_quotation_company", columnList = "company_id"),
        @Index(name = "idx_quotation_customer", columnList = "customer_id"),
        @Index(name = "idx_quotation_status", columnList = "status"),
        @Index(name = "idx_quotation_date", columnList = "quotation_date"),
        @Index(name = "idx_quotation_valid_until", columnList = "valid_until"),
        @Index(name = "idx_quotation_number", columnList = "quotation_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quotation extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "customer_id", nullable = false, updatable = false)
    private UUID customerId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", insertable = false, updatable = false)
    private Customer customer;

    @Column(name = "quotation_number", nullable = false, length = 50)
    private String quotationNumber;

    @Column(name = "quotation_date", nullable = false)
    private LocalDate quotationDate;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "quotation_currency", length = 3)
    private String quotationCurrency;

    @Column(name = "exchange_rate", precision = 19, scale = 6)
    private BigDecimal exchangeRate;

    // Financial fields (Calculated by Backend)
    @Column(name = "subtotal", precision = 19, scale = 4, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    private BigDecimal discountAmount;

    @Column(name = "freight_charges", precision = 19, scale = 4)
    private BigDecimal freightCharges;

    @Column(name = "other_charges", precision = 19, scale = 4)
    private BigDecimal otherCharges;

    @Column(name = "total_before_round_off", precision = 19, scale = 4)
    private BigDecimal totalBeforeRoundOff;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxAmount;

    @Column(name = "round_off", precision = 19, scale = 4)
    private BigDecimal roundOff;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal totalAmount;

    // GST: place of supply
    @Column(name = "place_of_supply_state_id")
    private UUID placeOfSupplyStateId;

    @Column(name = "place_of_supply_state_code", length = 10)
    private String placeOfSupplyStateCode;

    // Delivery Address
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

    // Billing Address
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

    // Terms and Conditions
    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;

    @Column(name = "warranty_terms", columnDefinition = "TEXT")
    private String warrantyTerms;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "payment_term_id")
    private UUID paymentTermId;

    @Column(name = "delivery_term_id")
    private UUID deliveryTermId;

    @Column(name = "warranty_term_id")
    private UUID warrantyTermId;

    @Column(name = "terms_condition_id")
    private UUID termsConditionId;

    @Column(name = "sales_manager_id")
    private UUID salesManagerId;

    // Workflow
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // Relationships
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnore
    private Set<QuotationItem> quotationItems = new HashSet<>();

    public void addQuotationItem(QuotationItem item) {
        if (quotationItems == null) {
            quotationItems = new HashSet<>();
        }
        quotationItems.add(item);
        item.setQuotation(this);
    }

    public void removeQuotationItem(QuotationItem item) {
        if (quotationItems != null) {
            quotationItems.remove(item);
            item.setQuotation(null);
        }
    }



    public boolean isEditable() {
        return status == QuotationStatus.DRAFT;
    }
}
