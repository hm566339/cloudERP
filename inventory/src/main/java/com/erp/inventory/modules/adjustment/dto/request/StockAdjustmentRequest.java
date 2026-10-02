package com.erp.inventory.modules.adjustment.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class StockAdjustmentRequest {
    @NotBlank(message = "adjustmentNo is required")
    @Size(max = 255, message = "adjustmentNo must not exceed 255 characters")
    private String adjustmentNo;
    private LocalDateTime adjustmentDate;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    @NotNull(message = "locationId is required")
    private UUID locationId;
    @NotBlank(message = "reason is required")
    @Size(max = 255, message = "reason must not exceed 255 characters")
    private String reason;
    private String remarks;
    private String status;
    @NotNull(message = "stockMovementId is required")
    private UUID stockMovementId;
    @NotNull(message = "approvedBy is required")
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    @NotNull(message = "lines are required")
    private List<StockAdjustmentLineRequest> lines;
}
