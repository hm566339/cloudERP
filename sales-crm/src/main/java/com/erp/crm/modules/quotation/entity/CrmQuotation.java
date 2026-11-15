package com.erp.crm.modules.quotation.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.quotation.enums.DiscountType;
import com.erp.crm.modules.quotation.enums.QuotationApprovalStatus;
import com.erp.crm.modules.quotation.enums.QuotationStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_quotation", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_quote_comp_num_rev", columnNames = {"company_id", "quotation_number", "revision_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmQuotation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "quotation_number", nullable = false, length = 50)
    private String quotationNumber;

    @Column(name = "quotation_date", nullable = false)
    private LocalDate quotationDate;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "opportunity_id")
    private UUID opportunityId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "contact_id")
    private UUID contactId;

    @Builder.Default
    @Column(name = "revision_number", nullable = false)
    private Integer revisionNumber = 1;

    @Column(name = "parent_quotation_id")
    private UUID parentQuotationId;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Builder.Default
    @Column(name = "exchange_rate", nullable = false, precision = 19, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Builder.Default
    @Column(name = "subtotal", nullable = false, precision = 19, scale = 4)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
        @Column(name = "discount_type", nullable = false)
    @Builder.Default
    private DiscountType discountType = DiscountType.PERCENTAGE;

    @Builder.Default
    @Column(name = "discount_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "tax_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "freight_charges", precision = 19, scale = 4)
    private BigDecimal freightCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "other_charges", precision = 19, scale = 4)
    private BigDecimal otherCharges = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "round_off", precision = 19, scale = 4)
    private BigDecimal roundOff = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "place_of_supply_state_code", nullable = false, length = 10)
    private String placeOfSupplyStateCode;

    @Column(name = "billing_address_id")
    private UUID billingAddressId;

    @Column(name = "shipping_address_id")
    private UUID shippingAddressId;

    @Column(name = "payment_terms", columnDefinition = "text")
    private String paymentTerms;

    @Column(name = "delivery_terms", columnDefinition = "text")
    private String deliveryTerms;

    @Column(name = "warranty_terms", columnDefinition = "text")
    private String warrantyTerms;

    @Column(name = "terms_and_conditions", columnDefinition = "text")
    private String termsAndConditions;

    @Column(name = "internal_notes", columnDefinition = "text")
    private String internalNotes;

    @Column(name = "customer_notes", columnDefinition = "text")
    private String customerNotes;

    @Enumerated(EnumType.STRING)
        @Column(name = "status", nullable = false)
    @Builder.Default
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "workflow_transaction_id")
    private UUID workflowTransactionId;

    @Enumerated(EnumType.STRING)
        @Column(name = "approval_status", nullable = false)
    @Builder.Default
    private QuotationApprovalStatus approvalStatus = QuotationApprovalStatus.NONE;

    @Builder.Default
    @Column(name = "discount_approval_required", nullable = false)
    private Boolean discountApprovalRequired = false;

    @Column(name = "approved_by_user_id")
    private UUID approvedByUserId;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "account_main_quotation_id")
    private UUID accountMainQuotationId;

    @Column(name = "account_main_sales_order_id")
    private UUID accountMainSalesOrderId;
}
