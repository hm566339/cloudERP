package com.erp.manufacturing.productionorder.entity;

import com.erp.manufacturing.bom.entity.*;
import com.erp.manufacturing.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "production_order_bom_snapshot")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionOrderBomSnapshot extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_id", nullable = false) private Bom bom;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_revision_id", nullable = false) private BomRevision bomRevision;
    @Column(name = "bom_number", nullable = false) private String bomNumber;
    @Column(name = "revision_number", nullable = false) private Integer revisionNumber;
    @Column(name = "revision_label") private String revisionLabel;
    @Column(name = "finished_product_id", nullable = false) private UUID finishedProductId;
    @Column(name = "snapshot_created_at", nullable = false) private LocalDateTime snapshotCreatedAt;
}
