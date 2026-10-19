package com.erp.manufacturing.scrap.entity;

import com.erp.manufacturing.common.entity.BaseEntity;
import com.erp.manufacturing.common.enums.ScrapStatus;
import com.erp.manufacturing.productionorder.entity.ProductionOrder;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "production_scrap")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductionScrap extends BaseEntity {
    @Column(name = "company_id", nullable = false) private UUID companyId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "production_order_id", nullable = false) private ProductionOrder productionOrder;
    @Column(name = "scrap_product_id", nullable = false) private UUID scrapProductId;
    @Column(nullable = false, precision = 19, scale = 6) private BigDecimal quantity;
    @Column(name = "uom_id", nullable = false) private UUID uomId;
    @Column(name = "warehouse_id") private UUID warehouseId;
    @Column(name = "location_id") private UUID locationId;
    private String reason;
    @Column(name = "scrap_date", nullable = false) private LocalDateTime scrapDate;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ScrapStatus status;
    @Column(name = "inventory_movement_id") private UUID inventoryMovementId;
    @Column(name = "approved_by") private UUID approvedBy;
    @Column(name = "approved_at") private LocalDateTime approvedAt;
}
