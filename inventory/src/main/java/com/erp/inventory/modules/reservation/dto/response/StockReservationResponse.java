package com.erp.inventory.modules.reservation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.erp.inventory.modules.product.enums.ReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockReservationResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String reservationNo;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private ReferenceType referenceType;
    private UUID referenceId;
    private UUID referenceLineId;
    private BigDecimal reservedQuantity;
    private BigDecimal releasedQuantity;
    private String status;
    private LocalDateTime expiresAt;
    private UUID idempotencyKey;
}
