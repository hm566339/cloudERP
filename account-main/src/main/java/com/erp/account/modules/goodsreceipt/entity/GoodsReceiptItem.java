package com.erp.account.modules.goodsreceipt.entity;

import com.erp.account.enums.ItemType;
import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderItem;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "goods_receipt_item", indexes = {
        @Index(name = "idx_grn_item_grn", columnList = "goods_receipt_id"),
        @Index(name = "idx_grn_item_po_item", columnList = "purchase_order_item_id"),
        @Index(name = "idx_grn_item_company", columnList = "company_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItem extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "goods_receipt_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    @Column(name = "purchase_order_item_id", nullable = false)
    private UUID purchaseOrderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_item_id", insertable = false, updatable = false)
    private PurchaseOrderItem purchaseOrderItem;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "unit", length = 50)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 20)
    @Builder.Default
    private ItemType itemType = ItemType.PRODUCT;

    @Column(name = "ordered_quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal orderedQuantity;

    @Column(name = "previously_received_quantity", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal previouslyReceivedQuantity = BigDecimal.ZERO;

    @Column(name = "received_quantity", precision = 19, scale = 4, nullable = false)
    private BigDecimal receivedQuantity;

    @Column(name = "accepted_quantity", precision = 19, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal acceptedQuantity = BigDecimal.ZERO;

    @Column(name = "returned_quantity", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal returnedQuantity = BigDecimal.ZERO;

    @Column(name = "rejected_quantity", precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal rejectedQuantity = BigDecimal.ZERO;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "pending_quantity", precision = 19, scale = 4)
    private BigDecimal pendingQuantity;

    public BigDecimal getNetAcceptedQuantity() {
        BigDecimal accepted = this.acceptedQuantity != null ? this.acceptedQuantity : BigDecimal.ZERO;
        BigDecimal returned = this.returnedQuantity != null ? this.returnedQuantity : BigDecimal.ZERO;
        return accepted.subtract(returned).max(BigDecimal.ZERO);
    }

    @Column(name = "unit_price", precision = 19, scale = 4)
    private BigDecimal unitPrice;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    @PreUpdate
    public void ensureQuantities() {
        if (acceptedQuantity == null && receivedQuantity != null) {
            BigDecimal rej = rejectedQuantity != null ? rejectedQuantity : BigDecimal.ZERO;
            acceptedQuantity = receivedQuantity.subtract(rej);
        }
        if (rejectedQuantity == null) {
            rejectedQuantity = BigDecimal.ZERO;
        }
    }
}
