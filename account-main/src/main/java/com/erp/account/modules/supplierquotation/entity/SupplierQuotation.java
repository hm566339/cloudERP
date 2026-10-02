package com.erp.account.modules.supplierquotation.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;
import java.util.*;

@Entity
@Table(name = "supplier_quotation", indexes = { @Index(name = "idx_sq_company", columnList = "company_id"),
        @Index(name = "idx_sq_rfq", columnList = "rfq_id"), @Index(name = "idx_sq_vendor", columnList = "vendor_id"),
        @Index(name = "idx_sq_status", columnList = "status") }, uniqueConstraints = @UniqueConstraint(name = "uk_sq_rfq_vendor", columnNames = {
                "rfq_id", "vendor_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierQuotation extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Version
    private Long version;
    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;
    @Column(name = "quotation_number", nullable = false, length = 50)
    private String quotationNumber;
    @Column(name = "rfq_id", nullable = false)
    private UUID rfqId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", insertable = false, updatable = false)
    private Rfq rfq;
    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;
    @Column(name = "quotation_date", nullable = false)
    private LocalDate quotationDate;
    @Column(name = "valid_until")
    private LocalDate validUntil;
    @Column(name = "delivery_terms", columnDefinition = "TEXT")
    private String deliveryTerms;
    @Column(name = "payment_terms", columnDefinition = "TEXT")
    private String paymentTerms;
    @Column(name = "freight", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal freight = BigDecimal.ZERO;
    @Column(name = "discount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;
    @Column(name = "taxable_amount", precision = 19, scale = 4)
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
    @Column(name = "tax_amount", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(name = "grand_total", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal grandTotal = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private SupplierQuotationStatus status = SupplierQuotationStatus.DRAFT;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    @Column(name = "awarded_by")
    private UUID awardedBy;
    @Column(name = "awarded_at")
    private LocalDateTime awardedAt;
    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SupplierQuotationItem> items = new ArrayList<>();

    public void addItem(SupplierQuotationItem item) {
        items.add(item);
        item.setQuotation(this);
        item.setCompanyId(companyId);
    }

    public void calculateTotals() {
        taxableAmount = BigDecimal.ZERO;
        cgstAmount = BigDecimal.ZERO;
        sgstAmount = BigDecimal.ZERO;
        igstAmount = BigDecimal.ZERO;
        cessAmount = BigDecimal.ZERO;
        taxAmount = BigDecimal.ZERO;
        for (SupplierQuotationItem i : items) {
            i.calculateAmounts();
            taxableAmount = taxableAmount.add(i.getTaxableAmount());
            cgstAmount = cgstAmount.add(i.getCgstAmount());
            sgstAmount = sgstAmount.add(i.getSgstAmount());
            igstAmount = igstAmount.add(i.getIgstAmount());
            cessAmount = cessAmount.add(i.getCessAmount());
            taxAmount = taxAmount.add(i.getTaxAmount());
        }
        BigDecimal gross = taxableAmount.add(taxAmount).add(freight == null ? BigDecimal.ZERO : freight);
        grandTotal = gross.subtract(discount == null ? BigDecimal.ZERO : discount).setScale(4, RoundingMode.HALF_UP);
    }
}
