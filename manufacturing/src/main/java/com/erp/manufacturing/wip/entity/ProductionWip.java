package com.erp.manufacturing.wip.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.WipStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_wip")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionWip extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private WipStatus status;
    @Column(name = "started_at") private LocalDateTime startedAt;
    @Column(name = "completed_at") private LocalDateTime completedAt;
    @Column(name = "material_cost", nullable = false, precision = 19, scale = 4) private BigDecimal materialCost;
    @Column(name = "labor_cost", nullable = false, precision = 19, scale = 4) private BigDecimal laborCost;
    @Column(name = "machine_cost", nullable = false, precision = 19, scale = 4) private BigDecimal machineCost;
    @Column(name = "overhead_cost", nullable = false, precision = 19, scale = 4) private BigDecimal overheadCost;
    @Column(name = "total_wip_cost", nullable = false, precision = 19, scale = 4) private BigDecimal totalWipCost;
}
