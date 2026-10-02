package com.erp.account.modules.supplierquotation.entity;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name="supplier_quotation_item",indexes={@Index(name="idx_sqi_quotation",columnList="quotation_id"),@Index(name="idx_sqi_company",columnList="company_id")})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SupplierQuotationItem extends BaseEntity {
 @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
 @Column(name="company_id",nullable=false,updatable=false) private UUID companyId;
 @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="quotation_id",nullable=false) private SupplierQuotation quotation;
 @Column(name="item_id") private UUID itemId; @Column(name="item_name",nullable=false) private String itemName; @Column(name="description",columnDefinition="TEXT") private String description;
 @Enumerated(EnumType.STRING) @Column(name="item_type",length=20) private ItemType itemType;
 @Column(name="quantity",nullable=false,precision=19,scale=4) private BigDecimal quantity; @Column(name="unit",length=50) private String unit; @Column(name="unit_price",nullable=false,precision=19,scale=4) private BigDecimal unitPrice;
 @Column(name="discount",precision=19,scale=4) @Builder.Default private BigDecimal discount=BigDecimal.ZERO; @Column(name="taxable_amount",precision=19,scale=4) @Builder.Default private BigDecimal taxableAmount=BigDecimal.ZERO;
 @Column(name="cgst_rate",precision=5,scale=2) @Builder.Default private BigDecimal cgstRate=BigDecimal.ZERO; @Column(name="cgst_amount",precision=19,scale=4) @Builder.Default private BigDecimal cgstAmount=BigDecimal.ZERO;
 @Column(name="sgst_rate",precision=5,scale=2) @Builder.Default private BigDecimal sgstRate=BigDecimal.ZERO; @Column(name="sgst_amount",precision=19,scale=4) @Builder.Default private BigDecimal sgstAmount=BigDecimal.ZERO;
 @Column(name="igst_rate",precision=5,scale=2) @Builder.Default private BigDecimal igstRate=BigDecimal.ZERO; @Column(name="igst_amount",precision=19,scale=4) @Builder.Default private BigDecimal igstAmount=BigDecimal.ZERO;
 @Column(name="cess_rate",precision=5,scale=2) @Builder.Default private BigDecimal cessRate=BigDecimal.ZERO; @Column(name="cess_amount",precision=19,scale=4) @Builder.Default private BigDecimal cessAmount=BigDecimal.ZERO;
 @Column(name="tax_amount",precision=19,scale=4) @Builder.Default private BigDecimal taxAmount=BigDecimal.ZERO; @Column(name="total",precision=19,scale=4) @Builder.Default private BigDecimal total=BigDecimal.ZERO;
 @Column(name="delivery_date") private LocalDate deliveryDate; @Column(name="hsn_sac_id") private UUID hsnSacId;
 public void calculateAmounts(){if(quantity==null||unitPrice==null)throw new IllegalArgumentException("Quotation quantity and price are required");BigDecimal gross=quantity.multiply(unitPrice);BigDecimal d=discount==null?BigDecimal.ZERO:discount;taxableAmount=gross.subtract(d).setScale(4,RoundingMode.HALF_UP);cgstAmount=taxableAmount.multiply(cgstRate==null?BigDecimal.ZERO:cgstRate).divide(BigDecimal.valueOf(100),4,RoundingMode.HALF_UP);sgstAmount=taxableAmount.multiply(sgstRate==null?BigDecimal.ZERO:sgstRate).divide(BigDecimal.valueOf(100),4,RoundingMode.HALF_UP);igstAmount=taxableAmount.multiply(igstRate==null?BigDecimal.ZERO:igstRate).divide(BigDecimal.valueOf(100),4,RoundingMode.HALF_UP);cessAmount=taxableAmount.multiply(cessRate==null?BigDecimal.ZERO:cessRate).divide(BigDecimal.valueOf(100),4,RoundingMode.HALF_UP);taxAmount=cgstAmount.add(sgstAmount).add(igstAmount).add(cessAmount);total=taxableAmount.add(taxAmount);}
}
