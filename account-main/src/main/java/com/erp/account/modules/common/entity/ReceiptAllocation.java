package com.erp.account.modules.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.proformainvoice.entity.ProformaInvoice;


@Entity
@Table(name = "receipt_allocation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptAllocation extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "receipt_voucher_id", insertable = false, updatable = false)
    private UUID receiptVoucherId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "receipt_voucher_id", nullable = false)
    private ReceiptVoucher receiptVoucher;

    @Column(name = "sales_invoice_id", insertable = false, updatable = false)
    private UUID salesInvoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_invoice_id")
    private SalesInvoice salesInvoice;

    @Column(name = "proforma_invoice_id", insertable = false, updatable = false)
    private UUID proformaInvoiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proforma_invoice_id")
    private ProformaInvoice proformaInvoice;

    @Column(name = "allocated_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal allocatedAmount;

    public UUID getSalesInvoiceId() {
        if (salesInvoice != null) {
            return salesInvoice.getId();
        }
        return salesInvoiceId;
    }

    public UUID getProformaInvoiceId() {
        if (proformaInvoice != null) {
            return proformaInvoice.getId();
        }
        return proformaInvoiceId;
    }

    public UUID getReceiptVoucherId() {
        if (receiptVoucher != null) {
            return receiptVoucher.getId();
        }
        return receiptVoucherId;
    }

    public void setSalesInvoice(SalesInvoice salesInvoice) {
        this.salesInvoice = salesInvoice;
        this.salesInvoiceId = salesInvoice != null ? salesInvoice.getId() : null;
    }

    public void setProformaInvoice(ProformaInvoice proformaInvoice) {
        this.proformaInvoice = proformaInvoice;
        this.proformaInvoiceId = proformaInvoice != null ? proformaInvoice.getId() : null;
    }

    public void setReceiptVoucher(ReceiptVoucher receiptVoucher) {
        this.receiptVoucher = receiptVoucher;
        this.receiptVoucherId = receiptVoucher != null ? receiptVoucher.getId() : null;
    }

    @PrePersist
    @PreUpdate
    public void syncKeys() {
        if (this.salesInvoice != null) {
            this.salesInvoiceId = this.salesInvoice.getId();
        }
        if (this.proformaInvoice != null) {
            this.proformaInvoiceId = this.proformaInvoice.getId();
        }
        if (this.receiptVoucher != null) {
            this.receiptVoucherId = this.receiptVoucher.getId();
        }
    }
}
