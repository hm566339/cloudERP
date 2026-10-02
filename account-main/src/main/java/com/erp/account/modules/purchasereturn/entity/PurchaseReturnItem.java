package com.erp.account.modules.purchasereturn.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "purchase_return_item", indexes = {
        @Index(name = "idx_pri_return", columnList = "purchase_return_id"),
        @Index(name = "idx_pri_grn_item", columnList = "goods_receipt_item_id"),
        @Index(name = "idx_pri_item", columnList = "item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseReturnItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_return_id", nullable = false)
    private PurchaseReturn purchaseReturn;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "goods_receipt_item_id")
    private UUID goodsReceiptItemId;

    @Column(name = "purchase_order_item_id")
    private UUID purchaseOrderItemId;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "returned_quantity", nullable = false, precision = 15, scale = 4)
    private BigDecimal returnedQuantity;

    @Column(name = "unit_price", precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "reason", length = 500)
    private String reason;
}
