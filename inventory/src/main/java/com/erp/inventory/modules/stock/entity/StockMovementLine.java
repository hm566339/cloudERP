package com.erp.inventory.modules.stock.entity;

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
@Table(name = "stock_movement_line")
public class StockMovementLine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "stock_movement_id")
    private UUID stockMovementId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "source_warehouse_id")
    private UUID sourceWarehouseId;

    @Column(name = "source_location_id")
    private UUID sourceLocationId;

    @Column(name = "destination_warehouse_id")
    private UUID destinationWarehouseId;

    @Column(name = "destination_location_id")
    private UUID destinationLocationId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "serial_id")
    private UUID serialId;

    @Column(name = "uom_id")
    private UUID uomId;

    @Column(name = "transaction_uom_id")
    private UUID transactionUomId;

    @Column(name = "transaction_quantity", precision = 19, scale = 6)
    private BigDecimal transactionQuantity;

    @Column(name = "conversion_factor", precision = 19, scale = 12)
    private BigDecimal conversionFactor;

    @Column(name = "transaction_unit_cost", precision = 19, scale = 6)
    private BigDecimal transactionUnitCost;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    @Column(name = "total_cost")
    private BigDecimal totalCost;

    @Column(name = "quantity_before")
    private BigDecimal quantityBefore;

    @Column(name = "quantity_after")
    private BigDecimal quantityAfter;

    @Column(name = "reference_line_id")
    private UUID referenceLineId;

}
