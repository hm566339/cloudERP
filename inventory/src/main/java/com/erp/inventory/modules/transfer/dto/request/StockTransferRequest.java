package com.erp.inventory.modules.transfer.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class StockTransferRequest {
    @NotBlank(message = "transferNo is required")
    @Size(max = 255, message = "transferNo must not exceed 255 characters")
    private String transferNo;
    private LocalDateTime transferDate;
    @NotNull(message = "sourceWarehouseId is required")
    private UUID sourceWarehouseId;
    @NotNull(message = "destinationWarehouseId is required")
    private UUID destinationWarehouseId;
    private String status;
    @NotNull(message = "stockMovementId is required")
    private UUID stockMovementId;
    private String remarks;
    @NotNull(message = "initiatedBy is required")
    private UUID initiatedBy;
    @NotNull(message = "approvedBy is required")
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
    private List<StockTransferLineRequest> lines;
}
