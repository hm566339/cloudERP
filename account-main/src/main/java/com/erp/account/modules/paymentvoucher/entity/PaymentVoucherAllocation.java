package com.erp.account.modules.paymentvoucher.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.common.entity.BaseEntity;
import java.util.UUID;

@Entity
@Table(name = "payment_voucher_allocation", indexes = {
        @Index(name = "idx_payment_voucher_allocation_voucher", columnList = "payment_voucher_id"),
        @Index(name = "idx_payment_voucher_allocation_invoice", columnList = "ap_invoice_id"),
        @Index(name = "idx_payment_voucher_allocation_po", columnList = "purchase_order_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentVoucherAllocation extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_voucher_id", nullable = false)
    private PaymentVoucher paymentVoucher;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id")
    private ApInvoice apInvoice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id")
    private PurchaseOrder purchaseOrder;

    @Column(name = "allocated_amount", precision = 19, scale = 4, nullable = false)
    private BigDecimal allocatedAmount;
}
