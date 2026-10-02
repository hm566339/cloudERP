package com.erp.manufacturing.productionorder.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_order_output")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionOrderOutput extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @Column(name = "product_id", nullable = false) private UUID productId;
    @Enumerated(EnumType.STRING) @Column(name = "output_type", nullable = false) private ProductionOutputType outputType;
    @Column(name = "planned_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal plannedQuantity;
    @Column(name = "produced_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal producedQuantity;
    @Column(name = "rejected_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal rejectedQuantity;
    @Column(name = "scrap_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal scrapQuantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "warehouse_id") private UUID warehouseId;
    @Column(name = "location_id") private UUID locationId;
    @Column(name = "batch_id") private UUID batchId;
    @Column(name = "serial_id") private UUID serialId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProductionOutputStatus status;
}
