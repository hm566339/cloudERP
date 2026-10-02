package com.erp.inventory.modules.transfer.entity;

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
@Table(name = "stock_transfer_line")
public class StockTransferLine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "stock_transfer_id")
    private UUID stockTransferId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "serial_id")
    private UUID serialId;

    @Column(name = "uom_id")
    private UUID uomId;

    @Column(name = "quantity")
    private BigDecimal quantity;

    @Column(name = "unit_cost")
    private BigDecimal unitCost;

    @Column(name = "source_location_id")
    private UUID sourceLocationId;

    @Column(name = "destination_location_id")
    private UUID destinationLocationId;
}
