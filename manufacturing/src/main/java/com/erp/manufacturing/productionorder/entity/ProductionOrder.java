package com.erp.manufacturing.productionorder.entity;

import com.erp.manufacturing.bom.entity.*;
import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "production_order")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionOrder extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "production_order_no", nullable = false) private String productionOrderNo;
    @Column(name = "finished_product_id", nullable = false) private UUID finishedProductId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_id", nullable = false) private Bom bom;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_revision_id", nullable = false) private BomRevision bomRevision;
    @Column(name = "warehouse_id", nullable = false) private UUID warehouseId;
    @Column(name = "production_location_id") private UUID productionLocationId;
    @Column(name = "planned_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal plannedQuantity;
    @Column(name = "produced_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal producedQuantity;
    @Column(name = "rejected_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal rejectedQuantity;
    @Column(name = "scrap_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal scrapQuantity;
    @Column(name = "remaining_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal remainingQuantity;
    @Column(name = "planned_start_date") private LocalDate plannedStartDate;
    @Column(name = "planned_end_date") private LocalDate plannedEndDate;
    @Column(name = "actual_start_date") private LocalDateTime actualStartDate;
    @Column(name = "actual_end_date") private LocalDateTime actualEndDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProductionOrderStatus status;
    private String priority;
    @Column(columnDefinition = "text") private String notes;
    @Column(name = "approved_by") private UUID approvedBy;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
    @Column(name = "released_by") private UUID releasedBy;
    @Column(name = "released_at") private LocalDateTime releasedAt;
    @Column(name = "completed_by") private UUID completedBy;
    @Column(name = "completed_at") private LocalDateTime completedAt;
    @Column(name = "cancelled_by") private UUID cancelledBy;
    @Column(name = "cancelled_at") private LocalDateTime cancelledAt;
}
