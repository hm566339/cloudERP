package com.erp.account.modules.rfq.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.purchaserequisition.entity.PurchaseRequisition;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "rfq", indexes = {
    @Index(name = "idx_rfq_company", columnList = "company_id"),
    @Index(name = "idx_rfq_status", columnList = "status"),
    @Index(name = "idx_rfq_number", columnList = "rfq_number", unique = true)
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rfq extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    private Long version;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "rfq_number", nullable = false, length = 50)
    private String rfqNumber;

    @Column(name = "purchase_requisition_id", nullable = false)
    private UUID purchaseRequisitionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchase_requisition_id", insertable = false, updatable = false)
    private PurchaseRequisition purchaseRequisition;

    public String getPrNumber() {
        if (this.purchaseRequisition != null) {
            return this.purchaseRequisition.getRequisitionNumber();
        }
        return null;
    }

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "quotation_deadline")
    private LocalDate quotationDeadline;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "terms", columnDefinition = "TEXT")
    private String terms;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private RfqStatus status = RfqStatus.DRAFT;

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<RfqItem> items = new HashSet<>();

    @OneToMany(mappedBy = "rfq", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<RfqVendor> vendors = new HashSet<>();

    public void addItem(RfqItem item) {
        items.add(item);
        item.setRfq(this);
        item.setCompanyId(companyId);
    }

    public void addVendor(RfqVendor vendor) {
        vendors.add(vendor);
        vendor.setRfq(this);
        vendor.setCompanyId(companyId);
    }
}
