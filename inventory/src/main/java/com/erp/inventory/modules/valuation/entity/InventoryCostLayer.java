package com.erp.inventory.modules.valuation.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inventory_cost_layer")
public class InventoryCostLayer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "source_movement_id")
    private UUID sourceMovementId;

    @Column(name = "source_movement_line_id")
    private UUID sourceMovementLineId;

    @Column(name = "received_quantity")
    private BigDecimal receivedQuantity;

    @Column(name = "remaining_quantity")
    private BigDecimal remainingQuantity;

    @Column(name = "unit_cost", precision = 19, scale = 4, nullable = false)
    private java.math.BigDecimal unitCost;

    @Version
    @Column(name = "version")
    private Integer version;

    @Column(name = "total_cost")
    private BigDecimal totalCost;

    @Column(name = "consumed_cost")
    private BigDecimal consumedCost;

}
