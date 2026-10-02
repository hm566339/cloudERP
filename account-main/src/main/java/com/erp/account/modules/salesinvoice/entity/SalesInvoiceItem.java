package com.erp.account.modules.salesinvoice.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.util.Invoice;

/**
 * SalesInvoiceItem Entity
 * Represents line items in a Sales Invoice
 * Implements soft delete and comprehensive audit trail
 *
 * @author ERP System
 * @since 1.0.0
 */
@Entity
@Table(name = "sales_invoice_item", indexes = {
        @Index(name = "idx_sales_invoice_item_invoice", columnList = "sales_invoice_id"),
        @Index(name = "idx_sales_invoice_item_company", columnList = "company_id"),
        @Index(name = "idx_sales_invoice_item_hsn", columnList = "hsn_sac_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesInvoiceItem extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /**
     * Multi-company support: company_id is mandatory and immutable
     */
    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    /**
     * Parent sales invoice reference
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_invoice_id", nullable = false)
    private SalesInvoice salesInvoice;

    /**
     * HSN/SAC code for tax classification
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hsn_sac_id")
    private HsnSacMaster hsnSacMaster;

    /**
     * Item details
     */
    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Quantity with 4 decimal places
     */
    @Column(name = "quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal quantity;

    /**
     * Unit price with 4 decimal places
     */
    @Column(name = "unit_price", precision = 19, scale = 4, nullable = false)
    private BigDecimal unitPrice;

    /**
     * Discount percentage (0-100)
     */
    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    /**
     * Discount amount in currency
     */
    @Column(name = "discount_amount", precision = 19, scale = 4)
    private BigDecimal discountAmount;

    /**
     * Discounted amount before tax: (quantity * unit_price) - discount_amount
     */
    @Column(name = "discounted_amount", precision = 19, scale = 4)
    private BigDecimal discountedAmount;

    /**
     * Taxable amount: equals discounted_amount
     */
    @Column(name = "taxable_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxableAmount;

    /**
     * Tax amount (GST)
     */
    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxAmount;

    /**
     * Total amount: taxable_amount + tax_amount
     */
    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal totalAmount;

    /**
     * GST breakdown for detailed reporting
     */
    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    /**
     * Line-level notes
     */
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    /**
     * Helper method to calculate total amount
     */
    public void calculateTotalAmount() {
        if (this.taxableAmount != null && this.taxAmount != null) {
            this.totalAmount = this.taxableAmount.add(this.taxAmount).setScale(4, RoundingMode.HALF_UP);
        } else if (this.taxableAmount != null) {
            this.totalAmount = this.taxableAmount.setScale(4, RoundingMode.HALF_UP);
        }
    }

    /**
     * Helper method to calculate line discount and taxable amount
     */
    public void calculateLineAmount() {
        if (this.quantity != null && this.unitPrice != null) {
            BigDecimal gross = this.quantity.multiply(this.unitPrice).setScale(4, RoundingMode.HALF_UP);
            BigDecimal discPct = this.discountPercentage != null ? this.discountPercentage : BigDecimal.ZERO;
            BigDecimal discAmt = BigDecimal.ZERO;

            if (discPct.compareTo(BigDecimal.ZERO) > 0) {
                discAmt = gross.multiply(discPct).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else if (this.discountAmount != null && this.discountAmount.compareTo(BigDecimal.ZERO) > 0) {
                discAmt = this.discountAmount.setScale(4, RoundingMode.HALF_UP);
                if (gross.compareTo(BigDecimal.ZERO) > 0) {
                    discPct = discAmt.multiply(new BigDecimal("100")).divide(gross, 2, RoundingMode.HALF_UP);
                }
            }

            this.discountPercentage = discPct;
            this.discountAmount = discAmt;
            BigDecimal discounted = gross.subtract(discAmt).setScale(4, RoundingMode.HALF_UP);
            if (discounted.compareTo(BigDecimal.ZERO) < 0) {
                discounted = BigDecimal.ZERO;
            }
            this.discountedAmount = discounted;
            this.taxableAmount = discounted;
        }
    }

    @PrePersist
    @PreUpdate
    public void ensureDerivedAmounts() {
        if (this.taxableAmount == null && this.quantity != null && this.unitPrice != null) {
            calculateLineAmount();
        }
        if (this.taxableAmount != null && this.taxAmount != null) {
            this.totalAmount = this.taxableAmount.add(this.taxAmount)
                    .setScale(4, RoundingMode.HALF_UP);
        }
    }
}
