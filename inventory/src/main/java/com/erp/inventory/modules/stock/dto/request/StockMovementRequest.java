package com.erp.inventory.modules.stock.dto.request;

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
public class StockMovementRequest {
    @NotBlank(message = "movementNo is required")
    @Size(max = 255, message = "movementNo must not exceed 255 characters")
    private String movementNo;
    private LocalDateTime movementDate;
    @NotBlank(message = "movementType is required")
    @Size(max = 255, message = "movementType must not exceed 255 characters")
    private String movementType;
    private String status;
    @NotNull(message = "referenceType is required")
    private ReferenceType referenceType;
    @NotNull(message = "referenceId is required")
    private UUID referenceId;
    @NotBlank(message = "referenceNumber is required")
    @Size(max = 255, message = "referenceNumber must not exceed 255 characters")
    private String referenceNumber;
    private String remarks;
    @NotNull(message = "totalQuantity is required")
    @Min(value = 0, message = "totalQuantity cannot be negative")
    private BigDecimal totalQuantity;
    @NotNull(message = "totalValue is required")
    private BigDecimal totalValue;
    private LocalDateTime postedAt;
    @NotNull(message = "postedBy is required")
    private UUID postedBy;
    @NotNull(message = "reversedMovementId is required")
    private UUID reversedMovementId;
}
