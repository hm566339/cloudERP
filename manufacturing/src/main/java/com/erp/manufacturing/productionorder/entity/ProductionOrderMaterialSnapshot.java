package com.erp.manufacturing.productionorder.entity;

import com.erp.manufacturing.bom.entity.BomItem;
import com.erp.manufacturing.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_order_material_snapshot")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionOrderMaterialSnapshot extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @Column(name = "production_order_id", nullable = false) private UUID productionOrderId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_bom_snapshot_id", nullable = false) private ProductionOrderBomSnapshot productionOrderBomSnapshot;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_item_id", nullable = false) private BomItem bomItem;
    @Column(name = "component_product_id", nullable = false) private UUID componentProductId;
    @Column(nullable = false, precision = 19, scale = 6) private BigDecimal quantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "scrap_percentage", nullable = false, precision = 9, scale = 4) private BigDecimal scrapPercentage;
    @Column(name = "wastage_percentage", nullable = false, precision = 9, scale = 4) private BigDecimal wastagePercentage;
    @Column(name = "sequence_no", nullable = false) private Integer sequenceNo;
    @Column(name = "is_optional", nullable = false) private Boolean isOptional;
}
