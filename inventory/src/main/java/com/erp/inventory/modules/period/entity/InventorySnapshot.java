package com.erp.inventory.modules.period.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "inventory_snapshot")
public class InventorySnapshot extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "snapshot_scope")
    private String snapshotScope;

    @Column(name = "snapshot_date")
    private LocalDateTime snapshotDate;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "reserved_quantity")
    private BigDecimal reservedQuantity;

    @Column(name = "available_quantity")
    private BigDecimal availableQuantity;

    @Column(name = "average_cost")
    private BigDecimal averageCost;

    @Column(name = "stock_value")
    private BigDecimal stockValue;

}
