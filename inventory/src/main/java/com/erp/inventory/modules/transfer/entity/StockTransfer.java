package com.erp.inventory.modules.transfer.entity;

import com.erp.inventory.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "stock_transfer")
public class StockTransfer extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "transfer_no")
    private String transferNo;

    @Column(name = "transfer_date")
    private LocalDateTime transferDate;

    @Column(name = "source_warehouse_id")
    private UUID sourceWarehouseId;

    @Column(name = "destination_warehouse_id")
    private UUID destinationWarehouseId;

    @Column(name = "status")
    private String status;

    @Column(name = "stock_movement_id")
    private UUID stockMovementId;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "initiated_by")
    private UUID initiatedBy;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "received_at")
    private LocalDateTime receivedAt;

    @Version
    @Column(name = "version")
    private Long version;

}
