package com.erp.manufacturing.completion.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ProductionOutputType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_completion_line")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionCompletionLine extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_completion_id", nullable = false) private ProductionCompletion productionCompletion;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Enumerated(EnumType.STRING) @Column(name = "output_type", nullable = false) private ProductionOutputType outputType;
    @Column(nullable = false, precision = 19, scale = 6) private BigDecimal quantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "warehouse_id") private UUID warehouseId;
    @Column(name = "location_id") private UUID locationId;
    @Column(name = "batch_id") private UUID batchId;
    @Column(name = "serial_id") private UUID serialId;
    @Column(name = "unit_cost", nullable = false, precision = 19, scale = 4) private BigDecimal unitCost;
    @Column(name = "total_cost", nullable = false, precision = 19, scale = 6) private BigDecimal totalCost;
    @Column(name = "inventory_movement_line_id") private UUID inventoryMovementLineId;
}
