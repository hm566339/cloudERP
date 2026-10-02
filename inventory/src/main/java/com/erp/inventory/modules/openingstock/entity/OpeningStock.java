package com.erp.inventory.modules.openingstock.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "opening_stock")
public class OpeningStock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "opening_stock_no")
    private String openingStockNo;

    @Column(name = "opening_date")
    private LocalDate openingDate;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "status")
    private String status;

    @Column(name = "stock_movement_id")
    private UUID stockMovementId;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Version
    @Column(name = "version")
    private Long version;

}
