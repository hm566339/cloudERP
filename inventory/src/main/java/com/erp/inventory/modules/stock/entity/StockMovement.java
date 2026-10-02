package com.erp.inventory.modules.stock.entity;

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
@Table(name = "stock_movement", uniqueConstraints = {
        @UniqueConstraint(name = "uk_stock_movement_idempotency", columnNames = {"company_id", "idempotency_key"})
})
public class StockMovement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Column(name = "idempotency_key")
    private UUID idempotencyKey;

    @Column(name = "movement_no")
    private String movementNo;

    @Column(name = "movement_date")
    private LocalDateTime movementDate;

    @Column(name = "movement_type")
    private String movementType;

    @Column(name = "status")
    private String status;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type")
    private ReferenceType referenceType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_number")
    private String referenceNumber;

    @Column(name = "remarks")
    private String remarks;

    @Column(name = "total_quantity")
    private BigDecimal totalQuantity;

    @Column(name = "total_value")
    private BigDecimal totalValue;

    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    @Column(name = "posted_by")
    private UUID postedBy;

    @Column(name = "reversed_movement_id")
    private UUID reversedMovementId;

    @Version
    @Column(name = "version")
    private Long version;

}

