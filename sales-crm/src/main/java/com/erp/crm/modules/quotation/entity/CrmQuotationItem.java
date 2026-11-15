package com.erp.crm.modules.quotation.entity;

import com.erp.crm.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "crm_quotation_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmQuotationItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "quotation_id", nullable = false)
    private UUID quotationId;

    @Builder.Default
    @Column(name = "item_order", nullable = false)
    private Integer itemOrder = 1;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "product_code", length = 100)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "hsn_sac_code", nullable = false, length = 20)
    private String hsnSacCode;

    @Column(name = "description", columnDefinition = "text")
    private String description;

    @Builder.Default
    @Column(name = "quantity", nullable = false, precision = 19, scale = 4)
    private BigDecimal quantity = new BigDecimal("1.0000");

    @Builder.Default
    @Column(name = "uom", nullable = false, length = 50)
    private String uom = "PCS";

    @Builder.Default
    @Column(name = "unit_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal discountPct = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "discount_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "taxable_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cgst_rate", precision = 5, scale = 2)
    private BigDecimal cgstRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "sgst_rate", precision = 5, scale = 2)
    private BigDecimal sgstRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "igst_rate", precision = 5, scale = 2)
    private BigDecimal igstRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cess_rate", precision = 5, scale = 2)
    private BigDecimal cessRate = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "total_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal totalAmount = BigDecimal.ZERO;
}

