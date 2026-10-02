package com.erp.manufacturing.productionorder.entity;

import com.erp.manufacturing.bom.entity.BomItem;
import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ProductionMaterialStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_order_material")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionOrderMaterial extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "bom_item_id", nullable = false) private BomItem bomItem;
    @Column(name = "component_product_id", nullable = false) private UUID componentProductId;
    @Column(name = "planned_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal plannedQuantity;
    @Column(name = "reserved_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal reservedQuantity;
    @Column(name = "consumed_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal consumedQuantity;
    @Column(name = "returned_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal returnedQuantity;
    @Column(name = "wastage_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal wastageQuantity;
    @Column(name = "scrap_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal scrapQuantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "inventory_reservation_id") private UUID inventoryReservationId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProductionMaterialStatus status;
    @Column(name = "sequence_no", nullable = false) private Integer sequenceNo;
}
