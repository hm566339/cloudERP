package com.erp.account.modules.purchaserequisition.entity;

import com.erp.account.modules.common.entity.BaseEntity;
import com.erp.account.modules.company.entity.Company;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "purchase_requisition", indexes = {
        @Index(name = "idx_prq_company", columnList = "company_id"),
        @Index(name = "idx_prq_status", columnList = "status"),
        @Index(name = "idx_prq_number", columnList = "requisition_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseRequisition extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "company_id", nullable = false, updatable = false)
    private UUID companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @Column(name = "requisition_number", nullable = false, length = 50)
    private String requisitionNumber;

    public String getPrNumber() {
        return this.requisitionNumber;
    }

    public void setPrNumber(String prNumber) {
        this.requisitionNumber = prNumber;
    }
    @Column(name = "requester_id")
    private UUID requesterId;
    @Column(name = "requisition_name", length = 255)
    private String requisitionName;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(name = "cost_center_id")
    private UUID costCenterId;
    @Column(name = "required_date", nullable = false)
    private LocalDate requiredDate;
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private String priority = "NORMAL";
    @Column(name = "purpose", columnDefinition = "TEXT")
    private String purpose;
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PurchaseRequisitionStatus status = PurchaseRequisitionStatus.DRAFT;
    @Column(name = "submitted_by")
    private UUID submittedBy;
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    @Column(name = "approved_by")
    private UUID approvedBy;
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;
    @Column(name = "rejected_by")
    private UUID rejectedBy;
    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
    @Column(name = "cancelled_by")
    private UUID cancelledBy;
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @OneToMany(mappedBy = "purchaseRequisition", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PurchaseRequisitionItem> items = new ArrayList<>();

    public void addItem(PurchaseRequisitionItem item) {
        items.add(item);
        item.setPurchaseRequisition(this);
        item.setCompanyId(companyId);
    }
}
