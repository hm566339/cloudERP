package com.erp.inventory.modules.stock.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
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
@Table(name = "inventory_stock")
public class InventoryStock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "batch_id")
    private UUID batchId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "warehouse_id", insertable = false, updatable = false)
    private Warehouse warehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id", insertable = false, updatable = false)
    private WarehouseLocation location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", insertable = false, updatable = false)
    private ProductBatch batch;

    @Column(name = "quantity", precision = 19, scale = 6, nullable = false)
    private BigDecimal quantity;

    @Column(name = "reserved_quantity", precision = 19, scale = 6, nullable = false)
    private BigDecimal reservedQuantity;

    @Column(name = "available_quantity", precision = 19, scale = 6, nullable = false)
    private BigDecimal availableQuantity;

    @Column(name = "average_cost", precision = 19, scale = 6)
    private BigDecimal averageCost;

    @Column(name = "stock_value", precision = 19, scale = 6)
    private BigDecimal stockValue;

    @Column(name = "last_movement_at")
    private LocalDateTime lastMovementAt;

    @Version
    @Column(name = "version")
    private Long version;
}