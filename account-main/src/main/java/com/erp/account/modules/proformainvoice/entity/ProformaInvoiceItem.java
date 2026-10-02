package com.erp.account.modules.proformainvoice.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.quotation.entity.QuotationItem;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "proforma_invoice_item", indexes = {
        @Index(name = "idx_pi_item_pi", columnList = "proforma_invoice_id"),
        @Index(name = "idx_pi_item_company", columnList = "company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProformaInvoiceItem extends BaseEntity implements Serializable {

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
    @JoinColumn(name = "proforma_invoice_id", nullable = false)
    private ProformaInvoice proformaInvoice;

    @Column(name = "source_quotation_item_id", nullable = true, updatable = false)
    private UUID sourceQuotationItemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "source_quotation_item_id", insertable = false, updatable = false)
    private QuotationItem sourceQuotationItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hsn_sac_id")
    private HsnSacMaster hsnSacMaster;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal quantity;
    
    @Column(name = "converted_quantity", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal convertedQuantity = BigDecimal.ZERO;
    
    @Column(name = "remaining_quantity", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal remainingQuantity = BigDecimal.ZERO;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", precision = 19, scale = 4, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    @Column(name = "discount_amount", precision = 19, scale = 4)
    private BigDecimal discountAmount;

    @Column(name = "taxable_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxableAmount;

    // Tax Details
    @Column(name = "cgst_rate", precision = 5, scale = 2)
    private BigDecimal cgstRate;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_rate", precision = 5, scale = 2)
    private BigDecimal sgstRate;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_rate", precision = 5, scale = 2)
    private BigDecimal igstRate;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_rate", precision = 5, scale = 2)
    private BigDecimal cessRate;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "tax_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;



    public void calculateDiscount() {
        if (quantity != null && unitPrice != null) {
            BigDecimal gross = quantity.multiply(unitPrice);
            if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
                this.discountAmount = gross.multiply(discountPercent)
                        .divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
            } else {
                this.discountAmount = BigDecimal.ZERO;
            }
        }
    }

    public void calculateLineAmount() {
        if (quantity != null && unitPrice != null) {
            BigDecimal gross = quantity.multiply(unitPrice);
            calculateDiscount();
            if (discountAmount == null) {
                discountAmount = BigDecimal.ZERO;
            }
            this.taxableAmount = gross.subtract(discountAmount).setScale(4, RoundingMode.HALF_UP);
        }
    }

    public void calculateTaxAmount() {
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
    
    public void calculateRemainingQuantity() {
        if (quantity != null) {
            BigDecimal converted = convertedQuantity != null ? convertedQuantity : BigDecimal.ZERO;
            this.remainingQuantity = quantity.subtract(converted);
            if (this.remainingQuantity.compareTo(BigDecimal.ZERO) < 0) {
                this.remainingQuantity = BigDecimal.ZERO;
            }
        }
    }

    @PrePersist
    @PreUpdate
    public void ensureDerivedAmounts() {
        if (getIsDeleted() == null) {
            setIsDeleted(false);
        }
        if (convertedQuantity == null) {
            convertedQuantity = BigDecimal.ZERO;
        }
        calculateLineAmount();
        calculateTaxAmount();
        calculateTotalAmount();
        calculateRemainingQuantity();
        
        if (convertedQuantity.compareTo(quantity) > 0) {
            throw new IllegalStateException("Converted quantity cannot exceed PI item quantity");
        }
    }
}
