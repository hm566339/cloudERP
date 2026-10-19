package com.erp.manufacturing.cost.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ProductionCostStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_cost")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionCost extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @Column(name = "material_cost", nullable = false, precision = 19, scale = 4) private BigDecimal materialCost;
    @Column(name = "labor_cost", nullable = false, precision = 19, scale = 4) private BigDecimal laborCost;
    @Column(name = "machine_cost", nullable = false, precision = 19, scale = 4) private BigDecimal machineCost;
    @Column(name = "overhead_cost", nullable = false, precision = 19, scale = 4) private BigDecimal overheadCost;
    @Column(name = "subcontract_cost", nullable = false, precision = 19, scale = 4) private BigDecimal subcontractCost;
    @Column(name = "scrap_recovery", nullable = false, precision = 19, scale = 4) private BigDecimal scrapRecovery;
    @Column(name = "by_product_credit", nullable = false, precision = 19, scale = 4) private BigDecimal byProductCredit;
    @Column(name = "total_cost", nullable = false, precision = 19, scale = 4) private BigDecimal totalCost;
    @Column(name = "good_output_quantity", nullable = false, precision = 19, scale = 6) private BigDecimal goodOutputQuantity;
    @Column(name = "cost_per_unit", nullable = false, precision = 19, scale = 6) private BigDecimal costPerUnit;
    @Column(name = "currency_code", nullable = false, length = 3) private String currencyCode;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ProductionCostStatus status;
    @Column(name = "calculated_at") private LocalDateTime calculatedAt;
}
