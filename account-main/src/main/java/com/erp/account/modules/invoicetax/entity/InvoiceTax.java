package com.erp.account.modules.invoicetax.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;


@Entity
@Table(name = "invoice_tax")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceTax extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sales_invoice_id", nullable = false)
    private SalesInvoice salesInvoice;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "gst_slab_id", nullable = false)
    private GstSlab gstSlab;

    @Column(name = "taxable_amount", precision = 19, scale = 4)
    private BigDecimal taxableAmount;

    @Column(name = "cgst_amount", precision = 19, scale = 4)
    private BigDecimal cgstAmount;

    @Column(name = "sgst_amount", precision = 19, scale = 4)
    private BigDecimal sgstAmount;

    @Column(name = "igst_amount", precision = 19, scale = 4)
    private BigDecimal igstAmount;

    @Column(name = "cess_amount", precision = 19, scale = 4)
    private BigDecimal cessAmount;
}


