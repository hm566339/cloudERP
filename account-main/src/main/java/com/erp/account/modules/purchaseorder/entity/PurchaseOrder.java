package com.erp.account.modules.purchaseorder.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.supplierquotation.entity.SupplierQuotation;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_order", indexes = {
        @Index(name = "idx_po_company", columnList = "company_id"),
        @Index(name = "idx_po_vendor", columnList = "vendor_id"),
        @Index(name = "idx_po_number", columnList = "po_number", unique = true),
        @Index(name = "idx_po_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder extends BaseEntity implements Serializable {

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

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;

    @Column(name = "po_number", nullable = false, length = 50)
    private String poNumber;

    @Column(name = "po_date", nullable = false)
    private LocalDate poDate;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "currency", length = 3, nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "exchange_rate", precision = 19, scale = 6, nullable = false)
    @Builder.Default
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(name = "place_of_supply_state_id")
    private UUID placeOfSupplyStateId;

    @Column(name = "place_of_supply_state_code", length = 10)
    private String placeOfSupplyStateCode;

    // Vendor Address Snapshot
    @Column(name = "vendor_address_id")
    private UUID vendorAddressId;

    @Column(name = "purchase_address_line1")
    private String purchaseAddressLine1;

    @Column(name = "purchase_address_line2")
    private String purchaseAddressLine2;

    @Column(name = "purchase_city", length = 100)
    private String purchaseCity;

    @Column(name = "purchase_state", length = 100)
    private String purchaseState;

    @Column(name = "purchase_country", length = 100)
    private String purchaseCountry;

    @Column(name = "purchase_postal_code", length = 20)
    private String purchasePostalCode;

    @Column(name = "shipping_address_snapshot", columnDefinition = "TEXT")
    private String shippingAddressSnapshot;

    // Commercial Terms & Notes
    @Column(name = "reference_number", length = 100)
    private String referenceNumber;

    @Column(name = "supplier_quotation_id")
    private UUID supplierQuotationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_quotation_id", insertable = false, updatable = false)
    private SupplierQuotation supplierQuotation;

    @Column(name = "rfq_id")
    private UUID rfqId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", insertable = false, updatable = false)
    private Rfq rfq;

    @Column(name = "purchase_requisition_id")
    private UUID purchaseRequisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_requisition_id", insertable = false, updatable = false)
    private PurchaseRequisition purchaseRequisition;

    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;

    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;

    @Column(name = "terms_and_conditions", columnDefinition = "TEXT")
    private String termsAndConditions;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // Advance Payment Tracking
    @Column(name = "advance_required")
    @Builder.Default
    private Boolean advanceRequired = false;

    @Column(name = "advance_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal advanceAmount = BigDecimal.ZERO;

    @Column(name = "advance_paid_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal advancePaidAmount = BigDecimal.ZERO;

    // Totals
    @Column(name = "subtotal", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "taxable_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cessAmount = BigDecimal.ZERO;

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

    // Status and Workflow
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "cancelled_reason", columnDefinition = "TEXT")
    private String cancelledReason;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PurchaseOrderItem> items = new ArrayList<>();

    public void addPurchaseOrderItem(PurchaseOrderItem item) {
        items.add(item);
        item.setPurchaseOrder(this);
        item.setCompanyId(this.companyId);
    }

    public void removePurchaseOrderItem(PurchaseOrderItem item) {
        items.remove(item);
        item.setPurchaseOrder(null);
    }

    public void calculateTotals() {
        BigDecimal calcSubtotal = BigDecimal.ZERO;
        BigDecimal calcDiscountAmount = BigDecimal.ZERO;
        BigDecimal calcTaxableAmount = BigDecimal.ZERO;
        BigDecimal calcCgst = BigDecimal.ZERO;
        BigDecimal calcSgst = BigDecimal.ZERO;
        BigDecimal calcIgst = BigDecimal.ZERO;
        BigDecimal calcCess = BigDecimal.ZERO;
        BigDecimal calcTaxAmount = BigDecimal.ZERO;

        for (PurchaseOrderItem item : items) {
            item.ensureDerivedAmounts();
            if (item.getOrderedQuantity() != null && item.getUnitPrice() != null) {
                calcSubtotal = calcSubtotal.add(item.getOrderedQuantity().multiply(item.getUnitPrice()));
            }
            if (item.getDiscountAmount() != null) {
                calcDiscountAmount = calcDiscountAmount.add(item.getDiscountAmount());
            }
            if (item.getTaxableAmount() != null) {
                calcTaxableAmount = calcTaxableAmount.add(item.getTaxableAmount());
            }
            if (item.getCgstAmount() != null) {
                calcCgst = calcCgst.add(item.getCgstAmount());
            }
            if (item.getSgstAmount() != null) {
                calcSgst = calcSgst.add(item.getSgstAmount());
            }
            if (item.getIgstAmount() != null) {
                calcIgst = calcIgst.add(item.getIgstAmount());
            }
            if (item.getCessAmount() != null) {
                calcCess = calcCess.add(item.getCessAmount());
            }
            if (item.getTaxAmount() != null) {
                calcTaxAmount = calcTaxAmount.add(item.getTaxAmount());
            }
        }

        this.subtotal = calcSubtotal.setScale(4, RoundingMode.HALF_UP);
        this.discountAmount = calcDiscountAmount.setScale(4, RoundingMode.HALF_UP);
        this.taxableAmount = calcTaxableAmount.setScale(4, RoundingMode.HALF_UP);
        this.cgstAmount = calcCgst.setScale(4, RoundingMode.HALF_UP);
        this.sgstAmount = calcSgst.setScale(4, RoundingMode.HALF_UP);
        this.igstAmount = calcIgst.setScale(4, RoundingMode.HALF_UP);
        this.cessAmount = calcCess.setScale(4, RoundingMode.HALF_UP);
        this.taxAmount = calcTaxAmount.setScale(4, RoundingMode.HALF_UP);

        BigDecimal freight = this.freightCharges != null ? this.freightCharges : BigDecimal.ZERO;
        BigDecimal other = this.otherCharges != null ? this.otherCharges : BigDecimal.ZERO;
        BigDecimal rawTotal = this.taxableAmount.add(this.taxAmount).add(freight).add(other);

        this.totalBeforeRoundOff = rawTotal.setScale(4, RoundingMode.HALF_UP);
        BigDecimal rounded = rawTotal.setScale(2, RoundingMode.HALF_UP);
        this.roundOff = rounded.subtract(rawTotal.setScale(2, RoundingMode.DOWN)).setScale(4, RoundingMode.HALF_UP);
        this.totalAmount = rounded.setScale(4, RoundingMode.HALF_UP);
    }
}
