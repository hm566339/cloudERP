package com.erp.inventory.modules.adjustment.entity;

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
@Table(name = "stock_adjustment_line")
public class StockAdjustmentLine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "stock_adjustment_id")
    private UUID stockAdjustmentId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "serial_id")
    private UUID serialId;

    @Column(name = "adjustment_type")
    private String adjustmentType;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    @Column(name = "adjustment_value")
    private BigDecimal adjustmentValue;

}
