package com.erp.account.modules.purchaseorder.entity;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "purchase_order_item", indexes = {
        @Index(name = "idx_po_item_po", columnList = "purchase_order_id"),
        @Index(name = "idx_po_item_company", columnList = "company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItem extends BaseEntity implements Serializable {

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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", nullable = false)
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hsn_sac_id")
    private HsnSacMaster hsnSacMaster;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    @Builder.Default
    private ItemType itemType = ItemType.PRODUCT;

    @Column(name = "ordered_quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal orderedQuantity;

    @Column(name = "received_quantity", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal receivedQuantity = BigDecimal.ZERO;

    @Column(name = "pending_quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal pendingQuantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", precision = 19, scale = 4, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercent = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "taxable_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Column(name = "cgst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cgstRate = BigDecimal.ZERO;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Column(name = "sgst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal sgstRate = BigDecimal.ZERO;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Column(name = "igst_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal igstRate = BigDecimal.ZERO;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Column(name = "cess_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cessRate = BigDecimal.ZERO;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal cessAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void calculateDiscount() {
        if (orderedQuantity != null && unitPrice != null) {
            BigDecimal gross = orderedQuantity.multiply(unitPrice);
            if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
                this.discountAmount = gross.multiply(discountPercent)
                        .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else if (discountAmount == null) {
                this.discountAmount = BigDecimal.ZERO;
            }
        }
    }

    public void calculateLineAmount() {
        if (orderedQuantity != null && unitPrice != null) {
            BigDecimal gross = orderedQuantity.multiply(unitPrice);
            calculateDiscount();
            if (discountAmount == null) {
                discountAmount = BigDecimal.ZERO;
            }
            this.taxableAmount = gross.subtract(discountAmount).setScale(4, RoundingMode.HALF_UP);
        }
    }

    public void calculateTaxAmount() {
        if (taxableAmount != null) {
            if (cgstRate != null && cgstRate.compareTo(BigDecimal.ZERO) > 0) {
                cgstAmount = taxableAmount.multiply(cgstRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else {
                cgstAmount = BigDecimal.ZERO;
            }
            if (sgstRate != null && sgstRate.compareTo(BigDecimal.ZERO) > 0) {
                sgstAmount = taxableAmount.multiply(sgstRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else {
                sgstAmount = BigDecimal.ZERO;
            }
            if (igstRate != null && igstRate.compareTo(BigDecimal.ZERO) > 0) {
                igstAmount = taxableAmount.multiply(igstRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else {
                igstAmount = BigDecimal.ZERO;
            }
            if (cessRate != null && cessRate.compareTo(BigDecimal.ZERO) > 0) {
                cessAmount = taxableAmount.multiply(cessRate).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else {
                cessAmount = BigDecimal.ZERO;
            }
        }

        BigDecimal cgst = cgstAmount != null ? cgstAmount : BigDecimal.ZERO;
        BigDecimal sgst = sgstAmount != null ? sgstAmount : BigDecimal.ZERO;
        BigDecimal igst = igstAmount != null ? igstAmount : BigDecimal.ZERO;
        BigDecimal cess = cessAmount != null ? cessAmount : BigDecimal.ZERO;
        this.taxAmount = cgst.add(sgst).add(igst).add(cess).setScale(4, RoundingMode.HALF_UP);
    }

    public void calculateTotalAmount() {
        if (taxableAmount != null && taxAmount != null) {
            this.totalAmount = taxableAmount.add(taxAmount).setScale(4, RoundingMode.HALF_UP);
        }
    }

    @PrePersist
    @PreUpdate
    public void ensureDerivedAmounts() {
        if (receivedQuantity == null) {
            receivedQuantity = BigDecimal.ZERO;
        }
        if (pendingQuantity == null && orderedQuantity != null) {
            pendingQuantity = orderedQuantity.subtract(receivedQuantity);
        }
        calculateLineAmount();
        calculateTaxAmount();
        calculateTotalAmount();
    }
}
