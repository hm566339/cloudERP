package com.erp.account.modules.goodsreceipt.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "goods_receipt", indexes = {
        @Index(name = "idx_grn_company", columnList = "company_id"),
        @Index(name = "idx_grn_vendor", columnList = "vendor_id"),
        @Index(name = "idx_grn_po", columnList = "purchase_order_id"),
        @Index(name = "idx_grn_number", columnList = "grn_number", unique = true),
        @Index(name = "idx_grn_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceipt extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;

    @Column(name = "purchase_order_id", nullable = false)
    private UUID purchaseOrderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "grn_number", nullable = false, length = 50)
    private String grnNumber;

    @Column(name = "grn_date", nullable = false)
    private LocalDate grnDate;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "delivery_note_number", length = 100)
    private String deliveryNoteNumber;

    @Column(name = "delivery_note_date")
    private LocalDate deliveryNoteDate;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "transporter_name", length = 100)
    private String transporterName;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private GoodsReceiptStatus status = GoodsReceiptStatus.DRAFT;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "reversed_by")
    private UUID reversedBy;

    @Column(name = "reversed_at")
    private LocalDateTime reversedAt;

    @Column(name = "reversal_reason", length = 500)
    private String reversalReason;

    @OneToMany(mappedBy = "goodsReceipt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<GoodsReceiptItem> items = new ArrayList<>();

    public void addGoodsReceiptItem(GoodsReceiptItem item) {
        items.add(item);
        item.setGoodsReceipt(this);
        item.setCompanyId(this.companyId);
    }

    public void removeGoodsReceiptItem(GoodsReceiptItem item) {
        items.remove(item);
        item.setGoodsReceipt(null);
    }
}
