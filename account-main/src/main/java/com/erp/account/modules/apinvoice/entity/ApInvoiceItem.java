package com.erp.account.modules.apinvoice.entity;

import jakarta.persistence.*;
import lombok.*;


import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;


@Entity
@Table(name = "ap_invoice_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApInvoiceItem extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id", nullable = false)
    private ApInvoice apInvoice;

    @Column(name = "item_id")
    private UUID itemId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type")
    private com.erp.account.enums.ItemType itemType;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "unit")
    private String unit;

    @Column(name = "description")
    private String description;

    @Column(name = "quantity", precision = 19, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "taxable_amount", precision = 19, scale = 4)
    private BigDecimal taxableAmount;

    @Column(name = "tax_amount", precision = 19, scale = 4)
    private BigDecimal taxAmount;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "expense_account_id")
    private UUID expenseAccountId;

    @Column(name = "itc_eligibility")
    private String itcEligibility;

    @Column(name = "reversal_type")
    private String reversalType;

    @Column(name = "reversal_reason")
    private String reversalReason;

    @Column(name = "is_common_credit")
    private Boolean isCommonCredit = false;

    @Column(name = "exempt_supply", precision = 19, scale = 4)
    private BigDecimal exemptSupply = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 19, scale = 4)
    private BigDecimal totalAmount;

    @Column(name = "hsn_sac_id")
    private UUID hsnSacId;
}


