package com.erp.account.modules.purchasereturn.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.vendor.entity.Vendor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_return", indexes = {
        @Index(name = "idx_pr_company", columnList = "company_id"),
        @Index(name = "idx_pr_grn", columnList = "goods_receipt_id"),
        @Index(name = "idx_pr_po", columnList = "purchase_order_id"),
        @Index(name = "idx_pr_vendor", columnList = "vendor_id"),
        @Index(name = "idx_pr_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseReturn extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "return_number", nullable = false, length = 50)
    private String returnNumber;

    @Column(name = "return_date", nullable = false)
    private LocalDate returnDate;

    @Column(name = "goods_receipt_id", nullable = false)
    private UUID goodsReceiptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goods_receipt_id", insertable = false, updatable = false)
    private GoodsReceipt goodsReceipt;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_order_id", insertable = false, updatable = false)
    private PurchaseOrder purchaseOrder;

    @Column(name = "vendor_id", nullable = false)
    private UUID vendorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", insertable = false, updatable = false)
    private Vendor vendor;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PurchaseReturnStatus status = PurchaseReturnStatus.DRAFT;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "subtotal", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    // --- Lifecycle Audit Fields (added by V1_31 migration) ---

    @Column(name = "confirmed_by")
    private UUID confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "cancelled_by")
    private UUID cancelledBy;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    // ── AP / Debit Note link ────────────────────────────────────────────────────

    /**
     * ID of the Debit Note raised against the vendor when this return is confirmed
     * and an active AP Invoice already exists for the underlying GRN.
     * Null when no linked invoice exists at confirmation time.
     */
    @Column(name = "debit_note_id")
    private UUID debitNoteId;

    // ── Items ───────────────────────────────────────────────────────────────────

    @OneToMany(mappedBy = "purchaseReturn", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseReturnItem> items = new ArrayList<>();

    public void addItem(PurchaseReturnItem item) {
        items.add(item);
        item.setPurchaseReturn(this);
    }
}
