package com.erp.account.modules.appayment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.common.entity.BaseEntity;


@Entity
@Table(name = "ap_payment_allocation", indexes = {
    @Index(name = "idx_ap_payment_allocation_payment", columnList = "ap_payment_id"),
    @Index(name = "idx_ap_payment_allocation_invoice", columnList = "ap_invoice_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApPaymentAllocation extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_payment_id", nullable = false)
    private ApPayment apPayment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ap_invoice_id", nullable = false)
    private ApInvoice apInvoice;

    @Column(name = "allocated_amount", precision = 19, scale = 4)
    private BigDecimal allocatedAmount;
}
