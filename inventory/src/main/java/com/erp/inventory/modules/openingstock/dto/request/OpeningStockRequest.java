package com.erp.inventory.modules.openingstock.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class OpeningStockRequest {
    @NotBlank(message = "openingStockNo is required")
    @Size(max = 255, message = "openingStockNo must not exceed 255 characters")
    private String openingStockNo;
    private LocalDate openingDate;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    private String status;
    @NotNull(message = "lines are required")
    @Size(min = 1, message = "At least one line is required")
    private List<OpeningStockLineRequest> lines;
    private String remarks;
    @NotNull(message = "approvedBy is required")
    private UUID approvedBy;
    private LocalDateTime approvedAt;
}
