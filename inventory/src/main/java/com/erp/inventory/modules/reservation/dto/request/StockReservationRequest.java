package com.erp.inventory.modules.reservation.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ReferenceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class StockReservationRequest {
    @NotBlank(message = "reservationNo is required")
    @Size(max = 255, message = "reservationNo must not exceed 255 characters")
    private String reservationNo;
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    @NotNull(message = "locationId is required")
    private UUID locationId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @NotNull(message = "referenceType is required")
    private ReferenceType referenceType;
    @NotNull(message = "referenceId is required")
    private UUID referenceId;
    @NotNull(message = "referenceLineId is required")
    private UUID referenceLineId;
    @NotNull(message = "reservedQuantity is required")
    @Min(value = 0, message = "reservedQuantity cannot be negative")
    private BigDecimal reservedQuantity;
    @NotNull(message = "releasedQuantity is required")
    @Min(value = 0, message = "releasedQuantity cannot be negative")
    private BigDecimal releasedQuantity;
    private String status;
    private LocalDateTime expiresAt;
}
