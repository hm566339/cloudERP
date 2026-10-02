package com.erp.account.modules.gst.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.gst.enums.GstSupplyType;
import com.erp.account.modules.gst.enums.GstTaxType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "gst_output_tax")
public class GstOutputTax extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "branch_id")
    private UUID branchId;

    @Column(name = "invoice_id", nullable = false)
    private UUID invoiceId;

    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;

    @Column(name = "invoice_date")
    private LocalDate invoiceDate;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_gstin", length = 15)
    private String customerGstin;

    @Enumerated(EnumType.STRING)
    @Column(name = "supply_type", nullable = false)
    private GstSupplyType supplyType;

    @Column(name = "hsn_sac_code", length = 20)
    private String hsnSacCode;

    @Column(name = "taxable_value", precision = 19, scale = 4)
    private BigDecimal taxableValue;

    @Column(name = "gst_rate", precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;

    @Column(name = "total_tax_amount", precision = 19, scale = 4)
    private BigDecimal totalTaxAmount;

    @Column(name = "is_reverse_charge")
    private boolean isReverseCharge;

    @Column(name = "is_filed")
    private boolean isFiled;
}
