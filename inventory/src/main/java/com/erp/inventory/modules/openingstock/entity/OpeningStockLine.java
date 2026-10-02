package com.erp.inventory.modules.openingstock.entity;

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
@Table(name = "opening_stock_line")
public class OpeningStockLine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "opening_stock_id")
    private UUID openingStockId;

    @Column(name = "warehouse_location_id")
    private UUID warehouseLocationId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "serial_id")
    private UUID serialId;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    @Column(name = "total_value")
    private BigDecimal totalValue;

    @Column(name = "uom_id")
    private UUID uomId;

}
