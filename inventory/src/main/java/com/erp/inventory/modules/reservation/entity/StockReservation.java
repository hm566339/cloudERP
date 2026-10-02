package com.erp.inventory.modules.reservation.entity;

import com.erp.inventory.common.entity.BaseEntity;
import com.erp.inventory.modules.product.enums.ReferenceType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Data
@EqualsAndHashCode(callSuper = true)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "stock_reservation")
public class StockReservation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "reservation_no")
    private String reservationNo;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "warehouse_id")
    private UUID warehouseId;

    @Column(name = "location_id")
    private UUID locationId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type")
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_line_id")
    private UUID referenceLineId;

    @Column(name = "reserved_quantity")
    private BigDecimal reservedQuantity;

    @Column(name = "released_quantity")
    private BigDecimal releasedQuantity;

    @Column(name = "status")
    private String status;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Version
    @Column(name = "version")
    private Long version;

}
