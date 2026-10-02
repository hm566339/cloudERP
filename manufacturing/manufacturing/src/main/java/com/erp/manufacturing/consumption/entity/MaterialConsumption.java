package com.erp.manufacturing.consumption.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ConsumptionStatus;
import com.erp.manufacturing.productionorder.entity.*;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "material_consumption")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class MaterialConsumption extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_material_id", nullable = false) private ProductionOrderMaterial productionOrderMaterial;
    @Column(name = "component_product_id", nullable = false) private UUID componentProductId;
    @Column(name = "planned_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal plannedQuantity;
    @Column(name = "actual_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal actualQuantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "warehouse_id") private UUID warehouseId;
    @Column(name = "location_id") private UUID locationId;
    @Column(name = "batch_id") private UUID batchId;
    @Column(name = "serial_id") private UUID serialId;
    @Column(name = "consumption_date", nullable = false) private LocalDateTime consumptionDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ConsumptionStatus status;
    @Column(name = "inventory_movement_id") private UUID inventoryMovementId;
    @Column(name = "actual_unit_cost", precision = 19, scale = 6) private BigDecimal actualUnitCost;
    @Column(name = "actual_total_cost", precision = 19, scale = 6) private BigDecimal actualTotalCost;
    @Column(name = "cost_currency", length = 3) private String costCurrency;
    @Enumerated(EnumType.STRING) @Column(name = "cost_source") private com.erp.manufacturing.common.enums.ProductionCostSource costSource;
    @Column(name = "idempotency_key", nullable = false) private String idempotencyKey;
    @Column(columnDefinition = "text") private String remarks;
}
