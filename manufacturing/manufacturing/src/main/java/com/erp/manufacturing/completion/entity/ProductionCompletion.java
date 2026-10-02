package com.erp.manufacturing.completion.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.CompletionStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_completion", uniqueConstraints = {
    @UniqueConstraint(name = "uk_production_completion_company_idempotency",
        columnNames = {"company_id", "idempotency_key"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionCompletion extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "completion_no", nullable = false) private String completionNo;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @Column(name = "completion_date", nullable = false) private LocalDateTime completionDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private CompletionStatus status;
    @Column(columnDefinition = "text") private String remarks;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @Column(name = "inventory_movement_id") private UUID inventoryMovementId;
    @Column(name = "completed_by") private UUID completedBy;
    @Column(name = "completed_at") private LocalDateTime completedAt;
}
