package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReservationInventoryRequest {
    private String reservationNo;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private String referenceType;
    private UUID referenceId;
    private UUID referenceLineId;
    private BigDecimal reservedQuantity;
    private BigDecimal releasedQuantity;
    private String status;
    private LocalDateTime expiresAt;
    private UUID idempotencyKey;
}
